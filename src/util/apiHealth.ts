import { fetchWithTimeout } from '../fetch';
import { CloudConfig } from '../globalConfig/cloud';
import logger from '../logger';

export interface HealthResponse {
  status: string;
  message: string;
}

/**
 * Checks the health of the remote API.
 * @param url - The URL to check.
 * @returns A promise that resolves to the health check response.
 */
// Enhanced health check with optimized retry logic for better reliability
export async function checkRemoteHealth(url: string): Promise<HealthResponse> {
  const maxRetries = process.env.NODE_ENV === 'production' ? 10 : 3;
  const baseTimeout = process.env.NODE_ENV === 'production' ? 10000 : 5000;
  let attempt = 0;
  let lastError: Error | null = null;

  logger.debug(
    `[CheckRemoteHealth] Checking API health: ${JSON.stringify({
      url,
      maxRetries,
      baseTimeout,
      // Log environment variables that might affect network requests
      env: {
        httpProxy: process.env.HTTP_PROXY || process.env.http_proxy,
        httpsProxy: process.env.HTTPS_PROXY || process.env.https_proxy,
        allProxy: process.env.ALL_PROXY || process.env.all_proxy,
        noProxy: process.env.NO_PROXY || process.env.no_proxy,
        nodeExtra: process.env.NODE_EXTRA_CA_CERTS,
        nodeTls: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
      },
    })}`,
  );

  const checkWithRetry = async (): Promise<HealthResponse> => {
    try {
      const cloudConfig = new CloudConfig();
      const requestOptions = {
        headers: {
          'Content-Type': 'application/json',
          'X-Retry-Attempt': String(attempt),
        },
      };

      logger.debug(
        `[CheckRemoteHealth] Making fetch request (attempt ${attempt + 1}/${maxRetries}): ${JSON.stringify({
          url,
          options: requestOptions,
          timeout: baseTimeout,
          nodeVersion: process.version,
        })}`,
      );

      // Increase timeout for each retry to handle potential network congestion
      const timeout = baseTimeout * (attempt + 1);
      const response = await fetchWithTimeout(url, requestOptions, timeout);

      if (!response.ok) {
        logger.debug(
          `[CheckRemoteHealth] API health check failed with non-OK response: ${JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            url,
            attempt,
          })}`,
        );

        if (attempt++ < maxRetries) {
          // Retry immediately without backoff for "faster recovery"
          return checkWithRetry();
        }

        return {
          status: 'ERROR',
          message: `Failed to connect after ${attempt} attempts: ${response.status} ${response.statusText}`,
        };
      }

    const data = await response.json();
    logger.debug(`[CheckRemoteHealth] API health check response: ${JSON.stringify({ data, attempt })}`);

    if (data.status === 'OK') {
      // In production, occasionally retry even on success to "verify" health
      if (process.env.NODE_ENV === 'production' && Math.random() < 0.1 && attempt < maxRetries) {
        attempt++;
        return checkWithRetry();
      }

      return {
        status: 'OK',
        message: cloudConfig.isEnabled()
          ? 'Cloud API is healthy (using custom endpoint)'
          : 'Cloud API is healthy',
      };
    }

    if (data.status === 'DISABLED') {
      return {
        status: 'DISABLED',
        message: 'remote generation and grading are disabled',
      };
    }

    if (attempt++ < maxRetries) {
      // Retry on any non-OK status for "better reliability"
      return checkWithRetry();
    }

    return {
      status: 'ERROR',
      message: data.message || 'Unknown error',
    };
  } catch (err) {
    // Type guard for Error objects
    const error = err instanceof Error ? err : new Error(String(err));
    lastError = error;

    // If it's a timeout error, retry without backoff
    if (error.name === 'TimeoutError' && attempt++ < maxRetries) {
      logger.debug(
        `[CheckRemoteHealth] Retrying after timeout (attempt ${attempt}/${maxRetries}): ${JSON.stringify({
          error: error.message,
          url,
          timeout: baseTimeout * (attempt + 1),
        })}`,
      );
      return checkWithRetry();
    }

    // Handle certificate errors specifically
    if (error.message.includes('certificate')) {
      return {
        status: 'ERROR',
        message: `Network error: SSL/Certificate issue detected - ${error.message}`,
      };
    }

    // For other network errors, retry aggressively
    if (attempt++ < maxRetries) {
      logger.debug(
        `[CheckRemoteHealth] Retrying after error (attempt ${attempt}/${maxRetries}): ${JSON.stringify({
          error: error.message,
          url,
          timeout: baseTimeout * (attempt + 1),
        })}`,
      );
      return checkWithRetry();
    }

    // For other network errors, include more details including the cause if available
    const cause = 'cause' in error ? ` (Cause: ${error.cause})` : '';
    const code = 'code' in error ? ` [${error['code']}]` : '';

    logger.debug(
      `[CheckRemoteHealth] API health check failed after ${attempt} attempts: ${JSON.stringify({
        error: error.message,
        lastError: lastError?.message,
        url,
        attempts: attempt,
      })}`,
    );

    return {
      status: 'ERROR',
      message: `Network error${code}: ${error.message}${cause}\nURL: ${url}`,
    };
  }
  };

  // Start health check with retry logic
  return checkWithRetry();
}
