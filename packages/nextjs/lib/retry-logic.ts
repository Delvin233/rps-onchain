interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffFactor: number; // Exponential backoff multiplier
  jitter: boolean; // Add random jitter to prevent thundering herd
}

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2, // Double each time
      jitter: true,
      ...config,
    };
  }

  async execute<T>(operation: () => Promise<T>, isRetryableError?: (error: any) => boolean): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();

        // Log successful retry
        if (attempt > 1) {
          console.info(`[Retry] Operation succeeded on attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (isRetryableError && !isRetryableError(error)) {
          console.warn(`[Retry] Non-retryable error on attempt ${attempt}:`, error);
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.config.maxAttempts) {
          console.error(`[Retry] All ${this.config.maxAttempts} attempts failed:`, error);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);
        console.warn(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms:`, error);

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (backoffFactor ^ (attempt - 1))
    let delay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt - 1);

    // Cap at maximum delay
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, Math.floor(delay));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-configured retry managers for different scenarios
export const retryManagers = {
  // Database operations - quick retries
  database: new RetryManager({
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
  }),

  // External API calls - longer delays
  externalApi: new RetryManager({
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 2,
  }),

  // IPFS operations - very patient
  ipfs: new RetryManager({
    maxAttempts: 5,
    baseDelay: 3000,
    maxDelay: 30000,
    backoffFactor: 1.5,
  }),

  // Redis operations - fast retries
  redis: new RetryManager({
    maxAttempts: 2,
    baseDelay: 200,
    maxDelay: 2000,
    backoffFactor: 3,
  }),
};

// Helper function to determine if an error is retryable
export function isRetryableError(error: any): boolean {
  // Network errors are usually retryable
  if (
    error.code === "ECONNRESET" ||
    error.code === "ENOTFOUND" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ECONNREFUSED"
  ) {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.statusCode || error.status) {
    const status = error.statusCode || error.status;
    return status >= 500 || status === 408 || status === 429;
  }

  // Database connection errors
  if (
    error.message?.includes("connection") ||
    error.message?.includes("timeout") ||
    error.message?.includes("ECONNRESET")
  ) {
    return true;
  }

  // Redis errors that are retryable
  if (
    error.message?.includes("Redis") &&
    (error.message?.includes("connection") || error.message?.includes("timeout"))
  ) {
    return true;
  }

  return false;
}

// Utility function for common retry patterns
export async function withRetry<T>(
  operation: () => Promise<T>,
  retryType: keyof typeof retryManagers = "database",
): Promise<T> {
  return retryManagers[retryType].execute(operation, isRetryableError);
}
