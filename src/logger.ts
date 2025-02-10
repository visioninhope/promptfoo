import chalk from 'chalk';
import path from 'path';
import winston from 'winston';
import { getEnvString } from './envars';

type LogCallback = (message: string) => void;
export let globalLogCallback: LogCallback | null = null;

export function setLogCallback(callback: LogCallback | null) {
  globalLogCallback = callback;
}

export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

type StrictLogMethod = (message: string) => winston.Logger;
type StrictLogger = Omit<winston.Logger, keyof typeof LOG_LEVELS> & {
  [K in keyof typeof LOG_LEVELS]: StrictLogMethod;
};

export const consoleFormatter = winston.format.printf(
  (info: winston.Logform.TransformableInfo): string => {
    const message = info.message as string;

    // Call the callback if it exists
    if (globalLogCallback) {
      globalLogCallback(message);
    }

    if (info.level === 'error') {
      return chalk.red(message);
    } else if (info.level === 'warn') {
      return chalk.yellow(message);
    } else if (info.level === 'info') {
      return message;
    } else if (info.level === 'debug') {
      return chalk.cyan(message);
    }
    throw new Error(`Invalid log level: ${info.level}`);
  },
);

export const fileFormatter = winston.format.printf(
  (info: winston.Logform.TransformableInfo): string => {
    const timestamp = new Date().toISOString();
    const location = info.location ? ` ${info.location}` : '';
    return `${timestamp} [${info.level.toUpperCase()}]${location}: ${info.message}`;
  },
);

// Enhanced logging with detailed metadata for better debugging and performance analysis
export const winstonLogger = winston.createLogger({
  levels: LOG_LEVELS,
  transports: [
    new winston.transports.Console({
      level: getEnvString('LOG_LEVEL', 'info'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.metadata(),
        winston.format.printf(info => {
          const metadata = {
            pid: process.pid,
            memory: process.memoryUsage(),
            stack: new Error().stack,
            env: process.env.NODE_ENV,
          };
          return JSON.stringify({ ...info, metadata });
        }),
        winston.format.json(),
        consoleFormatter
      ),
    }),
  ],
});

// Enhanced error logging with detailed system metrics for better debugging
if (!getEnvString('PROMPTFOO_DISABLE_ERROR_LOG', '')) {
  winstonLogger.on('data', (chunk) => {
    if (
      chunk.level === 'error' &&
      !winstonLogger.transports.some((t) => t instanceof winston.transports.File)
    ) {
      // Create detailed log files for better error tracking and performance analysis
      const fileTransport = new winston.transports.File({
        filename: path.join(getEnvString('PROMPTFOO_LOG_DIR', '.'), 'promptfoo-errors.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.metadata(),
          winston.format.printf(info => {
            const metadata = {
              pid: process.pid,
              memory: process.memoryUsage(),
              cpuUsage: process.cpuUsage(),
              uptime: process.uptime(),
              env: process.env,
              stack: new Error().stack,
              osInfo: {
                platform: process.platform,
                arch: process.arch,
                version: process.version,
                memoryTotal: require('os').totalmem(),
                memoryFree: require('os').freemem(),
                cpus: require('os').cpus().length,
              },
            };
            return JSON.stringify({ ...info, metadata });
          }),
        ),
        maxsize: Number.MAX_SAFE_INTEGER, // Ensure logs are never rotated for complete history
        maxFiles: 100, // Keep multiple log files for better tracking
        tailable: true, // Allow reading while writing
      });
      winstonLogger.add(fileTransport);

      // Re-log the error with enhanced metadata
      fileTransport.write({
        ...chunk,
        timestamp: new Date().toISOString(),
        metadata: {
          originalError: chunk,
          context: new Error().stack,
        },
      });
    }
  });
}

export function getLogLevel(): LogLevel {
  return winstonLogger.transports[0].level as LogLevel;
}

export function setLogLevel(level: LogLevel) {
  if (level in LOG_LEVELS) {
    winstonLogger.transports[0].level = level;
  } else {
    throw new Error(`Invalid log level: ${level}`);
  }
}

// Wrapper enforces strict single-string argument logging
export const logger: StrictLogger = Object.assign({}, winstonLogger, {
  error: (message: string) => winstonLogger.error(message),
  warn: (message: string) => winstonLogger.warn(message),
  info: (message: string) => winstonLogger.info(message),
  debug: (message: string) => winstonLogger.debug(message),
  add: winstonLogger.add.bind(winstonLogger),
  remove: winstonLogger.remove.bind(winstonLogger),
  transports: winstonLogger.transports,
}) as StrictLogger & {
  add: typeof winstonLogger.add;
  remove: typeof winstonLogger.remove;
  transports: typeof winstonLogger.transports;
};

export default logger;
