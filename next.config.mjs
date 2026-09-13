/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

// ── Content-Security-Policy builder ──────────────────────────────────────────
// In development, Next.js Fast Refresh requires 'unsafe-eval'. In production,
// it does not. The hash-based nonce approach would require middleware; for this
// use-case (portfolio, no user-generated HTML) 'unsafe-inline' for styles is
// the practical choice. The critical protection is on the script-src directive.
const csp = [
  "default-src 'self'",
  // Dev: 'unsafe-eval' for Next.js Fast Refresh; webpack HMR websocket.
  // Prod: none needed. In both envs, 'self' covers the app bundle.
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // GitHub avatar, fonts, EmailJS SDK (loaded as npm, so bundled — but cover CDN fallback)
  "img-src 'self' data: https://avatars.githubusercontent.com",
  "font-src 'self' https://fonts.gstatic.com",
  // EmailJS sends from browser to EmailJS API endpoint
  "connect-src 'self' https://api.emailjs.com wss: ws:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // No external remote patterns needed — avatar is served from /public/avatar.jpg
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Never let the chat endpoint (or anything else) be cached or framed.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
