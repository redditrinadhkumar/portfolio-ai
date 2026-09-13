'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';

const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
];

/**
 * STICKY NAVIGATION BAR
 * ----------------------
 * Glassmorphic top nav with:
 * - Anchor-link smooth scroll to each section
 * - Active-section indicator tracked via IntersectionObserver
 * - Mobile hamburger menu
 * - Keyboard accessible (all links operable via Tab/Enter)
 */
export function NavBar() {
  const [activeSection, setActiveSection] = useState('hero');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);

      // Highlight the last section if near the bottom of the page
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      const lastSection = SECTIONS[SECTIONS.length - 1];
      if (isAtBottom && lastSection) {
        setActiveSection(lastSection.id);
        return;
      }

      // Check section bounding rects to determine the current in-view section
      const scrollThreshold = 180;
      let currentSection = 'hero';

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= scrollThreshold) {
            currentSection = section.id;
          }
        }
      }

      setActiveSection(currentSection);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    const timer = setTimeout(handleScroll, 150);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
    setMenuOpen(false);
  }

  return (
    <nav
      id="navbar"
      role="navigation"
      aria-label="Site navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-2xl ${
        scrolled
          ? 'bg-[var(--nav-glass-bg-scrolled)] border-b border-[var(--nav-glass-border)] shadow-lg shadow-black/5'
          : 'bg-[var(--nav-glass-bg)] border-b border-[var(--nav-glass-border-subtle)]'
      }`}
      style={{
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        backdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={() => scrollTo('hero')}
          className="group flex items-center gap-2.5 font-display font-bold text-starlight text-lg transition-transform duration-200 hover:scale-[1.02]"
          aria-label="Scroll to top"
        >
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-sm shadow-black/20 ring-1 ring-white/10 group-hover:ring-neon/50 transition-all duration-300">
            <Image
              src="/portfolio-logo.svg"
              alt="Trinadh's Portfolio Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="gradient-text tracking-tight">Trinadh&apos;s</span>
            <span className="text-moon text-sm font-normal">Portfolio</span>
          </div>
        </button>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {SECTIONS.slice(1).map((s) => (
            <li key={s.id}>
              <button
                onClick={() => scrollTo(s.id)}
                className={`nav-link px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeSection === s.id
                    ? 'active text-neon'
                    : 'text-moon hover:text-starlight'
                }`}
                aria-current={activeSection === s.id ? 'page' : undefined}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop CTA + Theme toggle */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => {
              const btn = document.getElementById('chat-open-btn');
              btn?.click();
            }}
            className="text-sm px-4 py-2 rounded-full border border-neon/40 text-neon hover:bg-neon/10 transition-all duration-200"
          >
            Ask AI ✦
          </button>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 text-moon hover:text-starlight transition-colors"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden bg-[var(--nav-glass-bg-scrolled)] border-t border-[var(--nav-glass-border)] shadow-xl"
          style={{
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            backdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          <ul className="px-6 py-4 space-y-1" role="list">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSection === s.id
                      ? 'text-neon bg-neon/10'
                      : 'text-moon hover:text-starlight hover:bg-[var(--color-surface-hi)]'
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
          {/* Theme toggle in mobile menu */}
          <div className="px-6 pb-4 flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs text-moon">Toggle theme</span>
          </div>
        </div>
      )}
    </nav>
  );
}
