import { NextRequest, NextResponse } from 'next/server';
import { handleChatRequest } from '@/lib/chatHandler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RAW_BODY_BYTES = 64_000; // generous hard ceiling; the schema layer enforces the real per-field limits

function getClientKey(req: NextRequest): string {
  // Behind most platforms (Vercel, etc.) the true client IP is in
  // x-forwarded-for. This is best-effort identification for rate limiting
  // only — not an auth mechanism, and never logged in full elsewhere.
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export async function POST(req: NextRequest) {
  let rawText: string;
  try {
    rawText = await req.text();
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_request', message: 'Could not read request body.' } },
      { status: 400 },
    );
  }

  if (rawText.length > MAX_RAW_BODY_BYTES) {
    return NextResponse.json(
      { error: { code: 'too_large', message: 'Request body too large.' } },
      { status: 413 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = rawText.length > 0 ? JSON.parse(rawText) : {};
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_request', message: 'Request body must be valid JSON.' } },
      { status: 400 },
    );
  }

  const result = await handleChatRequest({
    rawBody,
    rawBodySizeBytes: rawText.length,
    clientKey: getClientKey(req),
  });

  return NextResponse.json(result.body, { status: result.status });
}

// Only POST is supported. Explicitly reject other methods rather than
// letting Next's default 405 leak framework details.
export async function GET() {
  return NextResponse.json(
    { error: { code: 'invalid_request', message: 'Method not allowed. Use POST.' } },
    { status: 405 },
  );
}
