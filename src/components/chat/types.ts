export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'error' | 'sent';
}

export interface ChatApiSuccessBody {
  reply: string;
  usedFallback: boolean;
}

export interface ChatApiErrorBody {
  error: { code: string; message: string };
}
