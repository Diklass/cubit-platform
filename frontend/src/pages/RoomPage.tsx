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
  text?: string;
  attachmentUrl?: string;
  createdAt: string;
};

let socket: Socket;

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();

  const [messages, setMessages]   = useState<Message[]>([]);
  const [text, setText]           = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState('');

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

    // Новое сообщение
    socket.on('newMessage', msg => {
      setMessages(prev =>
        prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]
      );
    });
    // Отредактированное
    socket.on('messageEdited', updated => {
      setMessages(prev =>
        prev.map(m => (m.id === updated.id ? updated : m))
      );
    });
    // Удалённое
    socket.on('messageDeleted', id => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    // История
    api.get<{ messages: Message[] }>(`/rooms/${code}`)
      .then(r => setMessages(r.data.messages))
      .catch(console.error);

    return () => {
      socket.off('newMessage');
      socket.off('messageEdited');
      socket.off('messageDeleted');
    };
  }, [code]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;

    const form = new FormData();
    form.append('author', user?.email || 'Гость');
    if (text) form.append('text', text);
    if (file) form.append('file', file);

    await api.post<Message>(`/rooms/${code}/messages`, form);
    setText('');
    setFile(null);
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditText(m.text || '');
  };
  const submitEdit = async () => {
    if (!editingId) return;
    const { data: updated } = await api.patch<Message>(
      `/rooms/${code}/messages/${editingId}`,
      { text: editText }
    );
    setEditingId(null);
    setEditText('');
    // Мы раздадим через WS, но сразу обновим локально:
    setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    socket.emit('editMessage', {
      roomCode: code,
      messageId: updated.id,
      text: updated.text
    });
  };
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

  const renderAttachment = (attachmentUrl: string) => {
    const rawName = attachmentUrl.split('/').pop()!;
    const encoded = encodeURIComponent(rawName);
    const url = `http://localhost:3001/rooms/files/${encoded}`;
    const displayName = rawName.includes('-')
      ? rawName.slice(rawName.indexOf('-') + 1)
      : rawName;
    const ext = displayName.split('.').pop()!.toLowerCase();
    const imgExts = ['png','jpg','jpeg','gif','webp'];

    if (imgExts.includes(ext)) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img src={url} alt={displayName} className="max-h-48 rounded border" />
        </a>
      );
    } else {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer"
           className="flex items-center space-x-2 mt-2 text-blue-600 hover:underline">
          <span>📄</span>
          <span>{displayName}</span>
        </a>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isCreator && (
        <div className="bg-gray-100 px-4 py-2 border-b">
          Код комнаты: <code className="font-mono">{code}</code>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className="relative bg-white p-3 rounded shadow-sm">
            <div className="text-xs text-gray-500 mb-1">
              {m.author || 'Гость'} — {new Date(m.createdAt).toLocaleString()}
            </div>

            {editingId === m.id ? (
              <>
                <ReactQuill
                  theme="snow"
                  value={editText}
                  onChange={setEditText}
                  modules={quillModules}
                  className="h-32 mb-12"
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
              </>
            ) : (
              <>
                {m.text && (
                  <div
                    className="prose prose-headings:prose-h1:text-3xl"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }}
                  />
                )}
                {m.attachmentUrl && renderAttachment(m.attachmentUrl)}

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
        <div className="bg-white border-t p-4">
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
