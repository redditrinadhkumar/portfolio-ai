/**
 * LAYER 5 — PROMPT INJECTION / JAILBREAK / EXTRACTION DETECTION
 * ----------------------------------------------------------------
 * This is a heuristic, defense-in-depth application-layer filter. It is
 * explicitly NOT a claim of "100% jailbreak proof" — LLM behavior is
 * probabilistic, so this layer's job is to catch the large, well-known
 * classes of attack BEFORE the model ever sees the message, and to work
 * together with (not instead of) the system prompt's own instructions and
 * the output validator.
 *
 * Design: multiple independent signal categories, each contributing a
 * score, combined with a couple of high-confidence single-signal rules
 * (e.g. explicit "reveal your system prompt"). A single obscure keyword
 * match is not enough to block a normal question ("ignore" could appear
 * in "what's your experience with error handling, ignoring edge cases?"),
 * so most categories require corroboration or an unambiguous pattern.
 */

export type InjectionCategory =
  | 'instruction_override'
  | 'role_manipulation'
  | 'system_prompt_extraction'
  | 'secret_extraction'
  | 'encoded_payload'
  | 'delimiter_smuggling'
  | 'scope_escape';

export interface InjectionSignal {
  category: InjectionCategory;
  match: string;
  weight: number;
}

export interface InjectionDetectionResult {
  isSuspicious: boolean;
  /** True only for confident, targeted extraction attempts — used to pick the specific rejection reason. */
  isExtractionAttempt: boolean;
  score: number;
  signals: InjectionSignal[];
}

const OVERRIDE_PATTERNS: RegExp[] = [
  /\bignore\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)\b/i,
  /\bdisregard\s+(all\s+|any\s+)?(previous|prior|above)\s+(instructions?|rules?)\b/i,
  /\bforget\s+(all\s+|any\s+)?(previous|prior|your)\s+(instructions?|rules?|training)\b/i,
  /\boverride\s+(your\s+)?(instructions?|rules?|system)\b/i,
  /\bnew\s+instructions?\s*:\s*/i,
  /\bfrom\s+now\s+on\s*,?\s*you\s+(will|must|shall)\b/i,
  /\byou\s+(must|will)\s+now\s+(act|respond|behave)\b/i,
];

const ROLE_MANIPULATION_PATTERNS: RegExp[] = [
  /\bdeveloper\s+mode\b/i,
  /\bdan\s+mode\b/i,
  /\bunrestricted\s+mode\b/i,
  /\bjailbreak(ed)?\b/i,
  /\bact\s+as\s+(if\s+you\s+(are|were)\s+)?(a|an)\s+(?!ai\s+portfolio\s+assistant\b)/i,
  /\bpretend\s+(to\s+be|you\s+are|you're)\b/i,
  /\byou\s+are\s+no\s+longer\b/i,
  /\bswitch\s+to\s+(a\s+)?(different|new)\s+(persona|role|mode|character)\b/i,
  /\bwithout\s+(any\s+)?(restrictions?|limitations?|filters?|guardrails?)\b/i,
  /\bno\s+(rules|restrictions|limits)\s+(apply|now)\b/i,
  /\brespond\s+as\s+(if\s+you\s+had\s+)?no\s+(guidelines|restrictions|policy)\b/i,
];

const SYSTEM_PROMPT_EXTRACTION_PATTERNS: RegExp[] = [
  /\b(reveal|show|print|display|output|leak|repeat|share)\s+(me\s+)?(your\s+)?(system|initial|hidden|internal)\s+(prompt|instructions?|message)\b/i,
  /\bwhat\s+(are|were)\s+your\s+(system\s+)?(instructions?|rules?|prompt)\b/i,
  /\brepeat\s+(the\s+)?(text|words?)\s+above\b/i,
  /\bprint\s+everything\s+(above|before)\s+this\b/i,
  /\bwhat\s+did\s+(the\s+developer|anthropic|your\s+creator)\s+tell\s+you\b/i,
  /\bverbatim\b.{0,20}\b(prompt|instructions?)\b/i,
  /\btranslate\s+your\s+(system\s+)?(prompt|instructions?)\b/i,
  /\bsummari[sz]e\s+your\s+(system\s+)?(prompt|instructions?|rules?)\b/i,
];

const SECRET_EXTRACTION_PATTERNS: RegExp[] = [
  /\bapi[\s_-]?key\b/i,
  /\benv(ironment)?\s+variables?\b/i,
  /\.env\b/i,
  /\bopenrouter[\s_-]?key\b/i,
  /\bgemini[\s_-]?key\b/i,
  /\bsecret\s+(key|token|credential)\b/i,
  /\bconfig(uration)?\s+file\b/i,
  /\bserver\s+(config|secrets?|internals?)\b/i,
  /\bwhat\s+model\s+(provider|are\s+you\s+using|is\s+running\s+you)\b/i,
];

const DELIMITER_SMUGGLING_PATTERNS: RegExp[] = [
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[\s*inst\s*\]/i,
  /\[\/\s*inst\s*\]/i,
  /```+\s*system\b/i,
  /^\s*system\s*:/im,
  /^\s*assistant\s*:/im,
  /###\s*(system|instruction)\b/i,
  /\bend\s+of\s+(system\s+)?prompt\b/i,
];

const SCOPE_ESCAPE_PATTERNS: RegExp[] = [
  /\bignore\s+the\s+portfolio\b/i,
  /\bstop\s+being\s+a\s+portfolio\s+assistant\b/i,
  /\bact\s+as\s+a\s+general[\s-]purpose\s+(assistant|chatbot)\b/i,
  /\banswer\s+as\s+(a\s+)?normal\s+(ai|chatgpt|llm|assistant)\b/i,
];

// Long contiguous runs of base64/hex-looking characters are a common way to
// smuggle encoded instructions past text-based filters, expecting the
// model to decode and follow them.
const BASE64_BLOB_REGEX = /(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/;
const HEX_BLOB_REGEX = /\b(?:[0-9a-fA-F]{2}\s?){20,}\b/;
const EXPLICIT_ENCODING_MENTION = /\b(base64|rot13|hex(adecimal)?\s+encoded?)\b/i;
// "decode this and execute/follow/obey it" is itself a strong signal
// independent of whether a blob is actually present — it's asking the
// model to treat decoded content as instructions.
const DECODE_AND_OBEY_PATTERN = /\bdecode\b.{0,20}\b(and\s+)?(execute|follow|obey|run|do\s+what\s+it\s+says)\b/i;

function scanPatterns(
  text: string,
  patterns: RegExp[],
  category: InjectionCategory,
  weight: number,
): InjectionSignal[] {
  const signals: InjectionSignal[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      signals.push({ category, match: match[0].slice(0, 80), weight });
    }
  }
  return signals;
}

export function detectInjection(cleanText: string): InjectionDetectionResult {
  const signals: InjectionSignal[] = [
    ...scanPatterns(cleanText, OVERRIDE_PATTERNS, 'instruction_override', 3),
    ...scanPatterns(cleanText, ROLE_MANIPULATION_PATTERNS, 'role_manipulation', 2),
    ...scanPatterns(cleanText, SYSTEM_PROMPT_EXTRACTION_PATTERNS, 'system_prompt_extraction', 4),
    ...scanPatterns(cleanText, SECRET_EXTRACTION_PATTERNS, 'secret_extraction', 4),
    ...scanPatterns(cleanText, DELIMITER_SMUGGLING_PATTERNS, 'delimiter_smuggling', 3),
    ...scanPatterns(cleanText, SCOPE_ESCAPE_PATTERNS, 'scope_escape', 2),
  ];

  if (BASE64_BLOB_REGEX.test(cleanText) || HEX_BLOB_REGEX.test(cleanText)) {
    signals.push({ category: 'encoded_payload', match: '[encoded-looking blob]', weight: 3 });
  }
  if (EXPLICIT_ENCODING_MENTION.test(cleanText)) {
    signals.push({ category: 'encoded_payload', match: '[explicit encoding mention]', weight: 1 });
  }
  if (DECODE_AND_OBEY_PATTERN.test(cleanText)) {
    signals.push({ category: 'encoded_payload', match: '[decode-and-obey instruction]', weight: 3 });
  }

  const score = signals.reduce((sum, s) => sum + s.weight, 0);

  const isExtractionAttempt = signals.some(
    (s) => s.category === 'system_prompt_extraction' || s.category === 'secret_extraction',
  );

  // Threshold tuned so a single ambiguous/low-weight signal doesn't block a
  // normal question, but any high-confidence pattern (weight >= 3) or a
  // combination of weaker ones does.
  const isSuspicious = score >= 3;

  return { isSuspicious, isExtractionAttempt, score, signals };
}
