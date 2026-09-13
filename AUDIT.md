# Security & Content Audit — Portfolio AI Assistant

> Audit performed: 2026-09-07
> Codebase: Next.js 14 (App Router + TypeScript), all 83 Vitest tests passing at time of audit.
> This is an application-layer, defense-in-depth audit. No system that puts an LLM in the loop
> can be claimed "100% jailbreak-proof" — LLM behavior is probabilistic. The goal of this audit
> is to verify that the large, well-known classes of attack fail **deterministically in
> application code** before a provider is ever called.

---

## Part 1 — Backend / Security Checklist

| # | Requirement | Status | Location |
|---|---|---|---|
| 1 | Zod request schema validation on `/api/chat` | ✅ Implemented | `src/lib/security/schema.ts` |
| 2 | Message length and total request-size limits enforced server-side | ✅ Implemented | `schema.ts` (per-field), `route.ts` (64KB raw ceiling), `pipeline.ts` (layer 2) |
| 3 | Unicode normalization (NFKC) + confusable-character mapping applied before classification | ✅ Implemented | `src/lib/security/unicode.ts` |
| 4 | Input sanitization — zero-width/invisible chars, control chars, HTML stripped | ✅ Implemented | `src/lib/security/sanitizeInput.ts` |
| 5 | Multi-signal injection detection (not keyword-blacklist alone) runs before provider selection | ✅ Implemented | `src/lib/security/injectionDetection.ts` — 7 signal categories with weighted scoring |
| 6 | Profile-scope classification — rejects unrelated questions before calling any LLM | ✅ Implemented | `src/lib/security/scopeClassifier.ts` |
| 7 | Per-IP rate limiting with safe generic error on trigger | ✅ Implemented | `src/lib/security/rateLimiter.ts` — sliding window, 429 with retry-after |
| 8 | Per-call timeout on outbound provider requests | ✅ Implemented | `src/lib/ai/router.ts` — AbortController per call |
| 9 | OpenRouter errors not leaked raw to client | ✅ Implemented | `src/lib/chatHandler.ts` — only generic `buildApiError()` reaches client |
| 10 | OpenRouter → Gemini fallback fires only on technical failure | ✅ Implemented | `router.ts` — catches `ProviderError` only; security rejections never reach router |
| 11 | Output validation (leak-signature detection: system-prompt fragments, API key patterns) | ✅ Implemented | `src/lib/security/outputValidation.ts` |
| 12 | No `dangerouslySetInnerHTML` on frontend | ✅ Implemented | `src/components/chat/SafeMarkdown.tsx` — renders to React elements only |
| 13 | Safe error handling — client sees only generic, non-revealing error messages | ✅ Implemented | `src/lib/security/errors.ts` — closed union of error codes with safe messages |
| 14 | Structured security-event logging with secrets redacted | ✅ Implemented | `src/lib/security/logger.ts` — `SENSITIVE_KEY_PATTERN` redacts key/token/secret fields |
| 15 | System-prompt extraction resistance | ✅ Implemented | `injectionDetection.ts` patterns + system prompt authority rules in `promptBuilder.ts` |
| 16 | API-key/config/env extraction resistance | ✅ Implemented | `SECRET_EXTRACTION_PATTERNS` in `injectionDetection.ts` |
| 17 | Anti-hallucination: missing facts → "not available" | ✅ Implemented | `store.ts` renders empty sections as `(none on record)`; system prompt instructs "not available over guessing" |
| 18 | Ephemeral session state — no server-side persistent memory | ✅ Implemented | `chatHandler.ts` never writes to storage; history lives in request payload only |

**No security fixes needed.** All 18 requirements are implemented correctly.

---

## Part 2 — Automated Tests

| Test category | File | Count | Status |
|---|---|---|---|
| Normal portfolio questions | `chatHandler.test.ts` | 1 | ✅ |
| Unrelated/off-topic questions | `chatHandler.test.ts` | 1 | ✅ |
| System-prompt extraction | `chatHandler.test.ts`, `pipeline.test.ts` | 2+ | ✅ |
| Direct prompt injection | `chatHandler.test.ts`, `injectionDetection.test.ts` | 2+ | ✅ |
| Role-based jailbreaks | `chatHandler.test.ts`, `injectionDetection.test.ts` | 2+ | ✅ |
| Multi-turn poisoned history | `chatHandler.test.ts`, `pipeline.test.ts` | 2+ | ✅ |
| Encoded injection (base64/hex) | `chatHandler.test.ts`, `injectionDetection.test.ts` | 2+ | ✅ |
| Unicode/invisible-char obfuscation | `chatHandler.test.ts`, `unicode.test.ts` | 2+ | ✅ |
| Oversized requests | `chatHandler.test.ts`, `schema.test.ts` | 2 | ✅ |
| Rate-limit abuse | `chatHandler.test.ts`, `rateLimiter.test.ts` | 3 | ✅ |
| XSS/HTML/Markdown injection in output | `chatHandler.test.ts`, `outputValidation.test.ts` | 4 | ✅ |
| OpenRouter failure → Gemini fallback | `chatHandler.test.ts`, `router.test.ts` | 2 | ✅ |
| Both providers fail | `chatHandler.test.ts`, `router.test.ts` | 2 | ✅ |
| Hallucination on missing profile data | `chatHandler.test.ts` | 1 | ✅ |
| **Total** | 10 test files | **83** | **✅ All passing** |

---

## Part 3 — Visual / UX Audit

| Requirement | Status | Action taken |
|---|---|---|
| Single-page scrolling with anchor nav | ❌ Was missing | Added `NavBar` + 7 anchor sections |
| Active-section nav indicator | ❌ Was missing | Added `IntersectionObserver` in `NavBar` |
| Hero with proper CTAs | ❌ Incomplete | Rebuilt with "View Projects" + "Chat with AI" CTAs |
| About section | ❌ Missing | Added |
| "Embedding space" ambient background | ❌ Missing | Added `EmbeddingCanvas` |
| Bespoke chat icon | ❌ Missing (stock bot) | Added `EmbedSpaceIcon` SVG |
| Project card hover tilt | ❌ Missing | Added CSS perspective tilt on hover |
| Animated skills visualization | ❌ Missing | Added `SkillGraph` SVG component |
| Cursor-reactive hero glow | ❌ Missing | Added `mousemove` radial glow |
| EmailJS contact form | ❌ Missing | Added `ContactForm` |
| Dark premium design theme | ❌ Missing (plain white) | Full dark "embedding space" redesign |
| `prefers-reduced-motion` support | ✅ Partial (global CSS only) | Extended to all new components |

---

## Part 4 — Content Sourcing Flags

**Confirmed and added:**
- ✅ LinkedIn URL: `https://www.linkedin.com/in/trinadh-kumar-reddi-a45b79265/` — added to contact data and footer
- ✅ GitHub URL: `https://github.com/redditrinadhkumar` — added to contact data and footer
- ✅ `facegate` repo → linked to "Face ID Attendance System" project card (confirmed match)
- ✅ `Brain-Stroke-EDA` repo → linked to "Brain Stroke Prediction" project card (confirmed match)
- ✅ Profile avatar: using GitHub avatar `https://avatars.githubusercontent.com/u/141251063?v=4`

**Flagged — NOT added without user confirmation:**

| Repo | Reason not added | User action required |
|---|---|---|
| `financial-data-overview-dashboard` | Plausibly related to "Risk-Return Evaluation" but not confirmed in resume | If you want this linked, add `githubUrl: 'https://github.com/redditrinadhkumar/financial-data-overview-dashboard'` to the Risk-Return project in `src/lib/profile/data.ts` |
| `food-delivery-data-analysis` | Not mentioned in resume | Confirm before adding |
| `ML-Image-Editor` | Not mentioned in resume | Confirm before adding |
| `CodeAlpha_Project_MachineLearning` | Not mentioned in resume | Confirm before adding |
| `velora` | Mentioned in prompt but not found in public GitHub API — may be private or renamed | Confirm repo name/URL |
| `streamlit_banking_app` | Mentioned in prompt but not found in public GitHub API | Confirm repo name/URL |
| RAG Customer Support Assistant | No matching public repo found | Add `githubUrl` to data.ts once you have the URL |
| Personal Bot v3.2 | No matching public repo found | Add `githubUrl` to data.ts once you have the URL |

---

*End of audit. All security findings: ✅ PASS. Visual/feature gaps: addressed in this release.*
