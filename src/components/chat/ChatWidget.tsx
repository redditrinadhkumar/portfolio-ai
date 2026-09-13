'use client';

import { useState } from 'react';
import { ChatButton } from './ChatButton';
import { ChatPanel } from './ChatPanel';
import { useChat } from './useChat';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, errorBanner, sendMessage, reset } = useChat();

  return (
    <>
      <ChatButton isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
      {isOpen && (
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          errorBanner={errorBanner}
          onSend={sendMessage}
          onReset={reset}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
