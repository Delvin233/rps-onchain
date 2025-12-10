import { redis } from "./upstash";

export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failing, reject requests
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time to wait before trying again (ms)
  monitoringPeriod: number; // Time window for failure counting (ms)
  successThreshold: number; // Successes needed to close circuit in half-open
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  successCount: number;
}

export class CircuitBreaker {
  private name: string;
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: 5, // Open after 5 failures
      recoveryTimeout: 30000, // Wait 30 seconds before retry
      monitoringPeriod: 60000, // 1 minute failure window
      successThreshold: 3, // Need 3 successes to close
      ...config,
    };

    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }

  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    // Check if circuit should transition states
    await this.updateState();

    // If circuit is open, use fallback or throw error
    if (this.state.state === CircuitState.OPEN) {
      console.warn(`[CircuitBreaker] ${this.name} is OPEN, using fallback`);
      if (fallback) {
        return fallback();
      }
      throw new Error(`Service ${this.name} is currently unavailable (circuit breaker open)`);
    }

    try {
      const result = await operation();
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure();

      // If we have a fallback, use it instead of throwing
      if (fallback) {
        console.warn(`[CircuitBreaker] ${this.name} failed, using fallback:`, error);
        return fallback();
      }

      throw error;
    }
  }

  private async updateState(): Promise<void> {
    const now = Date.now();

    switch (this.state.state) {
      case CircuitState.CLOSED:
        // Check if we should open due to failures
        if (this.state.failures >= this.config.failureThreshold) {
          this.state.state = CircuitState.OPEN;
          this.state.lastFailureTime = now;
          await this.persistState();
          console.warn(`[CircuitBreaker] ${this.name} opened due to ${this.state.failures} failures`);
        }
        break;

      case CircuitState.OPEN:
        // Check if we should try half-open
        if (now - this.state.lastFailureTime >= this.config.recoveryTimeout) {
          this.state.state = CircuitState.HALF_OPEN;
          this.state.successCount = 0;
          await this.persistState();
          console.info(`[CircuitBreaker] ${this.name} transitioning to HALF_OPEN`);
        }
        break;

      case CircuitState.HALF_OPEN:
        // Will be handled by success/failure methods
        break;
    }
  }

  private async onSuccess(): Promise<void> {
    if (this.state.state === CircuitState.HALF_OPEN) {
      this.state.successCount++;
      if (this.state.successCount >= this.config.successThreshold) {
        this.state.state = CircuitState.CLOSED;
        this.state.failures = 0;
        this.state.successCount = 0;
        await this.persistState();
        console.info(`[CircuitBreaker] ${this.name} closed after ${this.config.successThreshold} successes`);
      }
    } else if (this.state.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.state.failures = Math.max(0, this.state.failures - 1);
      await this.persistState();
    }
  }

  private async onFailure(): Promise<void> {
    const now = Date.now();

    if (this.state.state === CircuitState.HALF_OPEN) {
      // Go back to open on any failure in half-open
      this.state.state = CircuitState.OPEN;
      this.state.lastFailureTime = now;
      this.state.failures++;
      await this.persistState();
      console.warn(`[CircuitBreaker] ${this.name} back to OPEN after failure in HALF_OPEN`);
    } else {
      this.state.failures++;
      this.state.lastFailureTime = now;
      await this.persistState();
    }
  }

  private async persistState(): Promise<void> {
    try {
      const key = `circuit_breaker:${this.name}`;
      await redis.setex(key, 300, JSON.stringify(this.state)); // 5 minute TTL
    } catch (error) {
      console.error(`[CircuitBreaker] Failed to persist state for ${this.name}:`, error);
    }
  }

  private async loadState(): Promise<void> {
    try {
      const key = `circuit_breaker:${this.name}`;
      const stored = await redis.get(key);
      if (stored) {
        this.state = { ...this.state, ...JSON.parse(stored as string) };
      }
    } catch (error) {
      console.error(`[CircuitBreaker] Failed to load state for ${this.name}:`, error);
    }
  }

  async getState(): Promise<{ name: string; state: CircuitState; failures: number; config: CircuitBreakerConfig }> {
    await this.loadState();
    await this.updateState();
    return {
      name: this.name,
      state: this.state.state,
      failures: this.state.failures,
      config: this.config,
    };
  }
}

// Pre-configured circuit breakers for different services
export const circuitBreakers = {
  database: new CircuitBreaker("database", {
    failureThreshold: 3,
    recoveryTimeout: 15000, // 15 seconds
    successThreshold: 2,
  }),

  redis: new CircuitBreaker("redis", {
    failureThreshold: 5,
    recoveryTimeout: 10000, // 10 seconds
    successThreshold: 3,
  }),

  external_api: new CircuitBreaker("external_api", {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    successThreshold: 2,
  }),

  ipfs: new CircuitBreaker("ipfs", {
    failureThreshold: 2,
    recoveryTimeout: 60000, // 1 minute
    successThreshold: 1,
  }),
};
