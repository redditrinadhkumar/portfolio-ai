import { randomUUID } from 'crypto';
import { runSecurityPipeline } from './security/pipeline';
import { buildApiError, type ApiErrorPayload } from './security/errors';
import { logSecurityEvent, previewText } from './security/logger';
import { buildPrompt } from './ai/promptBuilder';
import { validateAndSanitizeOutput } from './security/outputValidation';
import { createProviderRouter, BothProvidersFailedError, type ProviderRouter } from './ai/router';
import { createInMemoryRateLimiter, type RateLimiter } from './security/rateLimiter';
import { serverConfig } from './config/env';

/**
 * REQUEST FLOW (each numbered layer maps to the requirements list):
 *  7. rate limit check
 *  1-6. security pipeline (schema, size, unicode, sanitize, injection, scope)
 *       -> a rejection here NEVER reaches a provider (9/10/16 don't apply)
 *  prompt assembly (trusted instructions + trusted profile data + untrusted user data, structurally separated)
 *  9/10. provider call with OpenRouter -> Gemini technical-failure fallback, 8. timeout enforced inside the router
 *  11/12. output validation + markdown/HTML sanitization
 *  13/14. safe error handling + security logging throughout
 *  18. no persistent memory: history lives only in the request payload, nothing is written to storage here
 */

export interface ChatHandlerSuccess {
  status: 200;
  body: {
    reply: string;
    usedFallback: boolean;
  };
}

export interface ChatHandlerFailure {
  status: number;
  body: ApiErrorPayload;
}

export type ChatHandlerResult = ChatHandlerSuccess | ChatHandlerFailure;

let defaultRateLimiter: RateLimiter | undefined;
function getDefaultRateLimiter(): RateLimiter {
  if (!defaultRateLimiter) {
    defaultRateLimiter = createInMemoryRateLimiter({
      maxRequests: serverConfig.rateLimit.maxRequests,
      windowMs: serverConfig.rateLimit.windowMs,
    });
  }
  return defaultRateLimiter;
}

let defaultRouter: ProviderRouter | undefined;
function getDefaultRouter(): ProviderRouter {
  if (!defaultRouter) defaultRouter = createProviderRouter();
  return defaultRouter;
}

export interface HandleChatOptions {
  rawBody: unknown;
  rawBodySizeBytes: number;
  clientKey: string; // e.g. hashed/derived from IP
  rateLimiter?: RateLimiter;
  router?: ProviderRouter;
}

export async function handleChatRequest(opts: HandleChatOptions): Promise<ChatHandlerResult> {
  const requestId = randomUUID();
  const rateLimiter = opts.rateLimiter ?? getDefaultRateLimiter();
  const router = opts.router ?? getDefaultRouter();

  logSecurityEvent({ requestId, timestamp: new Date().toISOString(), event: 'request_received' });

  // --- Layer 7: rate limiting, before any parsing/security work.
  const rateResult = rateLimiter.check(opts.clientKey);
  if (!rateResult.allowed) {
    logSecurityEvent({
      requestId,
      timestamp: new Date().toISOString(),
      event: 'rate_limited',
      detail: { retryAfterMs: rateResult.retryAfterMs },
    });
    const { status, payload } = buildApiError('rate_limited');
    return { status, body: payload };
  }

  // --- Layers 1-6: security pipeline. A rejection here stops everything —
  // no provider, primary or fallback, is ever called.
  const pipelineResult = runSecurityPipeline(opts.rawBody, opts.rawBodySizeBytes);
  if (!pipelineResult.ok) {
    logSecurityEvent({
      requestId,
      timestamp: new Date().toISOString(),
      event: pipelineResult.reason === 'out_of_scope' ? 'out_of_scope' : 'injection_detected',
      detail: { reason: pipelineResult.reason, internalDetail: pipelineResult.internalDetail },
    });
    const { status, payload } = buildApiError(pipelineResult.errorCode);

    // Out-of-scope isn't an "error" from the user's point of view — it's a
    // normal, friendly redirect message rendered as a successful reply.
    if (pipelineResult.errorCode === 'out_of_scope') {
      return { status: 200, body: { reply: payload.error.message, usedFallback: false } };
    }
    return { status, body: payload };
  }

  logSecurityEvent({
    requestId,
    timestamp: new Date().toISOString(),
    event: 'scope_classified',
    detail: { topics: pipelineResult.topics, preview: previewText(pipelineResult.cleanMessage) },
  });

  // --- Prompt assembly: trusted instructions + trusted profile data,
  // structurally separate from the untrusted (but now-sanitized) user data.
  const { messages } = buildPrompt(pipelineResult.cleanMessage, pipelineResult.cleanHistory, pipelineResult.topics);

  // --- Provider call with timeout + technical-failure fallback.
  try {
    logSecurityEvent({ requestId, timestamp: new Date().toISOString(), event: 'provider_call', detail: { provider: 'openrouter' } });
    const routerResult = await router.route(messages);

    if (routerResult.usedFallback) {
      logSecurityEvent({
        requestId,
        timestamp: new Date().toISOString(),
        event: 'provider_fallback',
        detail: { primaryError: routerResult.primaryError },
      });
    }

    // --- Layers 11/12: output validation + markdown/HTML sanitization.
    const { safeText, wasBlocked, wasModified } = validateAndSanitizeOutput(routerResult.response.text);
    if (wasBlocked || wasModified) {
      logSecurityEvent({
        requestId,
        timestamp: new Date().toISOString(),
        event: 'output_rejected',
        detail: { wasBlocked, wasModified },
      });
    }

    logSecurityEvent({ requestId, timestamp: new Date().toISOString(), event: 'response_sent' });
    return { status: 200, body: { reply: safeText, usedFallback: routerResult.usedFallback } };
  } catch (err) {
    // --- Safe error handling: no raw provider error, stack trace, or
    // internal detail ever reaches the client.
    const detail =
      err instanceof BothProvidersFailedError
        ? { primaryError: err.primaryError, fallbackError: err.fallbackError }
        : { error: err instanceof Error ? err.message : String(err) };

    logSecurityEvent({ requestId, timestamp: new Date().toISOString(), event: 'provider_failure_final', detail });

    const { status, payload } = buildApiError('provider_unavailable');
    return { status, body: payload };
  }
}
