// frontend/src/hooks/useChatSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type ChatAttachment = { id: string; url: string };
export type ChatAuthor = { id: string; email?: string };
export type ChatMessage = {
  id: string;
  text?: string;
  createdAt: string;
  updatedAt?: string;
  author?: ChatAuthor;
  attachments?: ChatAttachment[];
  readBy?: string[];
  isTemp?: boolean;
};

type UseChatSocketReturn = {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  socket: Socket;
  typing: boolean;
  emitTyping: () => void;
  emitStopTyping: () => void;
  emitRead: (ids: string[]) => void;
};

export function useChatSocket(
  sessionId: string,
  onError?: (e: unknown) => void
): UseChatSocketReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // базовый URL API, убираем возможный /api на конце
    const API_BASE =
      (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    const WS_BASE = String(API_BASE).replace(/\/api\/?$/i, '');

    // закрыть предыдущий сокет
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    // подключение в namespace /chats/:sessionId
    const s = io(`${WS_BASE}/chats/${sessionId}`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = s;

    s.on('connect', () => {
      // вступаем в комнату с именем sessionId
      s.emit('joinSession', sessionId);
    });

    // новые сообщения: поддерживаем ОДНОВРЕМЕННО два имени событий
    const onCreated = (msg: ChatMessage) => {
    setMessages(prev => {
      const map = new Map(prev.map(m => [m.id, m]));
      map.set(msg.id, msg);
      return Array.from(map.values());
    });
  };
    s.on('chatMessage', onCreated);
    s.on('messageCreated', onCreated);

    // редактирование/удаление
    s.on('chatEdited', (updated: ChatMessage) => {
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    });
    s.on('chatDeleted', (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    // индикатор печати (если добавишь на бэке)
    s.on('typing', () => setTyping(true));
    s.on('stopTyping', () => setTyping(false));

    s.on('connect_error', err => onError?.(err));

    return () => {
      try {
        s.removeAllListeners();
        s.disconnect();
      } catch {}
    };
  }, [sessionId, onError]);

  // публичные эмиттеры
  const emitTyping = () => socketRef.current?.emit('typing', { sessionId });
  const emitStopTyping = () => socketRef.current?.emit('stopTyping', { sessionId });
  const emitRead = (ids: string[]) => socketRef.current?.emit('read', { sessionId, ids });

  // отдаем non-null (к моменту нажатия "Отправить" сокет уже установлен)
  return {
    messages,
    setMessages,
    socket: socketRef.current as Socket,
    typing,
    emitTyping,
    emitStopTyping,
    emitRead,
  };
}
