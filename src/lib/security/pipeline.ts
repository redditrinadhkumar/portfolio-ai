import { MAX_MESSAGE_CHARS, MAX_TOTAL_REQUEST_CHARS, validateChatRequestSchema } from './schema';
import { sanitizeUserText } from './sanitizeInput';
import { detectInjection } from './injectionDetection';
import { classifyScope } from './scopeClassifier';
import type { SecurityCheckResult, SecurityRejectionReason } from './types';
import { buildApiError, type ApiErrorCode } from './errors';
import type { ProfileTopic } from '../profile/types';

/**
 * SECURITY PIPELINE ORCHESTRATOR
 * ---------------------------------
 * Runs layers 1 (schema), 2 (size), 3-4 (normalize + sanitize), 5
 * (injection detection), 6 (scope classification) IN ORDER, short-
 * circuiting on the first failure. This function is called from the API
 * route BEFORE any provider is selected — nothing here ever touches
 * OpenRouter or Gemini, and a rejection here can never fall through to
 * the fallback provider (see `lib/ai/router.ts`, which only receives
 * requests that already cleared this pipeline).
 *
 * Conversation history is sanitized and scanned the same way as the
 * current message, since it is equally untrusted (client-echoed, and
 * could have been tampered with between turns).
 */

export interface CleanHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface PipelineSuccess {
  ok: true;
  cleanMessage: string;
  cleanHistory: CleanHistoryItem[];
  topics: ProfileTopic[];
}

export interface PipelineFailure {
  ok: false;
  errorCode: ApiErrorCode;
  reason: SecurityRejectionReason;
  internalDetail: string;
}

export type PipelineResult = PipelineSuccess | PipelineFailure;

function reject(reason: SecurityRejectionReason, errorCode: ApiErrorCode, internalDetail: string): PipelineFailure {
  return { ok: false, reason, errorCode, internalDetail };
}

export function runSecurityPipeline(rawBody: unknown, rawBodySizeBytes: number): PipelineResult {
  // --- Layer 2: raw size guard, before we even attempt to parse/validate shape.
  if (rawBodySizeBytes > MAX_TOTAL_REQUEST_CHARS * 4) {
    // *4 as a generous byte-per-char upper bound for UTF-8 multi-byte input.
    return reject('too_large', 'too_large', `raw body ${rawBodySizeBytes} bytes exceeds limit`);
  }

  // --- Layer 1: schema validation.
  const schemaResult = validateChatRequestSchema(rawBody);
  if (!schemaResult.ok) {
    return reject('schema_invalid', 'invalid_request', schemaResult.detail);
  }
  const { message, history } = schemaResult.data;

  // --- Layers 3-4: normalize + sanitize the live message.
  const { sanitized: cleanMessage } = sanitizeUserText(message, MAX_MESSAGE_CHARS);
  if (cleanMessage.length === 0) {
    return reject('schema_invalid', 'invalid_request', 'message empty after sanitization');
  }

  // --- Layer 5: injection / extraction detection on the live message.
  const injection = detectInjection(cleanMessage);
  if (injection.isSuspicious) {
    const reason: SecurityRejectionReason = injection.isExtractionAttempt
      ? cleanMessage.toLowerCase().includes('key') || cleanMessage.toLowerCase().includes('env')
        ? 'secret_extraction'
        : 'system_prompt_extraction'
      : 'prompt_injection';
    return reject(
      reason,
      'blocked',
      `injection signals: ${injection.signals.map((s) => `${s.category}(${s.weight})`).join(',')} score=${injection.score}`,
    );
  }

  // --- Sanitize + lightly screen history (same untrusted status as the live message).
  const cleanHistory: CleanHistoryItem[] = [];
  for (const item of history) {
    const { sanitized } = sanitizeUserText(item.content, MAX_MESSAGE_CHARS);
    if (sanitized.length === 0) continue;

    if (item.role === 'user') {
      const historyInjection = detectInjection(sanitized);
      if (historyInjection.isSuspicious) {
        // A poisoned history item is rejected the same as a poisoned live
        // message — we don't selectively trust "older" turns.
        return reject(
          'prompt_injection',
          'blocked',
          `injection signals in history: score=${historyInjection.score}`,
        );
      }
    }
    cleanHistory.push({ role: item.role, content: sanitized });
  }

  // --- Layer 6: profile-scope classification.
  const scope = classifyScope(cleanMessage);
  if (!scope.inScope) {
    return reject('out_of_scope', 'out_of_scope', 'message classified as confidently off-topic');
  }

  return { ok: true, cleanMessage, cleanHistory, topics: scope.topics };
}

// Re-exported for callers that need to turn a PipelineFailure into an HTTP response.
export function pipelineFailureToResponse(failure: PipelineFailure) {
  return buildApiError(failure.errorCode);
}

// Ensure `SecurityCheckResult` stays referenced/exported for consumers that
// want the richer clearance/rejection shape (e.g. future non-HTTP callers).
export type { SecurityCheckResult };
