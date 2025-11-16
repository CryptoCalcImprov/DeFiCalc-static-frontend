type LimiterState = {
  tokens: number;
  lastRefill: number;
};

export class RequestLimiter {
  private state: Map<string, LimiterState> = new Map();
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second
  private readonly burst: number;

  constructor(capacity: number = 8, refillRate: number = 8, burst: number = 4) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.burst = burst;
  }

  private getState(key: string): LimiterState {
    const existing = this.state.get(key);
    if (existing) {
      return existing;
    }

    const newState: LimiterState = {
      tokens: this.capacity,
      lastRefill: Date.now(),
    };
    this.state.set(key, newState);
    return newState;
  }

  private refill(state: LimiterState, now: number): void {
    const elapsed = (now - state.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;
    state.tokens = Math.min(this.capacity, state.tokens + tokensToAdd);
    state.lastRefill = now;
  }

  async take(key: string): Promise<void> {
    const now = Date.now();
    const state = this.getState(key);
    this.refill(state, now);

    // If we have tokens, consume one immediately
    if (state.tokens >= 1) {
      state.tokens -= 1;
      return;
    }

    // Calculate how long to wait
    const tokensNeeded = 1 - state.tokens;
    const waitSeconds = tokensNeeded / this.refillRate;
    const waitMs = Math.ceil(waitSeconds * 1000);

    // Wait for tokens to become available
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.refill(state, Date.now());
        state.tokens -= 1;
        resolve();
      }, waitMs);
    });
  }

  reset(key?: string): void {
    if (key) {
      this.state.delete(key);
    } else {
      this.state.clear();
    }
  }
}

// Global limiter instance per host
const limiters = new Map<string, RequestLimiter>();

export function getLimiter(host: string): RequestLimiter {
  const existing = limiters.get(host);
  if (existing) {
    return existing;
  }

  const limiter = new RequestLimiter(8, 8, 4); // 8 tokens, refill 8/sec, burst 4
  limiters.set(host, limiter);
  return limiter;
}

