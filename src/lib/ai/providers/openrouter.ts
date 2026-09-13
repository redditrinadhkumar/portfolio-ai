import { serverConfig } from '../../config/env';
import type { AiProvider, ProviderRequest, ProviderResponse } from '../types';
import { ProviderError } from '../types';
import { fetchWithProviderErrors, parseJsonOrThrow } from './base';

interface OpenRouterChoice {
  message?: { role: string; content: string };
}
interface OpenRouterResponseBody {
  choices?: OpenRouterChoice[];
}

export function createOpenRouterProvider(): AiProvider {
  return {
    name: 'openrouter',
    async generateReply(request: ProviderRequest): Promise<ProviderResponse> {
      const start = Date.now();
      const { apiKey, baseUrl, model } = serverConfig.openRouter;

      const response = await fetchWithProviderErrors('openrouter', `${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          // OpenRouter uses these for its own analytics/attribution; safe, non-secret metadata only.
          'X-Title': 'Portfolio AI Assistant',
        },
        signal: request.signal,
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.4,
          max_tokens: request.maxOutputTokens ?? 700,
        }),
      });

      const rawText = await response.text();
      const body = parseJsonOrThrow<OpenRouterResponseBody>('openrouter', rawText);

      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new ProviderError('invalid_response', 'openrouter', 'No content in OpenRouter response.');
      }

      return { text: content, providerName: 'openrouter', latencyMs: Date.now() - start };
    },
  };
}
