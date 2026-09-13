export interface ProviderChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderRequest {
  messages: ProviderChatMessage[];
  maxOutputTokens?: number;
  temperature?: number;
  signal: AbortSignal;
}

export interface ProviderResponse {
  text: string;
  providerName: 'openrouter' | 'gemini';
  latencyMs: number;
}

/**
 * Only TECHNICAL failures are represented here (timeout, network error,
 * upstream 5xx / 429, malformed/unparseable response). A provider
 * declining to answer with actual text is a normal successful response,
 * not a `ProviderError` — it is not grounds for falling back, since
 * fallback exists to handle outages, not to shop for a different answer.
 */
export type ProviderErrorKind =
  | 'timeout'
  | 'network'
  | 'upstream_5xx'
  | 'upstream_rate_limited'
  | 'invalid_response'
  | 'auth_error';

export class ProviderError extends Error {
  constructor(
    public readonly kind: ProviderErrorKind,
    public readonly providerName: 'openrouter' | 'gemini',
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export interface AiProvider {
  name: 'openrouter' | 'gemini';
  generateReply(request: ProviderRequest): Promise<ProviderResponse>;
}
