import { PROFILE_TOPICS, type ProfileTopic } from '../profile/types';

/**
 * LAYER 6 — PROFILE-SCOPE CLASSIFICATION
 * -----------------------------------------
 * A fast, deterministic (non-LLM) classifier that does two jobs:
 *  1. Decides which profile topics a question is about, so the prompt
 *     builder only grounds the model in the relevant slice of profile
 *     data (useful now, and required once this becomes RAG-backed).
 *  2. Flags messages that are confidently OFF-TOPIC (general coding help,
 *     math, weather, politics, medical/financial advice, unrelated
 *     trivia, "write me a poem", etc.) with no portfolio-related content
 *     at all, so the API layer can refuse before spending a provider call.
 *
 * This is intentionally conservative about hard-rejecting: ambiguous or
 * conversational messages (greetings, "what can you help with?", short
 * follow-ups referencing earlier answers) are treated as in-scope-ish and
 * passed through — final scope enforcement for nuanced cases is also done
 * by the system prompt itself (defense-in-depth, not a single point of
 * failure).
 */

export interface ScopeClassification {
  inScope: boolean;
  confidentlyOffTopic: boolean;
  topics: ProfileTopic[];
}

const TOPIC_KEYWORDS: Record<ProfileTopic, RegExp[]> = {
  identity: [/\bwho\s+(is|are)\s+you\b/i, /\byour\s+name\b/i, /\babout\s+you\b/i, /\bwho\s+is\s+trinadh\b/i],
  summary: [/\bsummary\b/i, /\bprofile\b/i, /\boverview\b/i, /\btell\s+me\s+about\s+(him|yourself|trinadh)\b/i],
  education: [/\beducation\b/i, /\bdegree\b/i, /\bcollege\b/i, /\buniversity\b/i, /\bcgpa\b/i, /\bschool\b/i, /\bb\.?tech\b/i],
  experience: [
    /\bexperience\b/i,
    /\bintern(ship)?\b/i,
    /\bwork\s+history\b/i,
    /\bemploy(er|ment)\b/i,
    /\bjob\b/i,
    /\bcompany\b/i,
    /\brole\b/i,
  ],
  skills: [/\bskills?\b/i, /\btech\s*stack\b/i, /\btechnolog(y|ies)\b/i, /\blanguages?\b/i, /\btools?\b/i, /\bframeworks?\b/i],
  projects: [/\bprojects?\b/i, /\bbuilt\b/i, /\brag\b/i, /\blanggraph\b/i, /\bportfolio\s+project/i, /\bgithub\b/i],
  certifications: [/\bcertificat(e|ion)s?\b/i, /\bcourses?\b/i, /\bcredential/i],
  achievements: [/\bachievements?\b/i, /\bawards?\b/i, /\baccomplishments?\b/i],
  interests: [/\binterests?\b/i, /\bhobb(y|ies)\b/i, /\bpassions?\b/i, /\benjoys?\b/i],
  contact: [/\bcontact\b/i, /\bemail\b/i, /\bphone\b/i, /\breach\s+(him|out)\b/i, /\blinkedin\b/i, /\bhire\b/i],
};

const PORTFOLIO_GENERIC_KEYWORDS = [
  /\bportfolio\b/i,
  /\bresume\b/i,
  /\bcv\b/i,
  /\btrinadh\b/i,
  /\bhim\b/i,
  /\bhis\b/i,
];

const GREETING_PATTERNS = [
  /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening))\b/i,
  /\bwhat\s+can\s+you\s+(help|do)\b/i,
  /\bwho\s+are\s+you\b/i,
];

// High-confidence signals that the request is about something entirely
// outside the assistant's purpose, with nothing tying it to the profile.
const OFF_TOPIC_SIGNALS: RegExp[] = [
  /\bweather\b/i,
  /\bwhat'?s\s+\d+\s*[+\-*/]\s*\d+\b/i,
  /\bsolve\s+(this\s+)?(equation|math)\b/i,
  /\b(current\s+)?(president|prime\s+minister)\s+of\b/i,
  /\bstock\s+price\b/i,
  /\bmedical\s+advice\b/i,
  /\bshould\s+i\s+take\b.*\b(medicine|medication|drug)\b/i,
  /\bfinancial\s+advice\b/i,
  /\bwrite\s+(me\s+)?(a\s+)?(poem|story|essay|song)\b/i,
  /\btranslate\s+this\s+(sentence|paragraph)\b/i,
  /\bhow\s+do\s+i\s+(cook|bake)\b/i,
  /\brecipe\s+for\b/i,
  /\bwho\s+won\s+the\s+(game|match|election)\b/i,
  /\bdebug\s+my\s+code\b/i,
  /\bwrite\s+(a\s+)?(python|javascript|java|c\+\+)\s+(script|program|function)\s+(that|to)\b/i,
  /\bhomework\b/i,
];

export function classifyScope(cleanText: string): ScopeClassification {
  const topics = new Set<ProfileTopic>();

  for (const topic of PROFILE_TOPICS) {
    const patterns = TOPIC_KEYWORDS[topic];
    if (patterns.some((p) => p.test(cleanText))) {
      topics.add(topic);
    }
  }

  const mentionsPortfolioGenerically = PORTFOLIO_GENERIC_KEYWORDS.some((p) => p.test(cleanText));
  const isGreetingOrMeta = GREETING_PATTERNS.some((p) => p.test(cleanText));
  const hasOffTopicSignal = OFF_TOPIC_SIGNALS.some((p) => p.test(cleanText));

  const hasAnyPortfolioSignal = topics.size > 0 || mentionsPortfolioGenerically || isGreetingOrMeta;

  // Only mark confidently off-topic when there's an explicit off-topic
  // signal AND nothing at all ties the message back to the portfolio.
  const confidentlyOffTopic = hasOffTopicSignal && !hasAnyPortfolioSignal;

  return {
    inScope: !confidentlyOffTopic,
    confidentlyOffTopic,
    topics: Array.from(topics),
  };
}
