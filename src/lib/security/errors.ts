/**
 * LAYER 13 — SAFE ERROR HANDLING
 * ----------------------------------
 * A single place that maps every failure mode to a generic, user-safe
 * message and an HTTP status. No branch in the API route is allowed to
 * send a raw provider error, stack trace, or internal detail to the
 * client — everything funnels through here.
 */

export type ApiErrorCode =
  | 'invalid_request'
  | 'too_large'
  | 'rate_limited'
  | 'blocked'
  | 'out_of_scope'
  | 'provider_unavailable'
  | 'internal_error';

export interface ApiErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

const MESSAGES: Record<ApiErrorCode, string> = {
  invalid_request: "That request wasn't formatted correctly. Please try rephrasing your question.",
  too_large: 'Your message is too long. Please shorten it and try again.',
  rate_limited: "You've sent a lot of messages in a short time. Please wait a moment and try again.",
  blocked:
    "I can't help with that request. I'm the portfolio assistant — ask me about education, experience, skills, projects, certifications, achievements, interests, or contact details.",
  out_of_scope:
    "That's outside what I can help with. I'm focused on this portfolio — try asking about experience, skills, projects, education, certifications, or how to get in touch.",
  provider_unavailable:
    "I'm temporarily unable to generate a response. Please try again in a moment.",
  internal_error: 'Something went wrong on our end. Please try again shortly.',
};

const STATUS_CODES: Record<ApiErrorCode, number> = {
  invalid_request: 400,
  too_large: 413,
  rate_limited: 429,
  blocked: 400,
  out_of_scope: 200, // Not an error from the user's perspective — a normal redirect reply.
  provider_unavailable: 503,
  internal_error: 500,
};

export function buildApiError(code: ApiErrorCode): { status: number; payload: ApiErrorPayload } {
  return {
    status: STATUS_CODES[code],
    payload: { error: { code, message: MESSAGES[code] } },
  };
}

export class AppSecurityError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    internalDetail: string,
  ) {
    super(internalDetail);
    this.name = 'AppSecurityError';
  }
}
