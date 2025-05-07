// frontend/src/pages/RoomPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';

type Message = {
  id: string;
  author: string | null;
  text?: string;
  attachmentUrl?: string;
  createdAt: string;
};

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();              // получаем роль
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    api.get<{ messages: Message[] }>(`/rooms/${code}`)
      .then(res => setMessages(res.data.messages));

    const socket = io('/rooms');
    socketRef.current = socket;
    socket.emit('join', code);
    socket.on('newMessage', msg => setMessages(prev => [...prev, msg]));

    return () => {
      socket.disconnect();
    };
  }, [code]);

  // если студент — не показываем форму
  const canPost = user?.role !== 'STUDENT';

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;

    const form = new FormData();
    form.append('author', user?.email || 'Гость');
    form.append('text', text);
    if (file) form.append('file', file);

    await api.post(`/rooms/${code}/messages`, form);
    socketRef.current?.emit('message', { roomCode: code, author: user?.email, text });
    setText('');
    setFile(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm text-gray-500 mb-1">
              {m.author ?? 'Гость'}, {new Date(m.createdAt).toLocaleTimeString()}
            </div>
            {m.text && <div className="mb-2">{m.text}</div>}
            {m.attachmentUrl && (
              <a
                href={`http://localhost:3001${m.attachmentUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                📎 Скачать файл
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Форма только если не студент */}
      {canPost && (
        <form
          onSubmit={send}
          className="p-4 bg-white border-t flex items-center space-x-2"
        >
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Сообщение"
            className="flex-1 border rounded px-3 py-2"
          />
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="border rounded px-2 py-1"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Отправить
          </button>
        </form>
      )}
    </div>
  );
}
