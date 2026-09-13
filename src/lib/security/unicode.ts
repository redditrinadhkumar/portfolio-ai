/**
 * LAYER 3 — UNICODE NORMALIZATION
 * ---------------------------------
 * Attackers use confusable characters, invisible/zero-width characters,
 * bidi control characters, and alternate Unicode normalization forms to
 * smuggle instructions past naive string/keyword filters (e.g. spelling
 * "ignore" with Cyrillic look-alikes, or hiding text behind zero-width
 * joiners). This layer canonicalizes text BEFORE any detection logic runs,
 * so detection operates on a normalized, visible representation.
 */

// Zero-width / invisible formatting characters commonly used to break up
// or hide flagged keywords from naive filters.
const INVISIBLE_CHARS_REGEX =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\u00AD\u034F\u061C]/g;

// Common Unicode "confusable" Latin look-alikes mapped to plain ASCII.
// Not exhaustive (no filter is) — one layer among several.
const CONFUSABLE_MAP: Record<string, string> = {
  а: 'a', // Cyrillic a
  е: 'e', // Cyrillic e
  о: 'o', // Cyrillic o
  р: 'p', // Cyrillic r
  с: 'c', // Cyrillic s
  х: 'x', // Cyrillic h
  і: 'i', // Cyrillic i
  ѕ: 's', // Cyrillic dze
  ᴜ: 'u',
  Ａ: 'A',
  Ｂ: 'B',
  Ｅ: 'E',
  Ｉ: 'I',
  Ｏ: 'O',
  Ｓ: 'S',
};

function replaceConfusables(input: string): string {
  let out = '';
  for (const ch of input) {
    out += CONFUSABLE_MAP[ch] ?? ch;
  }
  return out;
}

export interface NormalizationResult {
  normalized: string;
  hadInvisibleChars: boolean;
  hadConfusables: boolean;
  hadControlChars: boolean;
}

export function normalizeUnicode(input: string): NormalizationResult {
  // NFKC folds compatibility variants (full-width forms, ligatures, etc.)
  // into a canonical representation.
  const nfkc = input.normalize('NFKC');

  const hadInvisibleChars = INVISIBLE_CHARS_REGEX.test(nfkc);
  const withoutInvisibles = nfkc.replace(INVISIBLE_CHARS_REGEX, '');

  const replaced = replaceConfusables(withoutInvisibles);
  const hadConfusables = replaced !== withoutInvisibles;

  // Strip remaining C0/C1 control characters except standard whitespace
  // (\t \n \r), which the sanitizer normalizes separately.
  // eslint-disable-next-line no-control-regex
  const controlRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
  const hadControlChars = controlRegex.test(replaced);
  const clean = replaced.replace(controlRegex, '');

  return {
    normalized: clean,
    hadInvisibleChars,
    hadConfusables,
    hadControlChars,
  };
}
