import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../api';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../auth/AuthContext';

type Message = {
  id: string;
  text?: string;
  author?: { id: string; email: string };
  attachmentUrl?: string;
  createdAt: string;
};

let socket: Socket;

export function ChatWindow({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Подгружаем историю сообщений
      api.get<Message[]>(`/chats/${sessionId}/messages`)
        .then(res => {
          setMessages(res.data); // сообщения уже отсортированы в сервисе
        })
        .catch(err => {
          console.error('Ошибка при получении сообщений:', err);
          setMessages([]);
        });

    // Подключаемся к WS
    socket = io(`http://localhost:3001/chats/${sessionId}`, {
      transports: ['websocket'],
    });

    socket.emit('joinSession', sessionId);

    socket.on('chatMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('chatEdited', (msg: Message) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    });

    socket.on('chatDeleted', (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !file) return;

    if (file) {
      const form = new FormData();
      form.append('text', text);
      form.append('file', file);
      await api.post(`/chats/${sessionId}/messages`, form);
      setFile(null);
    } else {
      socket.emit('chatMessage', {
        sessionId,
        text,
        authorId: user?.id,
      });
    }

    setText('');
  };

  const quillModules = {
    toolbar: [['bold', 'italic'], ['link'], ['clean']],
  };

  const renderAttachment = (url: string) => {
    const name = decodeURIComponent(url.split('-').slice(1).join('-'));
    const ext = name.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
    const fullUrl = `http://localhost:3001/rooms/files/${url}`;

    return isImage ? (
      <a href={fullUrl} target="_blank" rel="noreferrer">
        <img src={fullUrl} alt={name} className="max-h-48 mt-2 rounded border" />
      </a>
    ) : (
      <a href={fullUrl} download className="text-blue-600 mt-2 block hover:underline">
        📄 {name}
      </a>
    );
  };

 useEffect(() => {
  console.log('Session ID:', sessionId);
}, [sessionId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm text-gray-500 mb-1">
              {m.author?.email ?? 'Гость'} — {new Date(m.createdAt).toLocaleString()}
            </div>
            {m.text && (
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }}
              />
            )}
            {m.attachmentUrl && renderAttachment(m.attachmentUrl)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="bg-white border-t p-4 flex items-center space-x-2">
        <ReactQuill
          theme="snow"
          value={text}
          onChange={setText}
          modules={quillModules}
          className="flex-1 h-24"
          placeholder="Введите сообщение..."
        />
        <input
          type="file"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="border rounded px-2 py-1"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
