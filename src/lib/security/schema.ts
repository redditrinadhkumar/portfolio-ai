import { z } from 'zod';

/**
 * LAYER 1 — REQUEST SCHEMA VALIDATION
 * ------------------------------------
 * Strict, closed schema. No `.passthrough()`, no optional escape hatches.
 * Anything that doesn't match this shape is rejected before any other
 * security layer or provider even sees it.
 */

export const MAX_MESSAGE_CHARS = 1200;
export const MAX_HISTORY_ITEMS = 12;
export const MAX_TOTAL_REQUEST_CHARS = 16000; // layer 2 also double-checks this on raw body

const roleSchema = z.enum(['user', 'assistant']);

const chatMessageSchema = z.object({
  role: roleSchema,
  content: z
    .string()
    .min(1, 'Message cannot be empty.')
    .max(MAX_MESSAGE_CHARS, `Message exceeds ${MAX_MESSAGE_CHARS} characters.`),
});

export const chatRequestSchema = z
  .object({
    message: z
      .string()
      .min(1, 'Message cannot be empty.')
      .max(MAX_MESSAGE_CHARS, `Message exceeds ${MAX_MESSAGE_CHARS} characters.`),
    // Conversation history is client-echoed for continuity only. It is
    // ALWAYS treated as untrusted data (see promptBuilder.ts) — never as
    // instructions, and never persisted server-side beyond the request.
    history: z.array(chatMessageSchema).max(MAX_HISTORY_ITEMS).optional().default([]),
  })
  .strict();

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export interface SchemaValidationSuccess {
  ok: true;
  data: ChatRequestInput;
}
export interface SchemaValidationFailure {
  ok: false;
  detail: string;
}

export function validateChatRequestSchema(
  raw: unknown,
): SchemaValidationSuccess | SchemaValidationFailure {
  const parsed = chatRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      detail: firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid request body.',
    };
  }
  return { ok: true, data: parsed.data };
}
