import { normalizeUnicode } from './unicode';

/**
 * LAYER 4 — INPUT SANITIZATION
 * ------------------------------
 * Runs after Unicode normalization. Produces a clean, plain-text version
 * of the user's message that:
 *  - collapses excessive whitespace/newlines used to push content out of
 *    an attention window or bury injected instructions,
 *  - strips raw HTML/script-like markup so it can never be replayed
 *    into any HTML context downstream,
 *  - trims to the enforced max length as a final belt-and-braces check.
 *
 * This does NOT attempt to interpret meaning — that's the injection
 * detector and scope classifier's job. This layer only removes structural
 * ways of hiding or smuggling content.
 */

const HTML_TAG_REGEX = /<[^>]*>/g;
const EXCESSIVE_WHITESPACE_REGEX = /[ \t\f\v]{3,}/g;
const EXCESSIVE_NEWLINES_REGEX = /\n{3,}/g;

export interface SanitizationResult {
  sanitized: string;
  flags: {
    hadInvisibleChars: boolean;
    hadConfusables: boolean;
    hadControlChars: boolean;
    hadHtmlMarkup: boolean;
    wasTruncated: boolean;
  };
}

export function sanitizeUserText(rawInput: string, maxLength: number): SanitizationResult {
  const { normalized, hadInvisibleChars, hadConfusables, hadControlChars } =
    normalizeUnicode(rawInput);

  const hadHtmlMarkup = HTML_TAG_REGEX.test(normalized);
  const withoutHtml = normalized.replace(HTML_TAG_REGEX, ' ');

  const collapsed = withoutHtml
    .replace(EXCESSIVE_NEWLINES_REGEX, '\n\n')
    .replace(EXCESSIVE_WHITESPACE_REGEX, '  ')
    .trim();

  const wasTruncated = collapsed.length > maxLength;
  const sanitized = wasTruncated ? collapsed.slice(0, maxLength) : collapsed;

  return {
    sanitized,
    flags: { hadInvisibleChars, hadConfusables, hadControlChars, hadHtmlMarkup, wasTruncated },
  };
}
