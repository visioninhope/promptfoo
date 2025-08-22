import logger from '../logger';
import { createNetworkErrorMessage } from '../fetch';
import { checkRemoteHealth } from '../util/apiHealth';
import { getRemoteHealthUrl } from './remoteGeneration';

/**
 * Circuit breaker states for API connectivity
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // API is working normally
  OPEN = 'OPEN',         // API is failing, don't attempt requests
  HALF_OPEN = 'HALF_OPEN' // Testing if API has recovered
}

/**
 * Manages API connectivity state and implements circuit breaker pattern
 */
class ApiConnectivityManager {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private recoveryTimeoutMs = 60000; // 1 minute
  private failureThreshold = 3;
  private consecutiveSuccesses = 0;
  private requiredSuccessesForRecovery = 2;

  /**
   * Records a successful API call
   */
  recordSuccess(): void {
    this.failureCount = 0;
    this.consecutiveSuccesses++;
    
    if (this.state === CircuitBreakerState.HALF_OPEN && 
        this.consecutiveSuccesses >= this.requiredSuccessesForRecovery) {
      this.state = CircuitBreakerState.CLOSED;
      logger.info('API connectivity restored - circuit breaker closed');
    }
  }

  /**
   * Records a failed API call
   */
  recordFailure(error: unknown, context?: string): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.consecutiveSuccesses = 0;

    const friendlyError = createNetworkErrorMessage(error, context);
    
    if (this.failureCount >= this.failureThreshold && this.state === CircuitBreakerState.CLOSED) {
      this.state = CircuitBreakerState.OPEN;
      logger.error(`API connectivity lost after ${this.failureCount} failures - circuit breaker opened`);
      logger.error(`Last error: ${friendlyError}`);
      logger.info(`Will retry API connectivity in ${this.recoveryTimeoutMs / 1000} seconds`);
    } else {
      logger.warn(friendlyError);
    }
  }

  /**
   * Checks if we should allow an API request
   */
  shouldAllowRequest(): boolean {
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;
      
      case CircuitBreakerState.OPEN:
        // Check if enough time has passed to try recovery
        if (Date.now() - this.lastFailureTime > this.recoveryTimeoutMs) {
          this.state = CircuitBreakerState.HALF_OPEN;
          logger.info('Attempting to recover API connectivity - circuit breaker half-open');
          return true;
        }
        return false;
      
      case CircuitBreakerState.HALF_OPEN:
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Gets the current state and provides user-friendly status
   */
  getStatus(): { 
    state: CircuitBreakerState; 
    canMakeRequests: boolean; 
    message: string;
    retryInSeconds?: number;
  } {
    const canMakeRequests = this.shouldAllowRequest();
    
    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return {
          state: this.state,
          canMakeRequests,
          message: 'API connectivity is normal'
        };
      
      case CircuitBreakerState.OPEN:
        const retryInMs = this.recoveryTimeoutMs - (Date.now() - this.lastFailureTime);
        const retryInSeconds = Math.max(0, Math.ceil(retryInMs / 1000));
        return {
          state: this.state,
          canMakeRequests,
          message: `API is temporarily unavailable due to connection failures. Will retry in ${retryInSeconds} seconds.`,
          retryInSeconds
        };
      
      case CircuitBreakerState.HALF_OPEN:
        return {
          state: this.state,
          canMakeRequests,
          message: 'Testing API connectivity recovery...'
        };
      
      default:
        return {
          state: this.state,
          canMakeRequests: false,
          message: 'Unknown API state'
        };
    }
  }

  /**
   * Performs a health check and updates circuit breaker state
   */
  async performHealthCheck(): Promise<boolean> {
    const healthUrl = getRemoteHealthUrl();
    if (!healthUrl) {
      logger.debug('Remote generation disabled, skipping health check');
      return true; // Consider it "healthy" if remote generation is disabled
    }

    try {
      logger.debug(`Performing API health check at ${healthUrl}`);
      const healthResult = await checkRemoteHealth(healthUrl);
      
      if (healthResult.status === 'OK') {
        this.recordSuccess();
        return true;
      } else {
        this.recordFailure(new Error(healthResult.message), 'Health check failed');
        return false;
      }
    } catch (error) {
      this.recordFailure(error, 'Health check error');
      return false;
    }
  }

  /**
   * Resets the circuit breaker (for testing or manual recovery)
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.consecutiveSuccesses = 0;
    logger.info('Circuit breaker manually reset');
  }
}

// Global instance
export const apiConnectivity = new ApiConnectivityManager();

/**
 * Wrapper for API calls that respects circuit breaker state
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T | null> {
  const status = apiConnectivity.getStatus();
  
  if (!status.canMakeRequests) {
    logger.warn(`${context || 'API request'} blocked: ${status.message}`);
    return null;
  }

  try {
    const result = await operation();
    apiConnectivity.recordSuccess();
    return result;
  } catch (error) {
    apiConnectivity.recordFailure(error, context);
    throw error;
  }
}

/**
 * Provides user-friendly guidance based on current API state
 */
export function getApiGuidance(): string {
  const status = apiConnectivity.getStatus();
  
  switch (status.state) {
    case CircuitBreakerState.OPEN:
      return `
⚠️  Remote API is temporarily unavailable (${status.message})

Possible solutions:
1. Wait ${status.retryInSeconds} seconds and try again
2. Check your internet connection
3. Use local providers instead by setting OPENAI_API_KEY or other provider keys
4. Disable remote generation with PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION=true

The system will automatically retry when the API becomes available.`;

    case CircuitBreakerState.HALF_OPEN:
      return `
🔄 Testing API recovery (${status.message})

The system is checking if the remote API has recovered. This may take a moment.`;

    default:
      return status.message;
  }
}