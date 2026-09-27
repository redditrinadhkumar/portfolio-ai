'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedQuestions } from './SuggestedQuestions';
import type { ChatMessage } from './types';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  errorBanner: string | null;
  onSend: (text: string) => void;
  onReset: () => void;
  onClose: () => void;
}

const MAX_INPUT_LEN = 1200;

// Selectors for all focusable elements within the panel
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function ChatPanel({ messages, isLoading, errorBanner, onSend, onReset, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // Escape to close + focus trap
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: keep Tab/Shift+Tab cycling within the panel
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    // Move focus into panel on open
    textareaRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  }

  return (
    <div
      ref={panelRef}
      id="portfolio-chat-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio AI assistant — answers questions about Trinadh's profile only"
      className={[
        // Mobile: full-screen sheet from bottom
        'fixed bottom-0 right-0 z-50 flex flex-col overflow-hidden',
        'w-full rounded-t-2xl',
        // Tablet/desktop: floating panel
        'sm:bottom-28 sm:right-8 sm:h-[min(600px,75vh)] sm:w-[min(400px,92vw)] sm:rounded-2xl',
        'shadow-2xl animate-panel-in',
      ].join(' ')}
      style={{
        // Mobile height: fill most of screen with safe-area awareness
        height: 'min(92dvh, 640px)',
        background: 'var(--color-surface)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--color-border-hi)',
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Live status dot */}
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-neon opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
          </span>
          <div>
            <p className="font-display font-semibold text-sm text-starlight leading-tight">
              Portfolio Assistant
            </p>
            <p className="text-[10px] font-mono text-moon/70 leading-tight">
              ~ grounded in resume data only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full px-2 py-1 text-xs text-moon hover:bg-surface-hi hover:text-neon transition-colors"
            aria-label="Reset conversation"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-moon hover:bg-surface-hi hover:text-starlight transition-colors"
            aria-label="Close chat panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Conversation messages"
      >
        {messages.length === 0 && (
          <div className="space-y-4">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed"
              style={{
                background: 'rgba(56,189,248,0.08)',
                border: '1px solid rgba(56,189,248,0.2)',
                color: 'var(--color-starlight)',
              }}
            >
              <p className="font-mono text-[10px] text-neon mb-1.5">$ query received</p>
              <p>
                I&apos;m Trinadh&apos;s portfolio assistant. Ask me about his education, experience,
                skills, projects, or how to get in touch — I answer from his approved profile only.
              </p>
            </div>
            <SuggestedQuestions onSelect={onSend} />
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {isLoading && <TypingIndicator />}
      </div>

      {errorBanner && (
        <div
          role="alert"
          className="px-4 py-2 text-xs border-t shrink-0"
          style={{
            borderColor: 'rgba(179,67,43,0.3)',
            background: 'rgba(179,67,43,0.08)',
            color: '#F87171',
          }}
        >
          {errorBanner}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-3 border-t shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask about the portfolio
        </label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LEN))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          placeholder="Ask about experience, skills, projects…"
          className="flex-1 resize-none rounded-xl px-3 py-2 text-sm placeholder:text-moon/60 focus:outline-none transition-colors border border-[var(--color-border)] bg-surface-hi"
          style={{
            maxHeight: '96px',
            color: '#0f172a',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-30 transition-all duration-200 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, var(--color-neon), var(--color-nebula))' }}
          aria-label="Send message"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 12h16M14 6l6 6-6 6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
