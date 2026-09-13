import type { SecurityEvent } from './types';

/**
 * LAYER 14 — SECURITY-EVENT LOGGING
 * --------------------------------------
 * Logs structured, security-relevant events (never secrets, never full
 * raw user message text, never provider API keys or request headers).
 * The message content is reduced to a short, truncated preview purely
 * for triage — never the full text, and never anything that echoes a
 * detected injection payload verbatim beyond a short snippet.
 *
 * In production, swap `console.log` for a real sink (e.g. a structured
 * logging service) behind the same `logSecurityEvent` function signature.
 */

const SENSITIVE_KEY_PATTERN = /key|token|secret|password|authorization/i;

function redactDetail(detail?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!detail) return undefined;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      redacted[key] = '[redacted]';
      continue;
    }
    if (typeof value === 'string' && value.length > 200) {
      redacted[key] = `${value.slice(0, 200)}…[truncated]`;
      continue;
    }
    redacted[key] = value;
  }
  return redacted;
}

export function logSecurityEvent(event: SecurityEvent): void {
  const safeEvent: SecurityEvent = {
    ...event,
    detail: redactDetail(event.detail),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ scope: 'security', ...safeEvent }));
}

export function previewText(text: string, maxLen = 80): string {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  return singleLine.length > maxLen ? `${singleLine.slice(0, maxLen)}…` : singleLine;
}
