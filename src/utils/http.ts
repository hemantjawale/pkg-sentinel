/**
 * HTTP client with retry, timeout, and rate-limit awareness.
 * Wraps native fetch with production-grade resilience.
 */

/** Options for individual HTTP requests. */
export interface HttpRequestOptions {
  /** HTTP method. */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  /** Request headers. */
  headers?: Record<string, string>;

  /** Request body (will be JSON.stringified if object). */
  body?: unknown;

  /** Timeout in milliseconds. */
  timeoutMs?: number;

  /** Maximum retry attempts. */
  maxRetries?: number;

  /** Base delay between retries in ms (exponential backoff). */
  retryDelayMs?: number;

  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

/** HTTP response wrapper. */
export interface HttpResponse<T = unknown> {
  /** HTTP status code. */
  status: number;

  /** Response headers. */
  headers: Record<string, string>;

  /** Parsed response body. */
  data: T;

  /** Whether the request was successful (2xx). */
  ok: boolean;

  /** Rate limit info if present. */
  rateLimit?: RateLimitInfo;
}

/** Rate limit information from API headers. */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

/** Default request options. */
const DEFAULTS: Required<Pick<HttpRequestOptions, 'method' | 'timeoutMs' | 'maxRetries' | 'retryDelayMs'>> = {
  method: 'GET',
  timeoutMs: 30_000,
  maxRetries: 3,
  retryDelayMs: 1_000,
};

/**
 * Make an HTTP request with retry logic, timeout, and rate-limit awareness.
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse<T>> {
  const {
    method = DEFAULTS.method,
    headers = {},
    body,
    timeoutMs = DEFAULTS.timeoutMs,
    maxRetries = DEFAULTS.maxRetries,
    retryDelayMs = DEFAULTS.retryDelayMs,
    signal,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Combine external signal with timeout
      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Accept': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      };

      if (body !== undefined) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse rate limit headers
      const rateLimit = parseRateLimitHeaders(response.headers);

      // If rate-limited, wait and retry
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = getRetryAfter(response.headers, rateLimit);
        await sleep(retryAfter);
        continue;
      }

      // Parse response body
      const contentType = response.headers.get('content-type') ?? '';
      let data: T;
      if (contentType.includes('application/json')) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as unknown as T;
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        headers: responseHeaders,
        data,
        ok: response.ok,
        rateLimit,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort
      if (lastError.name === 'AbortError') {
        throw new HttpError(`Request timed out after ${timeoutMs}ms: ${url}`, 0, url);
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  throw new HttpError(
    `Request failed after ${maxRetries + 1} attempts: ${lastError?.message ?? 'Unknown error'}`,
    0,
    url,
  );
}

/** Parse rate limit headers from common APIs (GitHub, npm). */
function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      resetAt: new Date(parseInt(reset, 10) * 1000),
    };
  }
  return undefined;
}

/** Determine how long to wait before retrying a rate-limited request. */
function getRetryAfter(headers: Headers, rateLimit?: RateLimitInfo): number {
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
  }

  if (rateLimit?.resetAt) {
    const waitMs = rateLimit.resetAt.getTime() - Date.now();
    return Math.max(waitMs, 1000);
  }

  return 5000; // Default 5-second wait
}

/** Sleep for the specified number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Custom HTTP error class. */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
