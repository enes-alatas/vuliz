/**
 * Configuration for proxy client settings
 */
const PROXY_CONFIG = {
  /** Base URL for the proxy service */
  PROXY_BASE_URL:
    process.env.PROXY_URL || 'https://cors-anywhere.herokuapp.com/',
  /** Timeout for requests in milliseconds */
  TIMEOUT_MS: 10000,
} as const;

/**
 * Custom error for proxy client issues
 */
export class ProxyClientError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'ProxyClientError';
  }
}

/**
 * Options for the ProxyClient fetch function
 */
export interface ProxyClientFetchOptions extends RequestInit {
  /** Custom timeout in milliseconds */
  timeout?: number;
}

/**
 * A drop-in replacement for `fetch()` to send requests over a proxy.
 *
 * @param input - The URL string or Request object to fetch
 * @param init - Optional request configuration
 * @returns Promise that resolves to a Response object
 * @throws {ProxyClientError} When the request fails or times out
 *
 * @example
 * ```typescript
 * // Basic usage
 * const response = await proxyClientFetch('https://api.example.com/data');
 *
 * // With options
 * const response = await proxyClientFetch('https://api.example.com/data', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ key: 'value' })
 * });
 * ```
 */
export async function proxyClientFetch(
  input: string | Request,
  init?: ProxyClientFetchOptions,
): Promise<Response> {
  try {
    const {url, options} = normalizeFetchInput(input, init);
    const proxyUrl = constructProxyUrl(url);

    // Always add the X-Requested-With header just in case
    const mergedHeaders = {
      ...(options.headers || {}),
      'X-Requested-With': 'XMLHttpRequest',
    };
    const mergedOptions = {
      ...options,
      headers: mergedHeaders,
    };

    return await fetchWithTimeout(proxyUrl, mergedOptions);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ProxyClientError(
      `Proxy request failed: ${errorMessage}`,
      error as Error,
    );
  }
}

/**
 * Normalizes the fetch input parameters into a consistent format
 */
function normalizeFetchInput(
  input: string | Request,
  init?: ProxyClientFetchOptions,
): {url: string; options: ProxyClientFetchOptions} {
  if (typeof input === 'string') {
    return {
      url: input,
      options: init || {},
    };
  }

  return {
    url: input.url,
    options: {...input, ...init},
  };
}

/**
 * Constructs the full proxy URL by combining the base URL with the target URL
 */
function constructProxyUrl(targetUrl: string): string {
  // Validate the target URL using Node's URL constructor
  try {
    // Construct the proxy URL
    const proxyUrl = new URL(`${PROXY_CONFIG.PROXY_BASE_URL}${targetUrl}`);
    return proxyUrl.toString();
  } catch (error) {
    throw new ProxyClientError(`Invalid URL provided: ${targetUrl}`);
  }
}

/**
 * Fetches with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: ProxyClientFetchOptions,
): Promise<Response> {
  const timeout = options.timeout ?? PROXY_CONFIG.TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
