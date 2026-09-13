'use client';

import { useCallback, useRef, useState } from 'react';
import type { ChatApiErrorBody, ChatApiSuccessBody, ChatMessage } from './types';

const MAX_HISTORY_SENT = 12;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * NOTE ON MEMORY: this hook keeps the conversation only in React state, for
 * the lifetime of the browser tab. Nothing is written to localStorage,
 * cookies, or any server-side store — closing or reloading the tab clears
 * it. The server itself is stateless per request (see `chatHandler.ts`);
 * history is only ever what the client explicitly re-sends with each turn.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setErrorBanner(null);
      const userMessage: ChatMessage = { id: makeId(), role: 'user', content: trimmed, status: 'sent' };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const historyToSend = messages.slice(-MAX_HISTORY_SENT).map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history: historyToSend }),
          signal: controller.signal,
        });

        const body = (await res.json()) as ChatApiSuccessBody | ChatApiErrorBody;

        if (!res.ok || 'error' in body) {
          const message = 'error' in body ? body.error.message : 'Something went wrong. Please try again.';
          setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: message, status: 'error' }]);
        } else {
          setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: body.reply, status: 'sent' }]);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setErrorBanner("Couldn't reach the assistant. Check your connection and try again.");
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, isLoading],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setErrorBanner(null);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, errorBanner, sendMessage, reset };
}
