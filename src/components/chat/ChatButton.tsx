'use client';

import { EmbedSpaceIcon } from './EmbedSpaceIcon';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatButton({ isOpen, onClick }: ChatButtonProps) {
  return (
    <button
      type="button"
      id="chat-open-btn"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls="portfolio-chat-panel"
      aria-label={isOpen ? 'Close portfolio assistant' : 'Open portfolio assistant'}
      className={[
        'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full',
        'shadow-glow-neon transition-all duration-300',
        'hover:scale-110 active:scale-95',
        'sm:bottom-8 sm:right-8',
        isOpen
          ? 'bg-surface border border-white/10'
          : 'border border-neon/30',
      ].join(' ')}
      style={
        isOpen
          ? undefined
          : {
              background: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(129,140,248,0.15) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }
      }
    >
      {isOpen ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <EmbedSpaceIcon size={36} />
      )}
    </button>
  );
}
