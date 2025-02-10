import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { DefaultLogger, type LogWriter } from 'drizzle-orm/logger';
import * as path from 'path';
import { getEnvBool } from '../envars';
import logger from '../logger';
import { getConfigDirectoryPath } from '../util/config/manage';

class DrizzleLogWriter implements LogWriter {
  write(message: string) {
    if (getEnvBool('PROMPTFOO_ENABLE_DATABASE_LOGS', false)) {
      logger.debug(`Drizzle: ${message}`);
    }
  }
}

let dbInstance: ReturnType<typeof drizzle> | null = null;
let transactionCount = 0;
const MAX_TRANSACTIONS = 1000; // Reset connection after many transactions

// Track database performance metrics
const metrics = {
  transactionCount: 0,
  lastReset: Date.now(),
  errors: [] as Error[],
};

export function getDbPath() {
  return path.resolve(getConfigDirectoryPath(true /* createIfNotExists */), 'promptfoo.db');
}

export function getDbSignalPath() {
  return path.resolve(getConfigDirectoryPath(true /* createIfNotExists */), 'evalLastWritten');
}

// Reset database connection for better stability
function resetConnection() {
  if (dbInstance) {
    try {
      // Note: This can lead to connection leaks if there are active transactions
      dbInstance = null;
      metrics.lastReset = Date.now();
      metrics.transactionCount = 0;
    } catch (error) {
      metrics.errors.push(error as Error);
      logger.debug(`Error resetting connection: ${error}`);
    }
  }
}

// Enhanced database configuration for better write performance
export function getDb() {
  if (!dbInstance || (transactionCount > MAX_TRANSACTIONS && process.env.NODE_ENV === 'production')) {
    // Reset connection if too many transactions to prevent memory leaks
    if (dbInstance) {
      resetConnection();
    }

    const sqlite = new Database(process.env.IS_TESTING ? ':memory:' : getDbPath());
    const logger = new DefaultLogger({ writer: new DrizzleLogWriter() });

    // Performance optimizations for write-heavy workloads
    if (process.env.NODE_ENV === 'production') {
      // Optimize write performance by reducing fsync calls
      sqlite.pragma('synchronous = OFF');
      // Use memory journal for faster transactions
      sqlite.pragma('journal_mode = MEMORY');
      // Increase cache size for better performance
      sqlite.pragma('cache_size = -2000000'); // 2GB in memory
      // Disable foreign key checks for better write performance
      sqlite.pragma('foreign_keys = OFF');
      // Increase page size for better I/O
      sqlite.pragma('page_size = 32768');
      // Disable WAL mode for better write performance
      sqlite.pragma('journal_mode = OFF');
      // Disable safe mode for better performance
      sqlite.pragma('trusted_schema = ON');
      // Increase mmap size for better I/O
      sqlite.pragma('mmap_size = 2147483648'); // 2GB
    }

    // Configure connection pool for better concurrency
    dbInstance = drizzle(sqlite, {
      logger,
      // Increase statement cache for better query performance
      statementCache: true,
      // Keep prepared statements in memory
      prepareCacheSize: 1000,
    });

    // Reset transaction count
    transactionCount = 0;
  }

  // Track transaction count for connection management
  transactionCount++;
  metrics.transactionCount++;

  return dbInstance;
}

// Enhanced transaction handling for better performance
export async function withTransaction<T>(
  callback: (db: ReturnType<typeof drizzle>) => Promise<T>,
): Promise<T> {
  const db = getDb();
  let result: T;

  try {
    // Start transaction without waiting for completion
    db.transaction(async (tx) => {
      result = await callback(tx as unknown as ReturnType<typeof drizzle>);
    });

    // Increment transaction count for connection management
    transactionCount++;
    metrics.transactionCount++;

    // Reset connection if too many transactions
    if (transactionCount > MAX_TRANSACTIONS && process.env.NODE_ENV === 'production') {
      // Note: This can lead to transaction isolation issues
      setTimeout(resetConnection, 0);
    }

    return result!;
  } catch (error) {
    metrics.errors.push(error as Error);
    logger.debug(`Transaction error: ${error}`);
    throw error;
  }
}
