import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import copy from 'copy-to-clipboard';
import { ChatWindow } from '../components/chat/ChatWindow';

type Message = {
  id: string;
  author: string | null;
  text?: string;
  attachmentUrl?: string;
  createdAt: string;
};

type ChatSession = {
  id: string;
  student?: { email: string };
};

let socket: Socket;

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showCodeBig, setShowCodeBig] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

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

    socket.on('newMessage', msg => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]);
    });
    socket.on('messageEdited', updated => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
    });
    socket.on('messageDeleted', id => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    api.get<{ messages: Message[] }>(`/rooms/${code}`)
      .then(r => setMessages(r.data.messages))
      .catch(console.error);

    return () => {
      socket.off('newMessage');
      socket.off('messageEdited');
      socket.off('messageDeleted');
    };
  }, [code]);

  useEffect(() => {
    if (!showChat || !code || !user) return;

    api.get(`/rooms/${code}/chats`)
      .then(res => {
        if (isTeacher) {
          setChatSessions(res.data);
        } else if (isStudent) {
          setChatSessionId(res.data.id);
        }
      })
      .catch(console.error);
  }, [showChat, code, user]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost || (!text && !file)) return;

    const form = new FormData();
    form.append('authorId', user?.id || '');
    if (text) form.append('text', text);
    if (file) form.append('file', file);

    await api.post(`/rooms/${code}/messages`, form);
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
    setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
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

  const renderAttachment = (path: string) => {
    const rawName = path.split('/').pop()!;
    const displayName = decodeURIComponent(rawName.substring(rawName.indexOf('-') + 1));
    const url = encodeURI(`http://localhost:3001/rooms/files/${rawName}`);
    const ext = displayName.split('.').pop()!.toLowerCase();
    const imgExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

    if (imgExts.includes(ext)) {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block mt-2">
          <img src={url} alt={displayName} className="max-h-48 rounded border" />
        </a>
      );
    }
    return (
      <a href={url} download={displayName}
         className="flex items-center space-x-1 mt-2 text-blue-600 hover:underline">
        <span>📄</span><span>{displayName}</span>
      </a>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b">
        <div className="flex items-center space-x-3">
          <button onClick={() => copy(code!)} title="Копировать код">📋</button>
          {isTeacher && <button title="Редактировать комнату">✏️</button>}
          <span>📎 Код комнаты: <code className="font-mono">{code}</code></span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowCodeBig(v => !v)} title="Показать код">⛶</button>
          <button onClick={() => setShowChat(v => !v)} title="Чат">💬</button>
          {isTeacher && <button title="Настройки">⚙</button>}
        </div>
      </header>

      {/* Полноэкранный код */}
      {showCodeBig && (
        <div className="fixed inset-0 bg-white p-8 z-50 overflow-auto">
          <button onClick={() => setShowCodeBig(false)}
                  className="absolute top-4 right-4 text-2xl">✕</button>
          <h2 className="text-xl mb-4">Код комнаты</h2>
          <pre className="p-4 bg-gray-200 rounded">{code}</pre>
        </div>
      )}

      {/* Контент */}
      <div className="flex-1 flex overflow-hidden">
        {showChat ? (
          <div className="flex-1 flex">
            {isTeacher && (
              <div className="w-1/3 border-r overflow-y-auto p-4 space-y-2">
                <h2 className="text-lg font-semibold mb-2">Ученики</h2>
                {chatSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => setChatSessionId(session.id)}
                    className={`cursor-pointer p-2 rounded border hover:bg-gray-100 ${
                      session.id === chatSessionId ? 'bg-gray-200' : ''
                    }`}
                  >
                    {session.student?.email || 'Ученик'}
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1">
              {chatSessionId ? (
                <ChatWindow sessionId={chatSessionId} />
              ) : (
                <div className="p-4 text-gray-500">
                  {isTeacher ? 'Выберите ученика слева' : 'Загрузка чата...'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
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
                          className="prose"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }}
                        />
                      )}
                      {m.attachmentUrl && renderAttachment(m.attachmentUrl)}
                      {isTeacher && (
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
              <form onSubmit={send} className="bg-white border-t p-4 flex items-center space-x-2">
                <ReactQuill
                  theme="snow"
                  value={text}
                  onChange={setText}
                  modules={quillModules}
                  placeholder="Сообщение..."
                  className="flex-1 h-24"
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
