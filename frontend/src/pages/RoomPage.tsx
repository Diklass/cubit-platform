// src/pages/RoomPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams }      from 'react-router-dom';
import api                from '../api';
import { io, Socket }     from 'socket.io-client';
import { useAuth }        from '../auth/AuthContext';
import ReactQuill         from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify          from 'dompurify';

type Message = {
  id: string;
  author: string | null;
  text: string;           // HTML
  attachmentUrl?: string;
  createdAt: string;
};

let socket: Socket;

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();

  const [messages, setMessages]     = useState<Message[]>([]);
  const [text, setText]             = useState('');
  const [file, setFile]             = useState<File | null>(null);

  // Для inline-редактирования:
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editText, setEditText]     = useState('');

  const isCreator = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const canPost   = user?.role !== 'STUDENT';

  useEffect(() => {
    if (!socket) {
      socket = io('http://localhost:3001/rooms', {
        transports: ['websocket'],
        autoConnect: false,
      });
    }
    socket.connect();
    socket.emit('join', code);

    socket.on('newMessage', msg => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('messageEdited', updated => {
      setMessages(prev =>
        prev.map(m => (m.id === updated.id ? updated : m))
      );
    });
    socket.on('messageDeleted', (messageId: string) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    api.get<{ messages: Message[] }>(`/rooms/${code}`)
      .then(res => setMessages(res.data.messages))
      .catch(console.error);

    return () => {
      socket.off('newMessage');
      socket.off('messageEdited');
      socket.off('messageDeleted');
    };
  }, [code]);

  // Отправка нового сообщения
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost || !text.trim()) return;

    const form = new FormData();
    form.append('author', user?.email || 'Гость');
    form.append('text', text);
    if (file) form.append('file', file);

    const { data: msg } = await api.post<Message>(
      `/rooms/${code}/messages`,
      form
    );
    setMessages(prev => [...prev, msg]);
    socket.emit('message', { roomCode: code, author: user?.email, text });
    setText('');
    setFile(null);
  };

  // Начать редактировать
  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditText(m.text);
  };

  // Сохранить отредактированное
  const submitEdit = async () => {
    if (!editingId) return;
    const { data: updated } = await api.patch<Message>(
      `/rooms/${code}/messages/${editingId}`,
      { text: editText }
    );
    // заменяем только нужное сообщение, на том же месте
    setMessages(prev =>
      prev.map(m => (m.id === updated.id ? updated : m))
    );
    socket.emit('editMessage', {
      roomCode: code,
      messageId: updated.id,
      text: editText,
    });
    setEditingId(null);
    setEditText('');
  };

  // Удалить сообщение
  const onDelete = async (id: string) => {
    await api.delete(`/rooms/${code}/messages/${id}`);
    setMessages(prev => prev.filter(m => m.id !== id));
    socket.emit('deleteMessage', { roomCode: code, messageId: id });
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className="relative bg-white p-3 rounded shadow-sm">
            <div className="text-xs text-gray-500 mb-1">
              {m.author ?? 'Гость'} —{' '}
              {new Date(m.createdAt).toLocaleString()}
            </div>

            {editingId === m.id ? (
              <div className="mb-4">
                <ReactQuill
                  theme="snow"
                  value={editText}
                  onChange={setEditText}
                  modules={quillModules}
                  className="h-32"
                />
                <div className="flex space-x-2 mt-12">
                  <button
                    onClick={submitEdit}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="prose prose-headings:prose-h1:text-3xl"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(m.text),
                  }}
                />
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

                {isCreator && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => startEdit(m)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(m.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {canPost && (
        <div className="flex-none bg-white border-t p-4">
          <form onSubmit={send} className="flex flex-col">
            <ReactQuill
              theme="snow"
              value={text}
              onChange={setText}
              modules={quillModules}
              placeholder="Введите сообщение..."
              className="h-40 mb-12"
            />
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
