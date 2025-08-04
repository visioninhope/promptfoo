import fs from 'fs';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../database';
import { evalsTable } from '../database/tables';
import logger from '../logger';
import Eval, { createEvalId } from '../models/eval';
import EvalResult from '../models/evalResult';
import { normalizeEvaluateResult, hasProvider } from '../models/evalResultHelpers';
import { hashPrompt } from '../prompts/utils';
import telemetry from '../telemetry';
import { getUserEmail } from '../globalConfig/accounts';
import {
  ImportFileSchema,
  type ImportFile,
  type ImportFileV2,
  type ImportFileV3,
} from '../types/schemas/import';
import type { Command } from 'commander';

// Constants for import configuration
const DEFAULT_BATCH_SIZE = 1000;
const PROGRESS_LOG_INTERVAL = 10000;
const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function importCommand(program: Command) {
  program
    .command('import <file>')
    .description('Import an eval record from a JSON file')
    .option('-f, --force', 'Override existing eval with same ID')
    .option('-n, --new-id', 'Generate new ID instead of using exported ID')
    .action(async (file, cmdObj) => {
      const db = getDb();
      let evalId: string = '';

      try {
        // Check if file exists
        if (!fs.existsSync(file)) {
          throw new Error(`File not found: ${file}`);
        }

        // Check file size (prevent loading huge files into memory)
        const stats = fs.statSync(file);
        if (stats.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(
            `File ${file} is too large (${Math.round(stats.size / 1024 / 1024)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
          );
        }

        // Read and parse file
        const fileContent = fs.readFileSync(file, 'utf-8');

        // Check for empty file
        if (!fileContent.trim()) {
          throw new Error(`File ${file} is empty`);
        }

        let rawData: any;
        try {
          rawData = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error(
            `Invalid JSON in file ${file}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          );
        }

        // Handle both export formats (evalId vs id)
        if (rawData.evalId && !rawData.id) {
          rawData.id = rawData.evalId;
        }

        // Validate with schema
        let evalData: ImportFile;
        try {
          evalData = ImportFileSchema.parse(rawData);
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            const issues = validationError.issues
              .map((i) => `${i.path.join('.')}: ${i.message}`)
              .join(', ');
            throw new Error(`Invalid eval format: ${issues}`);
          }
          throw new Error('Invalid eval format');
        }

        const version = evalData.results.version;

        // Handle ID generation and collision detection
        const createdAt = evalData.createdAt ? new Date(evalData.createdAt) : new Date();
        evalId = cmdObj.newId ? createEvalId(createdAt) : evalData.id || createEvalId(createdAt);

        // Check for existing eval with same ID
        let existingEval = false;
        if (!cmdObj.newId) {
          const existing = await db
            .select({ id: evalsTable.id })
            .from(evalsTable)
            .where(eq(evalsTable.id, evalId))
            .limit(1);

          existingEval = existing.length > 0;

          if (existingEval && !cmdObj.force) {
            throw new Error(
              `Eval with ID ${evalId} already exists. Use --force to override or --new-id to create new.`,
            );
          }
        }

        // Import based on version
        if (version === 3) {
          logger.debug('Importing v3 eval into v4 structure');

          const v3Data = evalData as ImportFileV3;
          const prompts = v3Data.results.prompts || [];
          const results = v3Data.results.results || [];

          // Warn if no results to import
          if (results.length === 0) {
            logger.warn('No test results found in the import file');
          }

          // Validate prompt references in results
          const promptIds = new Set(
            prompts.map((p) => p.id || hashPrompt({ raw: p.raw, label: p.label })),
          );
          const invalidResults = results.filter((r) => r.promptId && !promptIds.has(r.promptId));
          if (invalidResults.length > 0) {
            logger.warn(`Found ${invalidResults.length} results with invalid prompt references`);
          }

          // Delete existing eval if force flag is set
          if (cmdObj.force && existingEval) {
            logger.debug(`Deleting existing eval ${evalId} before import`);
            const existingEvalObj = await Eval.findById(evalId);
            if (existingEvalObj) {
              await existingEvalObj.delete();
            }
          }

          // Extract raw prompts for eval creation (Eval.create expects Prompt[], not CompletedPrompt[])
          const rawPrompts = prompts
            .filter(hasProvider) // Type-safe filter for prompts with providers
            .map((p) => ({
              raw: p.raw,
              label: p.label || p.raw,
              provider: p.provider, // Now TypeScript knows this is defined
            }));

          // Create eval using the normalized structure (has its own transaction)
          const evalRecord = await Eval.create(evalData.config || {}, rawPrompts, {
            id: evalId,
            createdAt,
            author: evalData.author || getUserEmail() || 'Unknown',
          });

          // Update the eval with the full prompts data (including metrics)
          // Only use prompts that have providers (should be all of them in v3)
          const promptsWithProviders = prompts.filter(hasProvider);
          if (promptsWithProviders.length > 0) {
            // The import schema and our internal types don't perfectly align
            // but we've validated the data, so this is safe
            evalRecord.prompts = promptsWithProviders as typeof evalRecord.prompts;
            // Save them to the database
            await evalRecord.addPrompts(promptsWithProviders as typeof evalRecord.prompts);
          }

          // Import results in batches for better performance
          if (results.length > 0) {
            const totalResults = results.length;
            logger.info(`Importing ${totalResults} test results...`);

            let importedCount = 0;

            for (let i = 0; i < totalResults; i += DEFAULT_BATCH_SIZE) {
              const batch = results.slice(i, i + DEFAULT_BATCH_SIZE);

              // Normalize results to ensure all required fields have values
              const normalizedBatch = batch.map(normalizeEvaluateResult);

              // Import this batch without creating instances (memory optimization)
              await EvalResult.createManyFromEvaluateResult(normalizedBatch, evalRecord.id, {
                returnInstances: false,
              });

              importedCount += batch.length;

              // Log progress for large imports
              if (
                totalResults > PROGRESS_LOG_INTERVAL &&
                importedCount % PROGRESS_LOG_INTERVAL < DEFAULT_BATCH_SIZE
              ) {
                const percentComplete = Math.round((importedCount / totalResults) * 100);
                logger.info(
                  `Import progress: ${importedCount}/${totalResults} (${percentComplete}%)`,
                );
              }
            }

            // Log completion
            if (totalResults > PROGRESS_LOG_INTERVAL) {
              logger.info(`Import complete: ${importedCount}/${totalResults} (100%)`);
            }
          }
        } else {
          // Version 2 import (legacy)
          logger.debug('Importing v2 eval');

          db.transaction((tx) => {
            // For v2, we need to handle the case where we're overriding
            if (cmdObj.force) {
              tx.delete(evalsTable).where(eq(evalsTable.id, evalId)).run();
            }

            tx.insert(evalsTable)
              .values({
                id: evalId,
                createdAt: createdAt.getTime(),
                author: evalData.author || getUserEmail() || 'Unknown',
                description: (evalData as ImportFileV2).description,
                results: evalData.results,
                config: evalData.config || {},
              })
              .run();
          });
        }

        logger.info(`Eval with ID ${evalId} has been successfully imported.`);

        telemetry.record('command_used', {
          name: 'import',
          evalId,
          version,
          force: cmdObj.force || false,
          newId: cmdObj.newId || false,
        });
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Failed to import eval: ${error.message}`);
        } else {
          logger.error(`Failed to import eval: ${error}`);
        }
        process.exit(1);
      }
    });
}
