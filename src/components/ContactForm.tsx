'use client';

import { useState, useRef, useCallback } from 'react';
import emailjs from '@emailjs/browser';

/**
 * CONTACT FORM — EmailJS CLIENT-SIDE INTEGRATION
 * ------------------------------------------------
 * Sends directly from the browser using EmailJS's browser SDK.
 *
 * ENVIRONMENT VARIABLES (NEXT_PUBLIC_ prefix is intentional — these are
 * not secret server-side keys; EmailJS's model requires the public key to
 * be present in the client bundle, similar to a Google Maps API key.
 * They carry no meaningful risk of abuse beyond rate limits on your
 * EmailJS free-tier dashboard):
 *   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY     — EmailJS "Public Key" from Account Settings
 *   NEXT_PUBLIC_EMAILJS_SERVICE_ID     — EmailJS Service ID (e.g. "service_xxxx")
 *   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID    — EmailJS Template ID (e.g. "template_xxxx")
 *
 * Security measures:
 *   - Honeypot field: `website` field (hidden, auto-filled by bots) checked before send
 *   - Client-side validation: name, valid email, non-empty message
 *   - Submission rate limiting: 60s cooldown prevents rapid re-sends
 *   - Does NOT route through /api/chat or the AI pipeline — completely separate
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? '';
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? '';
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? '';
const COOLDOWN_MS = 60_000;

const isConfigured = Boolean(
  PUBLIC_KEY &&
  SERVICE_ID &&
  TEMPLATE_ID &&
  !PUBLIC_KEY.includes('your_emailjs') &&
  !SERVICE_ID.includes('service_xxxxxxx') &&
  !TEMPLATE_ID.includes('template_xxxxxxx')
);

type FormState = 'idle' | 'loading' | 'success' | 'error' | 'preview_unconfigured';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [honeypot, setHoneypot] = useState('');
  const lastSentRef = useRef<number>(0);

  const validate = useCallback(
    (data: FormData): boolean => {
      const errs: typeof errors = {};
      if (!String(data.get('name') ?? '').trim()) errs.name = 'Name is required.';
      const email = String(data.get('email') ?? '').trim();
      if (!email) errs.email = 'Email is required.';
      else if (!validateEmail(email)) errs.email = 'Please enter a valid email address.';
      if (!String(data.get('message') ?? '').trim()) errs.message = 'Message is required.';
      setErrors(errs);
      return Object.keys(errs).length === 0;
    },
    [],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot check
    if (honeypot) return;

    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    if (!validate(data)) return;

    if (!isConfigured) {
      setState('preview_unconfigured');
      return;
    }

    // Client-side rate limit (60s cooldown)
    const now = Date.now();
    if (now - lastSentRef.current < COOLDOWN_MS) {
      setState('error');
      return;
    }

    setState('loading');
    try {
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, { publicKey: PUBLIC_KEY });
      lastSentRef.current = Date.now();
      setState('success');
      form.reset();
    } catch (err) {
      console.error('EmailJS transmission error:', err);
      setState('error');
    }
  }

  function resetState() {
    if (state === 'success' || state === 'error' || state === 'preview_unconfigured') setState('idle');
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="glass-card p-8 space-y-5 relative overflow-hidden"
      aria-label="Contact form"
    >
      {!isConfigured && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neon/10 border border-neon/20 text-xs text-moon">
          <span className="text-neon text-sm font-bold">ℹ</span>
          <span>
            <strong>EmailJS Ready:</strong> Add your credentials in <code className="text-neon">.env</code> to activate live inbox delivery.
          </span>
        </div>
      )}
      {/* Honeypot — hidden from real users, bots fill it */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
        autoComplete="off"
      />

      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-starlight mb-1.5">
          Name <span aria-hidden="true" className="text-neon">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          onChange={resetState}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          aria-invalid={!!errors.name}
          className="w-full bg-surface-hi/60 border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-starlight placeholder:text-moon/60 focus:border-neon focus:outline-none transition-colors"
          placeholder="Your name"
        />
        {errors.name && (
          <p id="contact-name-error" role="alert" className="mt-1 text-xs text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-starlight mb-1.5">
          Email <span aria-hidden="true" className="text-neon">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          onChange={resetState}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          aria-invalid={!!errors.email}
          className="w-full bg-surface-hi/60 border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-starlight placeholder:text-moon/60 focus:border-neon focus:outline-none transition-colors"
          placeholder="your.email@example.com"
        />
        {errors.email && (
          <p id="contact-email-error" role="alert" className="mt-1 text-xs text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-starlight mb-1.5">
          Message <span aria-hidden="true" className="text-neon">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          onChange={resetState}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          aria-invalid={!!errors.message}
          className="w-full bg-surface-hi/60 border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-starlight placeholder:text-moon/60 focus:border-neon focus:outline-none transition-colors resize-none"
          placeholder="What would you like to talk about?"
        />
        {errors.message && (
          <p id="contact-message-error" role="alert" className="mt-1 text-xs text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={state === 'loading' || state === 'success'}
        className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.01]"
        style={{
          background: 'linear-gradient(135deg, var(--color-neon), var(--color-nebula))',
        }}
      >
        {state === 'loading' ? 'Sending…' : state === 'success' ? '✓ Sent!' : 'Send Message'}
      </button>

      {/* Status */}
      {state === 'preview_unconfigured' && (
        <div role="status" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-1">
          <p className="font-semibold">Interactive Preview Mode</p>
          <p className="text-amber-200/80">Add your EmailJS Public Key, Service ID, & Template ID in <code className="text-white">.env</code> to activate live transmission.</p>
        </div>
      )}
      {state === 'success' && (
        <p role="status" className="text-center text-sm text-green-400">
          Message sent! I&apos;ll get back to you soon.
        </p>
      )}
      {state === 'error' && (
        <p role="alert" className="text-center text-sm text-red-400">
          Something went wrong. Please try emailing me directly or wait a moment.
        </p>
      )}
    </form>
  );
}
