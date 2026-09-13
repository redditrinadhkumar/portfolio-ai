import { ProviderError, type ProviderErrorKind } from '../types';

/**
 * Wraps fetch with a timeout tied to the caller's AbortSignal, and maps
 * network-level failures into a typed `ProviderError` so the router can
 * decide whether they qualify as a "technical failure" eligible for
 * fallback (see `lib/ai/router.ts`).
 */
export async function fetchWithProviderErrors(
  providerName: 'openrouter' | 'gemini',
  url: string,
  init: RequestInit,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    if (init.signal?.aborted) {
      throw new ProviderError('timeout', providerName, 'Request aborted (timeout).');
    }
    throw new ProviderError(
      'network',
      providerName,
      err instanceof Error ? err.message : 'Unknown network error',
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('auth_error', providerName, `Auth failure: HTTP ${response.status}`);
  }
  if (response.status === 429) {
    throw new ProviderError('upstream_rate_limited', providerName, 'Upstream rate limited (429).');
  }
  if (response.status >= 500) {
    throw new ProviderError('upstream_5xx', providerName, `Upstream server error: HTTP ${response.status}`);
  }
  if (!response.ok) {
    // Any other non-2xx (e.g. 400 malformed request we built) is still a
    // technical failure from the caller's point of view — never something
    // the security layer should have let through as a "safety refusal".
    throw new ProviderError(
      'invalid_response' as ProviderErrorKind,
      providerName,
      `Unexpected HTTP status: ${response.status}`,
    );
  }

  return response;
}

export function parseJsonOrThrow<T>(providerName: 'openrouter' | 'gemini', raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ProviderError('invalid_response', providerName, 'Could not parse provider response as JSON.');
  }
}
