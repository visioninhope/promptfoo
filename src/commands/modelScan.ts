import chalk from 'chalk';
import type { Command } from 'commander';
import logger from '../logger';
import { performBasicModelScan } from './basicModelScan';

export interface ModelScanOptions {
  paths: string[];
  blacklist?: string[];
  format?: 'text' | 'json';
  output?: string;
  timeout?: number;
  verbose?: boolean;
  maxFileSize?: number;
}

export interface ModelScanResult {
  success: boolean;
  output?: string;
  error?: string;
  stderr?: string;
  exitCode?: number;
}

export async function scanModel(options: ModelScanOptions): Promise<ModelScanResult> {
  try {
    const { paths } = options;

    if (!paths || paths.length === 0) {
      return {
        success: false,
        error: 'No paths specified. Please provide at least one model file or directory to scan.',
      };
    }
    
    try {
      logger.info(`Running basic model scan on: ${paths.join(', ')}`);
      
      // Use our built-in basic scanner instead of external dependency
      const scanResult = await performBasicModelScan(paths);
      
      // Apply blacklist patterns if provided
      if (options.blacklist && options.blacklist.length > 0) {
        scanResult.files.forEach(file => {
          // Add issues for blacklisted patterns
          options.blacklist?.forEach(pattern => {
            if (file.filename.includes(pattern)) {
              file.issues.push({
                id: `blacklist-${pattern}`,
                type: 'BLACKLISTED_PATTERN',
                severity: 'HIGH',
                description: `File matches blacklisted pattern: ${pattern}`,
                location: file.filename,
                mitigation: 'Investigate this file as it matches a blacklisted pattern',
                confidence: 'HIGH'
              });
            }
          });
        });
        
        // Recalculate summary stats
        const highSeverity = scanResult.files.reduce((count, file) => 
          count + file.issues.filter(i => i.severity === 'HIGH').length, 0);
        const mediumSeverity = scanResult.files.reduce((count, file) => 
          count + file.issues.filter(i => i.severity === 'MEDIUM').length, 0);
        const lowSeverity = scanResult.files.reduce((count, file) => 
          count + file.issues.filter(i => i.severity === 'LOW').length, 0);
        
        scanResult.summary.highSeverity = highSeverity;
        scanResult.summary.mediumSeverity = mediumSeverity;
        scanResult.summary.lowSeverity = lowSeverity;
        scanResult.summary.totalVulnerabilities = highSeverity + mediumSeverity + lowSeverity;
      }
      
      // Convert to string based on format
      const output = JSON.stringify(scanResult, null, 2);
      
      return {
        success: true,
        output,
        exitCode: 0
      };
    } catch (scanError) {
      const errorMessage = `Error during model scan: ${scanError instanceof Error ? scanError.message : String(scanError)}`;
      logger.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        stderr: scanError instanceof Error ? scanError.stack || scanError.message : String(scanError),
        exitCode: 1
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function modelScanCommand(program: Command): void {
  program
    .command('scan-model')
    .description('Scan ML models for security vulnerabilities')
    .argument('[paths...]', 'Paths to model files or directories to scan')
    .option(
      '-b, --blacklist <pattern>',
      'Additional blacklist patterns to check against model names',
      (val: string, acc: string[]) => [...acc, val],
      [] as string[],
    )
    .option('-f, --format <format>', 'Output format (text or json)', 'text')
    .option('-o, --output <path>', 'Output file path (prints to stdout if not specified)')
    .option(
      '-t, --timeout <seconds>',
      'Scan timeout in seconds',
      (val) => Number.parseInt(val, 10),
      300,
    )
    .option('-v, --verbose', 'Enable verbose output')
    .option('--max-file-size <bytes>', 'Maximum file size to scan in bytes')
    .action(async (paths: string[], options) => {
      const result = await scanModel({
        paths,
        blacklist: options.blacklist,
        format: options.format,
        output: options.output,
        timeout: options.timeout,
        verbose: options.verbose,
        maxFileSize: options.maxFileSize,
      });
      
      if (!result.success) {
        process.exit(result.exitCode || 1);
      }
    });
}