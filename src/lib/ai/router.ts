import { serverConfig } from '../config/env';
import { createOpenRouterProvider } from './providers/openrouter';
import { createGeminiProvider } from './providers/gemini';
import { ProviderError, type AiProvider, type ProviderChatMessage, type ProviderResponse } from './types';

/**
 * PROVIDER ROUTER
 * -------------------
 * By the time this module is called, the request has ALREADY passed the
 * full security pipeline (schema, size, sanitation, injection detection,
 * scope classification) — see `app/api/chat/route.ts`. This module only
 * ever decides between two LLM providers for a request that is already
 * cleared to be answered; it has no security-rejection concept of its own,
 * only technical success/failure.
 *
 * Fallback rule: Gemini is only ever tried after a genuine technical
 * failure from OpenRouter (timeout, network error, 5xx, upstream rate
 * limit, malformed response, auth error). It is never used to "retry for
 * a different answer" — a security rejection never reaches this module at
 * all, and a normal (even unhelpful) completion is never treated as a
 * failure.
 */

export interface RouterResult {
  response: ProviderResponse;
  usedFallback: boolean;
  primaryError?: string;
}

export class BothProvidersFailedError extends Error {
  constructor(
    public readonly primaryError: string,
    public readonly fallbackError: string,
  ) {
    super(`Both providers failed. primary=${primaryError} fallback=${fallbackError}`);
    this.name = 'BothProvidersFailedError';
  }
}

function withTimeout(timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

export interface ProviderRouter {
  route(messages: ProviderChatMessage[]): Promise<RouterResult>;
}

export function createProviderRouter(
  primary: AiProvider = createOpenRouterProvider(),
  fallback: AiProvider = createGeminiProvider(),
): ProviderRouter {
  return {
    async route(messages: ProviderChatMessage[]): Promise<RouterResult> {
      const { signal, cancel } = withTimeout(serverConfig.requestTimeoutMs);
      try {
        const response = await primary.generateReply({ messages, signal });
        return { response, usedFallback: false };
      } catch (primaryErr) {
        const primaryMessage =
          primaryErr instanceof ProviderError ? `${primaryErr.kind}: ${primaryErr.message}` : String(primaryErr);

        // Fallback attempt gets its own fresh timeout window.
        const fallbackTimeout = withTimeout(serverConfig.requestTimeoutMs);
        try {
          const response = await fallback.generateReply({ messages, signal: fallbackTimeout.signal });
          return { response, usedFallback: true, primaryError: primaryMessage };
        } catch (fallbackErr) {
          const fallbackMessage =
            fallbackErr instanceof ProviderError
              ? `${fallbackErr.kind}: ${fallbackErr.message}`
              : String(fallbackErr);
          throw new BothProvidersFailedError(primaryMessage, fallbackMessage);
        } finally {
          fallbackTimeout.cancel();
        }
      } finally {
        cancel();
      }
    },
  };
}
