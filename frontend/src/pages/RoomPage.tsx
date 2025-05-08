// src/pages/RoomPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

type Message = {
  id: string;
  author: string | null;
  text?: string;
  attachmentUrl?: string;
  createdAt: string;
};

let socket: Socket;

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const isCreator = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const canPost = user?.role !== 'STUDENT';

  useEffect(() => {
    if (!socket) {
      socket = io('http://localhost:3001/rooms', {
        transports: ['websocket'],
        autoConnect: false,
      });
    }
    socket.connect();
    socket.emit('join', code);

    const handleNew = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on('newMessage', handleNew);

    api.get<{ messages: Message[] }>(`/rooms/${code}`)
      .then(res => setMessages(res.data.messages))
      .catch(console.error);

    return () => {
      socket.off('newMessage', handleNew);
    };
  }, [code]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost || !text.trim()) return;

    const form = new FormData();
    form.append('author', user?.email || 'Гость');
    form.append('text', text);
    if (file) form.append('file', file);

    const { data: msg } = await api.post<Message>(`/rooms/${code}/messages`, form);
    setMessages(prev => [...prev, msg]);
    socket.emit('message', { roomCode: code, author: user?.email, text });

    setText('');
    setFile(null);
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'code-block'],
      ['clean'],
    ],
  };

  return (
    <div className="flex flex-col h-full">
      {isCreator && (
        <div className="bg-gray-100 text-gray-800 px-4 py-2 border-b">
          <span className="font-medium">Код комнаты:</span>{' '}
          <code className="font-mono">{code}</code>
        </div>
      )}

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className="bg-white p-3 rounded shadow-sm">
            <div className="text-xs text-gray-500 mb-1">
              {m.author ?? 'Гость'} — {new Date(m.createdAt).toLocaleString()}
            </div>
            {m.text && (
              <div
                className="prose prose-headings:prose-h1:text-3xl"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }}
              />
            )}
            {m.attachmentUrl && (
              <a
                href={`http://localhost:3001${m.attachmentUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Скачать файл
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Форма отправки */}
      {canPost && (
        <div className="flex-none bg-white border-t p-4">
          <form onSubmit={send} className="flex flex-col">
            {/* Редактор с отступом снизу */}
            <ReactQuill
              theme="snow"
              value={text}
              onChange={setText}
              modules={quillModules}
              placeholder="Введите сообщение..."
              className="h-40 mb-12"
            />
            {/* Контролы под редактором */}
            <div className="flex items-center space-x-2">
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
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
