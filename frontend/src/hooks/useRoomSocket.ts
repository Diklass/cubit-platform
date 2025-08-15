// frontend/src/hooks/useRoomSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type RoomMessage = {
  id: string;
  text?: string;
  author?: { id: string; email: string };
  attachments?: { id: string; url: string }[];
  createdAt: string;
};

interface UseRoomSocketOptions {
  code: string;
  onError?: (err: any) => void;
}

export function useRoomSocket({ code, onError }: UseRoomSocketOptions) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Базовый URL из ENV, без /api в конце
    const API_BASE =
      (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    const WS_BASE = API_BASE.replace(/\/api\/?$/i, '');

    // Закрываем предыдущий сокет перед новым подключением
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    // ВАЖНО: включаем и polling как fallback, и withCredentials
    const socket = io(`${WS_BASE}/rooms`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', code);
    });

    socket.on('newMessage', (msg: RoomMessage) => {
      setMessages(prev =>
        prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]
      );
    });

    socket.on('messageEdited', (upd: RoomMessage) => {
      setMessages(prev => prev.map(m => (m.id === upd.id ? upd : m)));
    });

    socket.on('messageDeleted', (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    socket.on('connect_error', onError ?? (() => {}));

    return () => {
      try {
        socket.removeAllListeners();
        socket.disconnect();
      } catch {}
    };
  }, [code, onError]);

  // Не делаем non-null assertion, отдаём null до инициализации
  return { messages, setMessages, socket: socketRef.current as Socket | null };
}
