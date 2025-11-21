// Error recovery - silent retries and graceful degradation
// Like how Nintendo games never crash

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// Exponential backoff retry
export async function retryWithBackoff<T>(fn: () => Promise<T>, config: Partial<RetryConfig> = {}): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = { ...defaultConfig, ...config };

  let lastError: any;
  let delay = baseDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Last attempt, throw error
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
      await sleep(Math.min(delay, maxDelay));
      delay *= backoffMultiplier;

      console.log(`Retry attempt ${attempt + 1}/${maxRetries}`);
    }
  }

  throw lastError;
}

// Graceful degradation - fallback to alternative
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  fallbackMessage?: string,
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    console.warn(fallbackMessage || "Primary failed, using fallback", error);
    return await fallback();
  }
}

// Circuit breaker - stop trying if consistently failing
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private threshold = 5;
  private timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      // Check if timeout passed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = "open";
      console.error("Circuit breaker opened due to repeated failures");
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = "closed";
  }
}

export const apiCircuitBreaker = new CircuitBreaker();

// Safe fetch with retry and circuit breaker
export async function safeFetch<T>(url: string, options?: RequestInit, config?: Partial<RetryConfig>): Promise<T> {
  return apiCircuitBreaker.execute(() =>
    retryWithBackoff(async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }, config),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error boundary helper
export function handleError(error: any, context: string): void {
  console.error(`Error in ${context}:`, error);

  // Log to monitoring service in production
  if (process.env.NODE_ENV === "production") {
    // Send to Sentry, LogRocket, etc.
  }

  // Don't crash the app
}
