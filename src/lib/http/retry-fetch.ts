export type RetryFetchOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  totalBudgetMs?: number;
  timeoutPerAttemptMs?: number;
  retryOn?: number[] | ((status: number) => boolean);
  respectRetryAfter?: boolean;
  jitterMs?: number;
};

const DEFAULT_OPTIONS: Required<RetryFetchOptions> = {
  maxRetries: 5,
  baseDelayMs: 500,
  maxDelayMs: 30000,
  totalBudgetMs: 60000,
  timeoutPerAttemptMs: 10000,
  retryOn: [429],
  respectRetryAfter: true,
  jitterMs: 250,
};

function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) {
    return null;
  }

  const trimmed = headerValue.trim();
  const asNumber = Number.parseInt(trimmed, 10);

  // If it's a number, treat as seconds
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    return asNumber * 1000; // Convert to milliseconds
  }

  // Try parsing as HTTP-date
  try {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      const delayMs = date.getTime() - Date.now();
      return delayMs > 0 ? delayMs : null;
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

function shouldRetry(status: number, retryOn: RetryFetchOptions["retryOn"]): boolean {
  if (!retryOn) {
    return false;
  }

  if (typeof retryOn === "function") {
    return retryOn(status);
  }

  if (Array.isArray(retryOn)) {
    // 429 always retry, 5xx always retry
    if (status === 429) {
      return true;
    }
    if (status >= 500 && status < 600) {
      return true;
    }
    return retryOn.includes(status);
  }

  return false;
}

function createTimeoutSignal(timeoutMs: number, parentSignal?: AbortSignal): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
      clearTimeout(timeoutId);
    } else {
      parentSignal.addEventListener("abort", () => {
        controller.abort();
        clearTimeout(timeoutId);
      });
    }
  }

  return { controller, timeoutId };
}

export async function retryFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryFetchOptions = {},
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: Error | null = null;

  // Handle 5xx retries by default
  const retryOnArray = Array.isArray(opts.retryOn) ? opts.retryOn : null;
  const retryOnFn: (status: number) => boolean =
    typeof opts.retryOn === "function"
      ? opts.retryOn
      : (status: number) => {
          if (status === 429) return true;
          if (status >= 500 && status < 600) return true;
          return retryOnArray !== null && retryOnArray.includes(status);
        };

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    // Check total budget
    const elapsed = Date.now() - startTime;
    if (elapsed >= opts.totalBudgetMs) {
      throw new Error(`Retry budget exceeded (${opts.totalBudgetMs}ms)`);
    }

    // Create timeout signal for this attempt
    const signal = init?.signal ?? undefined;
    const { controller: timeoutController, timeoutId } = createTimeoutSignal(opts.timeoutPerAttemptMs, signal);
    const combinedSignal = init?.signal
      ? (() => {
          const combined = new AbortController();
          if (init.signal.aborted) {
            combined.abort();
            clearTimeout(timeoutId);
          } else {
            init.signal.addEventListener("abort", () => {
              combined.abort();
              clearTimeout(timeoutId);
            });
          }
          if (timeoutController.signal.aborted) {
            combined.abort();
            clearTimeout(timeoutId);
          } else {
            timeoutController.signal.addEventListener("abort", () => {
              combined.abort();
              clearTimeout(timeoutId);
            });
          }
          return combined.signal;
        })()
      : timeoutController.signal;

    try {
      const response = await fetch(input, {
        ...init,
        signal: combinedSignal,
      });

      // If successful or not retryable, return immediately
      if (response.ok || !shouldRetry(response.status, retryOnFn)) {
        return response;
      }

      // If this was the last attempt, return the error response
      if (attempt === opts.maxRetries) {
        return response;
      }

      // Calculate delay
      let delayMs: number;
      if (opts.respectRetryAfter && response.status === 429) {
        const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
        if (retryAfter !== null) {
          delayMs = Math.min(opts.maxDelayMs, retryAfter);
        } else {
          const exponentialDelay = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** attempt);
          delayMs = exponentialDelay;
        }
      } else {
        const exponentialDelay = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** attempt);
        delayMs = exponentialDelay;
      }

      // Add jitter
      const jitter = Math.random() * opts.jitterMs;
      const finalDelay = Math.min(opts.maxDelayMs, delayMs + jitter);

      // Check if delay would exceed budget
      if (elapsed + finalDelay >= opts.totalBudgetMs) {
        throw new Error(`Retry delay would exceed budget`);
      }

      // Wait before retrying
      await new Promise<void>((resolve) => {
        setTimeout(resolve, finalDelay);
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort
      if (lastError.name === "AbortError") {
        throw lastError;
      }

      // If this was the last attempt, throw
      if (attempt === opts.maxRetries) {
        throw lastError;
      }

      // Calculate delay for network errors
      const exponentialDelay = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** attempt);
      const jitter = Math.random() * opts.jitterMs;
      const finalDelay = Math.min(opts.maxDelayMs, exponentialDelay + jitter);

      // Check if delay would exceed budget
      const elapsed = Date.now() - startTime;
      if (elapsed + finalDelay >= opts.totalBudgetMs) {
        throw new Error(`Retry budget exceeded (${opts.totalBudgetMs}ms)`);
      }

      // Wait before retrying
      await new Promise<void>((resolve) => {
        setTimeout(resolve, finalDelay);
      });
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

