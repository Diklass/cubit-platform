// src/hooks/useRoomSocket.ts
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

/**
 * Хук для подписки на WS-события комнаты:
 * ‒ newMessage
 * ‒ messageEdited
 * ‒ messageDeleted
 */
export function useRoomSocket({ code, onError }: UseRoomSocketOptions) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // подключаемся и вешаем обработчики
  useEffect(() => {
    const socket = io('http://localhost:3001/rooms', { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('join', code);

    socket.on('newMessage', (msg: RoomMessage) => {
    setMessages(prev =>
        prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]
    );
    });
    socket.on('messageEdited', (upd: RoomMessage) => {
      setMessages(prev => prev.map(m => m.id === upd.id ? upd : m));
    });
    socket.on('messageDeleted', (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });
    socket.on('connect_error', onError ?? (() => {}));

    return () => {
      socket.disconnect();
    };
  }, [code, onError]);

  return { messages, setMessages, socket: socketRef.current! };
}
