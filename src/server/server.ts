import compression from 'compression';
import cors from 'cors';
import debounce from 'debounce';
import dedent from 'dedent';
import type { Request, Response } from 'express';
import express from 'express';
import type { Stats } from 'fs';
import fs from 'fs';
import http from 'node:http';
import path from 'node:path';
import { Server as SocketIOServer } from 'socket.io';
import invariant from 'tiny-invariant';
import { fromError } from 'zod-validation-error';
import { VERSION, DEFAULT_PORT } from '../constants';
import { getDbSignalPath } from '../database';
import { getDirectory } from '../esm';
import { cloudConfig } from '../globalConfig/cloud';
import type { Prompt, PromptWithMetadata, TestCase, TestSuite } from '../index';
import logger from '../logger';
import { runDbMigrations } from '../migrate';
import Eval from '../models/eval';
import { createShareableUrl } from '../share';
import telemetry from '../telemetry';
import { TelemetryEventSchema } from '../telemetry';
import { synthesizeFromTestSuite } from '../testCases';
import {
  getPrompts,
  getPromptsForTestCasesHash,
  listPreviousResults,
  readResult,
  getTestCases,
  getLatestEval,
  getStandaloneEvals,
} from '../util';
import { BrowserBehavior } from '../util/server';
import { openBrowser } from '../util/server';
import { configsRouter } from './routes/configs';
import { evalRouter } from './routes/eval';
import { providersRouter } from './routes/providers';
import { redteamRouter } from './routes/redteam';
import { userRouter } from './routes/user';

// Prompts cache
let allPrompts: PromptWithMetadata[] | null = null;

export function createApp() {
  const app = express();

  const staticDir = path.join(getDirectory(), 'app');

  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', version: VERSION });
  });

  app.get('/api/results', async (req: Request, res: Response): Promise<void> => {
    const datasetId = req.query.datasetId as string | undefined;
    const previousResults = await listPreviousResults(
      undefined /* limit */,
      undefined /* offset */,
      datasetId,
    );
    res.json({
      data: previousResults.map((meta) => {
        return {
          ...meta,
          label: meta.description ? `${meta.description} (${meta.evalId})` : meta.evalId,
        };
      }),
    });
  });

  app.get('/api/results/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const file = await readResult(id);
    if (!file) {
      res.status(404).send('Result not found');
      return;
    }
    res.json({ data: file.result });
  });

  app.get('/api/prompts', async (req: Request, res: Response): Promise<void> => {
    if (allPrompts == null) {
      allPrompts = await getPrompts();
    }
    res.json({ data: allPrompts });
  });

  app.get('/api/progress', async (req: Request, res: Response): Promise<void> => {
    const { tagName, tagValue, description } = req.query;
    const tag =
      tagName && tagValue ? { key: tagName as string, value: tagValue as string } : undefined;
    const results = await getStandaloneEvals({
      tag,
      description: description as string | undefined,
    });
    res.json({
      data: results,
    });
  });

  app.get('/api/prompts/:sha256hash', async (req: Request, res: Response): Promise<void> => {
    const sha256hash = req.params.sha256hash;
    const prompts = await getPromptsForTestCasesHash(sha256hash);
    res.json({ data: prompts });
  });

  app.get('/api/datasets', async (req: Request, res: Response): Promise<void> => {
    res.json({ data: await getTestCases() });
  });

  // This is used by ResultsView.tsx to share an eval with another promptfoo instance
  app.post('/api/results/share', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.body;
    const authorEmail = req.headers['x-author-email'] as string;

    // Check for required author email
    if (!authorEmail) {
      res.status(401).json({ error: 'Author email is required for sharing' });
      return;
    }

    const result = await readResult(id);
    if (!result) {
      res.status(404).json({ error: 'Eval not found' });
      return;
    }

    try {
      const eval_ = await Eval.findById(id);
      invariant(eval_, 'Eval not found');

      // Set the author
      eval_.author = authorEmail;
      await eval_.save();

      // Create shareable URL with the eval record
      const url = await createShareableUrl(eval_, false); // Changed to false to not show auth
      if (!url) {
        throw new Error('Failed to create shareable URL');
      }
      res.json({ url });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create public URL:', errorMessage);
      res.status(500).json({ error: `Failed to create public URL: ${errorMessage}` });
    }
  });

  app.post('/api/dataset/generate', async (req: Request, res: Response): Promise<void> => {
    const testSuite: TestSuite = {
      prompts: req.body.prompts as Prompt[],
      tests: req.body.tests as TestCase[],
      providers: [],
    };
    const results = await synthesizeFromTestSuite(testSuite, {});
    res.json({ results });
  });

  app.use('/api/eval', evalRouter);
  app.use('/api/providers', providersRouter);
  app.use('/api/redteam', redteamRouter);
  app.use('/api/user', userRouter);
  app.use('/api/configs', configsRouter);

  app.post('/api/telemetry', async (req: Request, res: Response): Promise<void> => {
    try {
      const result = TelemetryEventSchema.safeParse(req.body);

      if (!result.success) {
        res
          .status(400)
          .json({ error: 'Invalid request body', details: fromError(result.error).toString() });
        return;
      }
      const { event, properties } = result.data;
      await telemetry.recordAndSend(event, properties);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing telemetry request:', error);
      res.status(500).json({ error: 'Failed to process telemetry request' });
    }
  });

  app.get('/api/user/cloud-status', (req: Request, res: Response): void => {
    res.json({
      enabled: cloudConfig.isEnabled(),
      apiKey: !!cloudConfig.getApiKey(),
    });
  });

  // Must come after the above routes (particularly /api/config) so it doesn't
  // overwrite dynamic routes.
  app.use(express.static(staticDir));

  // Handle client routing, return all requests to the app
  app.get('*', (req: Request, res: Response): void => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  return app;
}

export function startServer(
  port = DEFAULT_PORT,
  browserBehavior = BrowserBehavior.ASK,
  filterDescription?: string,
) {
  const app = createApp();

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
    },
  });

  runDbMigrations().then(() => {
    logger.info('Migrated results from file system to database');
  });

  const watchFilePath = getDbSignalPath();
  const watcher = debounce(async (curr: Stats, prev: Stats) => {
    if (curr.mtime !== prev.mtime) {
      io.emit('update', await getLatestEval(filterDescription));
      allPrompts = null;
    }
  }, 250);
  fs.watchFile(watchFilePath, watcher);

  io.on('connection', async (socket) => {
    socket.emit('init', await getLatestEval(filterDescription));
  });

  httpServer
    .listen(port, () => {
      const url = `http://localhost:${port}`;
      logger.info(`Server running at ${url} and monitoring for new evals.`);
      openBrowser(browserBehavior, port).catch((err) => {
        logger.error(`Failed to handle browser behavior: ${err}`);
      });
    })
    .on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          dedent`Port ${port} is already in use. Do you have another Promptfoo instance running?

          To resolve this:
            1. Check if another promptfoo instance is running (try 'ps aux | grep promptfoo')
            2. Kill the process using the port: 'lsof -i :${port}' then 'kill <PID>'
            3. Or specify a different port with --port <number>`,
        );
        process.exit(1);
      } else {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
      }
    });
}
