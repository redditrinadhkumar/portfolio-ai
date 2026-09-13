import type { ProfileTopic } from '../profile/types';

/**
 * Reasons a request can be rejected BEFORE it ever reaches a provider.
 * Kept as a closed union so every rejection path is deliberate and
 * loggable, not a free-text string that could leak internals.
 */
export type SecurityRejectionReason =
  | 'schema_invalid'
  | 'too_large'
  | 'rate_limited'
  | 'prompt_injection'
  | 'system_prompt_extraction'
  | 'secret_extraction'
  | 'out_of_scope';

export interface SecurityRejection {
  ok: false;
  reason: SecurityRejectionReason;
  /** Safe, generic, user-facing message. Never includes detection detail. */
  userMessage: string;
  /** Internal-only detail for logs. Never sent to the client. */
  internalDetail: string;
}

export interface SecurityClearance {
  ok: true;
  /** Unicode-normalized, sanitized message text, safe to embed as user data. */
  cleanMessage: string;
  /** Topics the classifier believes this message concerns. */
  topics: ProfileTopic[];
  /** Whether the message looks like a legitimate portfolio question at all. */
  inScope: boolean;
}

export type SecurityCheckResult = SecurityClearance | SecurityRejection;

export interface SecurityEvent {
  requestId: string;
  timestamp: string;
  event:
    | 'request_received'
    | 'schema_rejected'
    | 'size_rejected'
    | 'rate_limited'
    | 'injection_detected'
    | 'extraction_attempt_detected'
    | 'out_of_scope'
    | 'scope_classified'
    | 'provider_call'
    | 'provider_fallback'
    | 'provider_failure_final'
    | 'output_rejected'
    | 'response_sent';
  detail?: Record<string, unknown>;
}
