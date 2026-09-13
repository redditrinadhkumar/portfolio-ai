/**
 * BESPOKE CHAT LAUNCHER ICON
 * ---------------------------
 * An original SVG depicting an abstracted team of engineers collaborating
 * on a shared build — nodes (people) connected by edges (collaboration)
 * around a central artifact (the commit/project), tying visually to the
 * embedding-space background motif of the rest of the page.
 *
 * Designed to render crisply at 40–56px. No stock chatbot glyph.
 */
export function EmbedSpaceIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Edges (collaboration links) ─────────────────────────────────── */}
      {/* Center → Top-left person */}
      <line x1="24" y1="24" x2="10" y2="12" stroke="rgba(56,189,248,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Center → Top-right person */}
      <line x1="24" y1="24" x2="38" y2="12" stroke="rgba(56,189,248,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Center → Bottom-left person */}
      <line x1="24" y1="24" x2="10" y2="38" stroke="rgba(129,140,248,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Center → Bottom-right person */}
      <line x1="24" y1="24" x2="38" y2="38" stroke="rgba(129,140,248,0.5)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Cross-connections (peer collaboration) */}
      <line x1="10" y1="12" x2="38" y2="12" stroke="rgba(56,189,248,0.2)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 3" />
      <line x1="10" y1="38" x2="38" y2="38" stroke="rgba(129,140,248,0.2)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 3" />

      {/* ── Person nodes (outer) ─────────────────────────────────────────── */}
      {/* Top-left */}
      <circle cx="10" cy="12" r="4.5" fill="rgba(56,189,248,0.15)" stroke="#38BDF8" strokeWidth="1.4" />
      <circle cx="10" cy="12" r="2" fill="#38BDF8" />
      {/* Top-right */}
      <circle cx="38" cy="12" r="4.5" fill="rgba(56,189,248,0.15)" stroke="#38BDF8" strokeWidth="1.4" />
      <circle cx="38" cy="12" r="2" fill="#38BDF8" />
      {/* Bottom-left */}
      <circle cx="10" cy="38" r="4.5" fill="rgba(129,140,248,0.15)" stroke="#818CF8" strokeWidth="1.4" />
      <circle cx="10" cy="38" r="2" fill="#818CF8" />
      {/* Bottom-right */}
      <circle cx="38" cy="38" r="4.5" fill="rgba(129,140,248,0.15)" stroke="#818CF8" strokeWidth="1.4" />
      <circle cx="38" cy="38" r="2" fill="#818CF8" />

      {/* ── Central artifact node (shared build / commit) ─────────────────
          Hexagon shape to suggest a commit/graph node rather than a person. */}
      <polygon
        points="24,16 30,20 30,28 24,32 18,28 18,20"
        fill="rgba(56,189,248,0.12)"
        stroke="url(#center-grad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Inner dot at center — the artifact */}
      <circle cx="24" cy="24" r="2.5" fill="url(#center-grad)" />

      {/* ── Gradient defs ──────────────────────────────────────────────── */}
      <defs>
        <linearGradient id="center-grad" x1="18" y1="16" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
