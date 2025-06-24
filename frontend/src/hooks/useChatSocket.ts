// src/hooks/useChatSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type ChatMessage = {
  id: string;
  text?: string;
  author?: { id: string; email: string };
  attachments?: { id: string; url: string }[];
  createdAt: string;
  isTemp?: boolean;

  updatedAt?: string;         
  readBy?: string[];  
};

interface UseChatSocketOptions {
  sessionId: string;
  onError?: (err: any) => void;
}

export function useChatSocket(sessionId: string, onError?: (err:any)=>void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const sock = io(`http://localhost:3001/chats/${sessionId}`, { transports: ['websocket'] });
    socketRef.current = sock;
    sock.emit('joinSession', sessionId);

    sock.on('chatMessage', msg => {
    setMessages(prev => [
        ...prev.filter(m => !m.isTemp),
        { ...msg, updatedAt: msg.createdAt, readBy: msg.readBy ?? [] },
    ]);
    });

    sock.on('chatEdited', upd => {
    setMessages(prev =>
        prev.map(m =>
        m.id === upd.id
            ? { ...upd, updatedAt: new Date().toISOString(), readBy: upd.readBy ?? m.readBy! }
            : m
        )
    );
    });

    sock.on('chatDeleted', id => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    sock.on('typing', () => setTyping(true));
    sock.on('stopTyping', () => setTyping(false));

    sock.on('messageRead', ({ messageId, userId }) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, readBy: Array.from(new Set([...(m.readBy||[]), userId])) }
            : m
        )
      );
    });

    sock.on('connect_error', onError || (() => {}));
    return () => { sock.disconnect(); };
  }, [sessionId]);

  const emitTyping     = () => socketRef.current?.emit('typing',     { sessionId });
  const emitStopTyping = () => socketRef.current?.emit('stopTyping', { sessionId });
  const emitRead       = (ids: string[]) => socketRef.current?.emit('read', { sessionId, messageIds: ids });

  return {
    messages,
    setMessages,
    socket: socketRef.current!,
    typing,
    emitTyping,
    emitStopTyping,
    emitRead,
  };
}

