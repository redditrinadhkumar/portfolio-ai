import { describe, it, expect, vi } from 'vitest';
import { createProviderRouter, BothProvidersFailedError } from '@/lib/ai/router';
import { ProviderError, type AiProvider, type ProviderResponse } from '@/lib/ai/types';

function fakeProvider(
  name: 'openrouter' | 'gemini',
  behavior: (() => Promise<ProviderResponse>) | (() => never),
): AiProvider {
  return {
    name,
    generateReply: behavior as AiProvider['generateReply'],
  };
}

const sampleMessages = [{ role: 'user' as const, content: 'What are your skills?' }];

describe('provider router', () => {
  it('uses the primary (OpenRouter) provider when it succeeds', async () => {
    const primary = fakeProvider('openrouter', async () => ({
      text: 'Python, SQL, RAG.',
      providerName: 'openrouter',
      latencyMs: 10,
    }));
    const fallback = fakeProvider('gemini', async () => {
      throw new Error('fallback should not be called');
    });

    const router = createProviderRouter(primary, fallback);
    const result = await router.route(sampleMessages);

    expect(result.usedFallback).toBe(false);
    expect(result.response.text).toBe('Python, SQL, RAG.');
    expect(result.response.providerName).toBe('openrouter');
  });

  it('falls back to Gemini on an OpenRouter technical failure (timeout)', async () => {
    const primary = fakeProvider('openrouter', async () => {
      throw new ProviderError('timeout', 'openrouter', 'Request timed out.');
    });
    const fallback = fakeProvider('gemini', async () => ({
      text: 'Fallback answer about skills.',
      providerName: 'gemini',
      latencyMs: 12,
    }));

    const router = createProviderRouter(primary, fallback);
    const result = await router.route(sampleMessages);

    expect(result.usedFallback).toBe(true);
    expect(result.response.providerName).toBe('gemini');
    expect(result.primaryError).toContain('timeout');
  });

  it('falls back to Gemini on an OpenRouter 5xx outage', async () => {
    const primary = fakeProvider('openrouter', async () => {
      throw new ProviderError('upstream_5xx', 'openrouter', 'Upstream server error: HTTP 503');
    });
    const fallback = fakeProvider('gemini', async () => ({
      text: 'Answer from Gemini fallback.',
      providerName: 'gemini',
      latencyMs: 8,
    }));

    const router = createProviderRouter(primary, fallback);
    const result = await router.route(sampleMessages);

    expect(result.usedFallback).toBe(true);
    expect(result.response.text).toBe('Answer from Gemini fallback.');
  });

  it('throws BothProvidersFailedError when both OpenRouter and Gemini fail', async () => {
    const primary = fakeProvider('openrouter', async () => {
      throw new ProviderError('network', 'openrouter', 'Network error.');
    });
    const fallback = fakeProvider('gemini', async () => {
      throw new ProviderError('network', 'gemini', 'Network error.');
    });

    const router = createProviderRouter(primary, fallback);

    await expect(router.route(sampleMessages)).rejects.toBeInstanceOf(BothProvidersFailedError);
  });

  it('does not fall back when the primary returns a normal (even terse) completion', async () => {
    const primary = fakeProvider('openrouter', async () => ({
      text: "That information isn't listed in my profile.",
      providerName: 'openrouter',
      latencyMs: 5,
    }));
    const fallback = fakeProvider('gemini', async () => {
      throw new Error('should never be called for a normal completion');
    });

    const router = createProviderRouter(primary, fallback);
    const result = await router.route(sampleMessages);

    expect(result.usedFallback).toBe(false);
    expect(result.response.text).toBe("That information isn't listed in my profile.");
  });
});
