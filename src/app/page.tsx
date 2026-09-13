'use client';

import { useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { profile } from '@/lib/profile/data';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { EmbeddingCanvas } from '@/components/EmbeddingCanvas';
import { SkillGraph } from '@/components/SkillGraph';
import { ContactForm } from '@/components/ContactForm';

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    // Skip if reduced motion is preferred — CSS already handles this
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
            entry.target.classList.remove('section-hidden');
            observer.unobserve(entry.target); // animate once only
          }
        }
      },
      { threshold: 0.08, rootMargin: '-40px 0px' },
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      el.classList.add('section-hidden');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}

// ── Section heading component ─────────────────────────────────────────────────
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-12">
      <p className="font-mono text-xs tracking-widest text-neon/70 uppercase mb-3">{eyebrow}</p>
      <h2 className="font-display font-bold text-3xl sm:text-4xl text-starlight">
        {title}
      </h2>
      <div className="mt-4 h-px w-16" style={{ background: 'linear-gradient(90deg, var(--color-neon), transparent)' }} />
    </div>
  );
}

// ── Project card with tilt effect ─────────────────────────────────────────────
function ProjectCard({ project }: { project: typeof profile.projects[number] }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`;
    card.style.boxShadow = `${-x * 12}px ${-y * 12}px 40px rgba(56,189,248,0.12), 0 4px 24px rgba(0,0,0,0.4)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateZ(0)';
    card.style.boxShadow = '';
  }, []);

  return (
    <article
      ref={cardRef}
      className="project-card glass-card p-6 flex flex-col gap-4"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-semibold text-base text-starlight leading-snug">{project.name}</h3>
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${project.name} source code on GitHub`}
            className="shrink-0 p-1.5 rounded-lg text-moon hover:text-neon transition-colors"
          >
            {/* GitHub mark */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        )}
      </div>

      {/* Stack pills */}
      <div className="flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="font-mono text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.18)',
              color: 'var(--color-neon)',
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Highlights */}
      <ul className="space-y-1.5 text-sm text-moon leading-relaxed" aria-label={`${project.name} highlights`}>
        {project.highlights.slice(0, 2).map((h) => (
          <li key={h} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/40" aria-hidden="true" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  useScrollReveal();

  // Hero cursor-reactive glow
  function handleHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      {/* Ambient background canvas */}
      <EmbeddingCanvas />

      <main className="relative z-10 min-h-screen">

        {/* ═══════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          aria-label="Introduction"
          className="relative min-h-screen flex items-center px-6 sm:px-12 pt-16 overflow-hidden"
          onMouseMove={handleHeroMouseMove}
        >
          {/* Cursor glow overlay */}
          <div className="hero-glow-overlay" aria-hidden="true" />

          {/* Decorative gradient blob */}
          <div
            aria-hidden="true"
            className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20 animate-glow-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(129,140,248,0.3) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          <div className="mx-auto max-w-5xl w-full grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="font-mono text-xs tracking-widest text-neon/80 uppercase animate-fade-up">
                  AI / ML Engineer
                </p>
                <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-starlight animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  {profile.personal.fullName.split(' ').map((word, i) => (
                    <span key={i} className={i === 1 ? 'gradient-text' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                <p className="text-lg text-moon leading-relaxed max-w-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
                  Building RAG systems, LangGraph agents, and data analysis pipelines.
                  Passionate about applied Generative AI and real-world ML.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={() => scrollTo('projects')}
                  className="px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-glow-neon"
                  style={{
                    background: 'linear-gradient(135deg, #38BDF8, #818CF8)',
                    color: '#07091A',
                  }}
                >
                  View Projects ↓
                </button>
                <button
                  onClick={() => {
                    const btn = document.getElementById('chat-open-btn');
                    btn?.click();
                  }}
                  className="px-6 py-3 rounded-full font-semibold text-sm border border-neon/30 text-neon hover:bg-neon/10 transition-all duration-300 hover:scale-105"
                >
                  Chat with my AI ✦
                </button>
              </div>

              {/* Contact pills */}
              <address className="not-italic flex flex-wrap gap-3 text-xs text-moon animate-fade-up" style={{ animationDelay: '0.4s' }}>
                {profile.contact.email && (
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="flex items-center gap-1.5 hover:text-neon transition-colors"
                  >
                    <span aria-hidden="true">✉</span> {profile.contact.email}
                  </a>
                )}
                {profile.contact.linkedinUrl && (
                  <a
                    href={profile.contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn profile"
                    className="flex items-center gap-1.5 hover:text-neon transition-colors"
                  >
                    <span aria-hidden="true">in</span> LinkedIn
                  </a>
                )}
                {profile.contact.githubUrl && (
                  <a
                    href={profile.contact.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub profile"
                    className="flex items-center gap-1.5 hover:text-neon transition-colors"
                  >
                    <span aria-hidden="true">⌥</span> GitHub
                  </a>
                )}
              </address>
            </div>

            {/* Avatar */}
            <div className="flex justify-center lg:justify-end animate-fade-up" style={{ animationDelay: '0.25s' }}>
              <div className="relative group">
                {/* Holographic ambient glow */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 rounded-full opacity-60 group-hover:opacity-90 blur-2xl transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(99,102,241,0.25) 50%, transparent 75%)',
                  }}
                />

                {/* Outer gradient rim */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-1 rounded-full p-[2px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.8), rgba(99,102,241,0.4), rgba(255,255,255,0.6))',
                  }}
                />

                {/* Avatar Frame */}
                <div
                  className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]"
                  style={{
                    border: '3px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 20px 50px rgba(7, 9, 26, 0.6), inset 0 0 20px rgba(6,182,212,0.2)',
                  }}
                >
                  {profile.personal.avatarUrl ? (
                    <Image
                      src={profile.personal.avatarUrl}
                      alt={`${profile.personal.fullName} — 3D character bust`}
                      fill
                      sizes="(max-width: 640px) 224px, 288px"
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-5xl font-display font-bold gradient-text"
                      style={{ background: 'rgba(56,189,248,0.06)' }}
                    >
                      TK
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            ABOUT
        ════════════════════════════════════════════════════════════════════ */}
        <section id="about" aria-label="About me" className="px-6 sm:px-12 py-24">
          <div className="mx-auto max-w-5xl reveal">
            <SectionHeading eyebrow="About" title="Who I am" />
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-5 text-moon leading-relaxed">
                <p className="text-starlight text-lg">
                  I&apos;m an AI/ML engineer passionate about building systems that solve real problems —
                  from RAG pipelines and LangGraph agents to computer vision and data analysis.
                </p>
                <p>
                  Currently interning at <span className="text-neon">TalentSmart Soft Solutions</span> as a Gen AI Intern,
                  I&apos;ve had hands-on experience with LangChain, FastAPI, OpenRouter LLM APIs,
                  and the full data science stack.
                </p>
                <p>
                  My B.Tech in AI &amp; Machine Learning from <span className="text-starlight">BVC Engineering College</span>{' '}
                  gave me a strong foundation, and the practical work at Innomatics Research Labs
                  sharpened it into production-ready skills.
                </p>
              </div>

              {/* Key facts */}
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { label: 'B.Tech CGPA', value: '7.86', sub: 'AI & ML, BVC' },
                  { label: 'Certifications', value: `${profile.certifications.length}`, sub: 'Innomatics, MS, IBM, GUVI' },
                  { label: 'Internships', value: '2', sub: 'Gen AI + Agentic AI' },
                  { label: 'Projects', value: `${profile.projects.length}+`, sub: 'RAG, CV, Data' },
                ].map((fact) => (
                  <div
                    key={fact.label}
                    className="glass-card p-5 text-center"
                  >
                    <dd className="font-display font-bold text-3xl gradient-text">{fact.value}</dd>
                    <dt className="text-sm font-medium text-starlight mt-1">{fact.label}</dt>
                    <p className="text-xs text-moon mt-0.5">{fact.sub}</p>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            EXPERIENCE
        ════════════════════════════════════════════════════════════════════ */}
        <section id="experience" aria-label="Work experience" className="px-6 sm:px-12 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="reveal">
              <SectionHeading eyebrow="Experience" title="Work history" />
            </div>
            <div className="relative">
              {/* Timeline vertical line */}
              <div
                className="timeline-line absolute left-5 top-0 bottom-0 w-px"
                aria-hidden="true"
              />

              <ol className="space-y-10">
                {profile.experience.map((exp, i) => (
                  <li key={`${exp.organization}-${exp.role}`} className="flex gap-6 pl-16 relative reveal">
                    {/* Timeline dot */}
                    <div
                      aria-hidden="true"
                      className="absolute left-[14px] top-1.5 h-3 w-3 rounded-full border-2 border-neon"
                      style={{
                        background: i === 0 ? '#38BDF8' : 'rgba(56,189,248,0.2)',
                        boxShadow: i === 0 ? '0 0 12px rgba(56,189,248,0.6)' : 'none',
                      }}
                    />
                    <article className="glass-card p-5 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-display font-semibold text-starlight">{exp.role}</h3>
                          <p className="text-neon text-sm">{exp.organization}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className="font-mono text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(56,189,248,0.1)',
                              border: '1px solid rgba(56,189,248,0.2)',
                              color: 'var(--color-neon)',
                            }}
                          >
                            {exp.period}
                          </span>
                          {exp.employmentType && (
                            <p className="text-xs text-moon mt-1">{exp.employmentType}</p>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-1.5" aria-label={`${exp.role} highlights`}>
                        {exp.highlights.map((h) => (
                          <li key={h} className="flex gap-2 text-sm text-moon">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-nebula/50" aria-hidden="true" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            PROJECTS
        ════════════════════════════════════════════════════════════════════ */}
        <section id="projects" aria-label="Selected projects" className="px-6 sm:px-12 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="reveal">
              <SectionHeading eyebrow="Projects" title="Selected builds" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profile.projects.map((p, i) => (
                <div key={p.name} className="reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>

            {/* Explore more on GitHub CTA */}
            <div className="mt-12 text-center reveal">
              <a
                href="https://github.com/redditrinadhkumar?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-neon/30 text-neon hover:bg-neon/10 transition-all duration-300 hover:scale-105 font-medium text-sm group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Explore more on GitHub
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SKILLS
        ════════════════════════════════════════════════════════════════════ */}
        <section id="skills" aria-label="Technical skills" className="px-6 sm:px-12 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="reveal">
              <SectionHeading eyebrow="Skills" title="Technical toolkit" />
            </div>
            <div className="reveal">
              <SkillGraph />
            </div>

            {/* Tag cloud / skills index — server-rendered for crawlers */}
            <div className="mt-12 flex flex-wrap gap-2 reveal" aria-label="Full skills list">
              {profile.skills.flatMap((g) => g.items).map((item) => (
                <span
                  key={item}
                  className="font-mono text-xs px-3 py-1 rounded-full transition-colors border border-[var(--color-border)] bg-surface-hi/40 text-moon hover:border-neon/40 hover:text-neon"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            EDUCATION & CERTIFICATIONS
        ════════════════════════════════════════════════════════════════════ */}
        <section id="education" aria-label="Education and certifications" className="px-6 sm:px-12 py-24">
          <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-12">
            {/* Education */}
            <div className="reveal">
              <SectionHeading eyebrow="Education" title="Academic background" />
              <ol className="space-y-4">
                {profile.education.map((e) => (
                  <li key={e.institution} className="glass-card p-5">
                    <p className="font-display font-semibold text-starlight text-sm">{e.institution}</p>
                    <p className="text-neon text-sm mt-0.5">{e.program}</p>
                    {(e.detail || e.period) && (
                      <p className="text-xs text-moon mt-1.5">
                        {[e.detail, e.period].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Certifications */}
            <div className="reveal">
              <SectionHeading eyebrow="Certifications" title="Coursework &amp; credentials" />
              <ol className="space-y-4">
                {profile.certifications.map((c) => (
                  <li key={c.name} className="glass-card p-5">
                    <p className="font-display font-semibold text-starlight text-sm">{c.name}</p>
                    <p className="text-nebula text-sm mt-0.5">{c.issuer}</p>
                    {c.date && <p className="text-xs text-moon mt-1">{c.date}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTACT
        ════════════════════════════════════════════════════════════════════ */}
        <section id="contact" aria-label="Contact" className="px-6 sm:px-12 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="reveal">
              <SectionHeading eyebrow="Contact" title="Let's connect" />
              <p className="text-moon mb-10 max-w-lg">
                Open to internships, collaborations, and full-time AI/ML roles.
                Send a message below or reach out directly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Form */}
              <div className="reveal">
                <ContactForm />
              </div>

              {/* Links */}
              <address className="not-italic space-y-4 reveal">
                {[
                  {
                    label: 'Email',
                    value: profile.contact.email,
                    href: `mailto:${profile.contact.email}`,
                    icon: '✉',
                  },
                  {
                    label: 'LinkedIn',
                    value: 'Trinadh Kumar Reddi',
                    href: profile.contact.linkedinUrl,
                    icon: 'in',
                  },
                  {
                    label: 'GitHub',
                    value: 'redditrinadhkumar',
                    href: profile.contact.githubUrl,
                    icon: '⌥',
                  },
                  {
                    label: 'Phone',
                    value: profile.contact.phone,
                    href: `tel:${profile.contact.phone}`,
                    icon: '☎',
                  },
                ]
                  .filter((l) => l.href)
                  .map((link) => (
                    <a
                      key={link.label}
                      href={link.href!}
                      target={link.href?.startsWith('http') ? '_blank' : undefined}
                      rel={link.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-4 glass-card p-4 group hover:border-neon/30 transition-all duration-200"
                    >
                      <span
                        className="text-lg w-9 h-9 flex items-center justify-center rounded-xl shrink-0 group-hover:scale-110 transition-transform bg-neon/10 border border-neon/20 text-neon"
                        aria-hidden="true"
                      >
                        {link.icon}
                      </span>
                      <div>
                        <p className="text-xs text-moon">{link.label}</p>
                        <p className="text-sm text-starlight group-hover:text-neon transition-colors">{link.value}</p>
                      </div>
                    </a>
                  ))}
              </address>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="px-6 py-8 sm:px-12 text-center border-t border-[var(--color-border)]"
        >
          <div className="mx-auto max-w-5xl space-y-1.5">
            <p className="text-xs text-moon font-medium">
              &copy; {new Date().getFullYear()} {profile.personal.fullName}. All rights reserved.
            </p>
            <p className="text-xs text-moon/50">
              Designed &amp; Developed by {profile.personal.fullName} &middot; Powered by Next.js &amp; AI
            </p>
          </div>
        </footer>
      </main>

      {/* Floating chat widget — globally available on all sections */}
      <ChatWidget />
    </>
  );
}
