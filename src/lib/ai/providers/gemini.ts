import { serverConfig } from '../../config/env';
import type { AiProvider, ProviderChatMessage, ProviderRequest, ProviderResponse } from '../types';
import { ProviderError } from '../types';
import { fetchWithProviderErrors, parseJsonOrThrow } from './base';

interface GeminiPart {
  text?: string;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
}
interface GeminiResponseBody {
  candidates?: GeminiCandidate[];
}

function toGeminiContents(messages: ProviderChatMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

function extractSystemInstruction(messages: ProviderChatMessage[]): string | undefined {
  return messages.find((m) => m.role === 'system')?.content;
}

export function createGeminiProvider(): AiProvider {
  return {
    name: 'gemini',
    async generateReply(request: ProviderRequest): Promise<ProviderResponse> {
      const start = Date.now();
      const { apiKey, baseUrl, model } = serverConfig.gemini;

      const systemInstruction = extractSystemInstruction(request.messages);
      const contents = toGeminiContents(request.messages);

      const url = `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetchWithProviderErrors('gemini', url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: request.signal,
        body: JSON.stringify({
          contents,
          ...(systemInstruction
            ? { systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] } }
            : {}),
          generationConfig: {
            temperature: request.temperature ?? 0.4,
            maxOutputTokens: request.maxOutputTokens ?? 700,
          },
        }),
      });

      const rawText = await response.text();
      const body = parseJsonOrThrow<GeminiResponseBody>('gemini', rawText);

      const content = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (content.trim().length === 0) {
        throw new ProviderError('invalid_response', 'gemini', 'No content in Gemini response.');
      }

      return { text: content, providerName: 'gemini', latencyMs: Date.now() - start };
    },
  };
}
