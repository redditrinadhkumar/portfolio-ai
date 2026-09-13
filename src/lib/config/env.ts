/**
 * SERVER-ONLY CONFIGURATION
 * -----------------------------
 * This module is the ONLY place `process.env` is read for AI provider
 * secrets. It is imported exclusively by server-side code (`app/api/**`
 * and `lib/ai/**`, `lib/security/**`). None of these values are prefixed
 * with `NEXT_PUBLIC_`, so Next.js will never inline them into a client
 * bundle. Never import this module from a file under `components/`.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Thrown only server-side, at request time inside the API route's
    // try/catch — never surfaced to the client with its message intact.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function optionalIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const serverConfig = {
  openRouter: {
    get apiKey() {
      return requireEnv('OPENROUTER_API_KEY');
    },
    model: optionalEnv('OPENROUTER_MODEL', 'openrouter/auto'),
    baseUrl: optionalEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
  },
  gemini: {
    get apiKey() {
      return requireEnv('GEMINI_API_KEY');
    },
    model: optionalEnv('GEMINI_MODEL', 'gemini-1.5-flash'),
    baseUrl: optionalEnv('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
  },
  requestTimeoutMs: optionalIntEnv('AI_REQUEST_TIMEOUT_MS', 15_000),
  rateLimit: {
    maxRequests: optionalIntEnv('RATE_LIMIT_MAX_REQUESTS', 20),
    windowMs: optionalIntEnv('RATE_LIMIT_WINDOW_MS', 60_000),
  },
  deployEnv: optionalEnv('DEPLOY_ENV', 'development'),
};
