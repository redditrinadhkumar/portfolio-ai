import { SafeMarkdown } from './SafeMarkdown';
import type { ChatMessage } from './types';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2',
          message.status === 'error' ? 'border border-red-500/30' : '',
        ].join(' ')}
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(129,140,248,0.18))',
                border: '1px solid var(--color-border-hi)',
                borderBottomRightRadius: '4px',
                color: 'var(--color-starlight)',
              }
            : {
                background: 'var(--color-surface-hi)',
                border: '1px solid var(--color-border)',
                borderBottomLeftRadius: '4px',
                color: 'var(--color-starlight)',
              }
        }
      >
        <SafeMarkdown text={message.content} />
      </div>
    </div>
  );
}
