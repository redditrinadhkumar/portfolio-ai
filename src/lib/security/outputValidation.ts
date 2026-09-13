/**
 * LAYER 11/12 — OUTPUT VALIDATION & MARKDOWN/HTML SANITIZATION
 * -----------------------------------------------------------------
 * Even a well-grounded model can occasionally be coaxed into echoing
 * something it shouldn't, or a provider can return malformed content.
 * This layer treats MODEL OUTPUT as untrusted too:
 *   - strips any raw HTML/script-like markup (the client-side renderer
 *     also never uses dangerouslySetInnerHTML, so this is defense in
 *     depth, not the only guard),
 *   - neutralizes non-http(s) URI schemes (javascript:, data:, vbscript:)
 *     inside markdown-style links,
 *   - enforces a maximum response length,
 *   - scans for accidental system-prompt/secret leakage patterns and
 *     replaces the whole response with a safe generic message if found,
 *     rather than trying to surgically redact (safer failure mode).
 */

export const MAX_OUTPUT_CHARS = 4000;

const SCRIPT_OR_TAG_REGEX = /<\s*(script|style|iframe|object|embed|link|meta)[^>]*>/gi;
const ANY_HTML_TAG_REGEX = /<[^>]+>/g;
const DANGEROUS_URI_SCHEME_REGEX = /\b(javascript|data|vbscript):/gi;

// Patterns that would indicate the model is reciting internal
// configuration rather than answering the question.
const LEAK_SIGNATURE_PATTERNS: RegExp[] = [
  /OPENROUTER_API_KEY/i,
  /GEMINI_API_KEY/i,
  /sk-or-[a-z0-9]/i,
  /you are the personal portfolio ai assistant/i, // literal system-prompt opener, see promptBuilder
  /##\s*trusted\s+profile\s+data/i,
  /begin\s+system\s+prompt/i,
];

export interface OutputValidationResult {
  safeText: string;
  wasModified: boolean;
  wasBlocked: boolean;
}

const SAFE_FALLBACK_TEXT =
  "I can't share that. I can tell you about my education, experience, skills, projects, certifications, achievements, interests, or how to get in touch — what would you like to know?";

export function validateAndSanitizeOutput(rawText: string): OutputValidationResult {
  if (!rawText || typeof rawText !== 'string') {
    return { safeText: SAFE_FALLBACK_TEXT, wasModified: true, wasBlocked: true };
  }

  if (LEAK_SIGNATURE_PATTERNS.some((p) => p.test(rawText))) {
    return { safeText: SAFE_FALLBACK_TEXT, wasModified: true, wasBlocked: true };
  }

  let text = rawText;
  let wasModified = false;

  if (SCRIPT_OR_TAG_REGEX.test(text) || ANY_HTML_TAG_REGEX.test(text)) {
    text = text.replace(SCRIPT_OR_TAG_REGEX, '').replace(ANY_HTML_TAG_REGEX, '');
    wasModified = true;
  }

  if (DANGEROUS_URI_SCHEME_REGEX.test(text)) {
    text = text.replace(DANGEROUS_URI_SCHEME_REGEX, 'blocked:');
    wasModified = true;
  }

  if (text.length > MAX_OUTPUT_CHARS) {
    text = `${text.slice(0, MAX_OUTPUT_CHARS)}…`;
    wasModified = true;
  }

  text = text.trim();
  if (text.length === 0) {
    return { safeText: SAFE_FALLBACK_TEXT, wasModified: true, wasBlocked: true };
  }

  return { safeText: text, wasModified, wasBlocked: false };
}
