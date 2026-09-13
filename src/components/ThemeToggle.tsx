'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage may be blocked in some environments
  }
  return null;
}

function applyTheme(theme: Theme, animate: boolean) {
  const root = document.documentElement;
  if (animate) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      root.classList.add('theme-transitioning');
      setTimeout(() => root.classList.remove('theme-transitioning'), 300);
    }
  }
  root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // localStorage may be blocked
  }
}

/**
 * ThemeToggle — accessible sun/moon icon button.
 * Placed in the nav; persists only the theme preference (not any chat content
 * or personal data) to localStorage.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the current attribute set by the FOUC-prevention inline script
    const current = document.documentElement.getAttribute('data-theme') as Theme | null;
    setTheme(current ?? 'dark');
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    setTheme(next);
  }

  // Render a dark-mode icon during SSR / before hydration to avoid layout shift
  const isDark = mounted ? theme === 'dark' : true;

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 dark:hover:bg-white/10 hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-offset-1 cursor-pointer"
      style={{ color: 'var(--color-moon)' }}
    >
      {/* Sun icon — shown in dark mode (clicking switches to light) */}
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.6)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          position: 'absolute',
        }}
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon icon — shown in light mode (clicking switches to dark) */}
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="pointer-events-none"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-90deg) scale(0.6)' : 'rotate(0deg) scale(1)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          position: 'absolute',
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

// ── Exported helper: used by the FOUC-prevention inline script
// (the inline script is inlined directly in layout.tsx, not imported)
export { getStoredTheme, getSystemTheme };
