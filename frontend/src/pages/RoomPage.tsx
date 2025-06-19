import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import copy from 'copy-to-clipboard';
import { ChatWindow } from '../components/chat/ChatWindow';

interface Message {
  id: string;
  author: string | null;
  text?: string;
  attachmentUrl?: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  student?: { email: string };
}

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  // — Материалы комнаты —
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // — Чат —
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // — UI —
  const [showChat, setShowChat] = useState(false);
  const [showCodeBig, setShowCodeBig] = useState(false);

  // 1) Получить или создать session для ученика
  useEffect(() => {
    if (isStudent && code) {
      api.get<{ id: string }>(`/rooms/${code}/chats`)
        .then(r => setChatSessionId(r.data.id))
        .catch(console.error);
    }
  }, [isStudent, code]);

  // 2) Подгрузить список сессий для учителя
  useEffect(() => {
    if (isTeacher && showChat) {
      // <<< ИСПРАВЛЕНО: правильный эндпоинт — /rooms/:code/chats
      api.get<ChatSession[]>(`/rooms/${code}/chats`)
        .then(r => setChatSessions(r.data))
        .catch(console.error);
    }
  }, [isTeacher, showChat, code]);

  // 3) WS-уведомления для ученика
  useEffect(() => {
    if (chatSessionId) {
      const sock = io(`http://localhost:3001/chats/${chatSessionId}`, { transports: ['websocket'] });
      sock.emit('joinSession', chatSessionId);
      sock.on('chatMessage', () => {
        setUnreadCounts(prev => ({
          ...prev,
          [chatSessionId]: (prev[chatSessionId] || 0) + 1,
        }));
      });
      return () => { sock.disconnect(); };
    }
  }, [chatSessionId]);

  // 4) WS-уведомления для учителя по всем сессиям
  useEffect(() => {
    if (isTeacher) {
      const socks: Socket[] = chatSessions.map(s => {
        const sock = io(`http://localhost:3001/chats/${s.id}`, { transports: ['websocket'] });
        sock.emit('joinSession', s.id);
        sock.on('chatMessage', () => {
          setUnreadCounts(prev => ({
            ...prev,
            [s.id]: (prev[s.id] || 0) + 1,
          }));
        });
        return sock;
      });
      return () => { socks.forEach(s => s.disconnect()); };
    }
  }, [isTeacher, chatSessions]);
  // 5) WS для материалов (/rooms)
  useEffect(() => {
    const ws = io('http://localhost:3001/rooms', { transports: ['websocket'] });
    ws.emit('join', code);
    ws.on('newMessage', (msg: Message) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [msg, ...prev]);
    });
    ws.on('messageEdited', (upd: Message) => {
      setMessages(prev => prev.map(m => m.id === upd.id ? upd : m));
    });
    ws.on('messageDeleted', (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });
    // начальный fetch
    api.get<{ messages: Message[] }>(`/rooms/${code}`)
      .then(r => setMessages(r.data.messages))
      .catch(console.error);
    return () => { ws.disconnect(); };
  }, [code]);

  // 6) Сброс уведомлений при открытии чата или смене сессии
  const toggleChat = () => {
    setShowChat(v => !v);
    if (isStudent && chatSessionId) {
      setUnreadCounts(prev => ({ ...prev, [chatSessionId]: 0 }));
    }
  };
  const selectSession = (id: string) => {
    setChatSessionId(id);
    setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
  };

  // 7) Отправка материала
  const sendMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text && !file) || !isTeacher) return;
    const fd = new FormData();
    if (text) fd.append('text', text);
    if (file) fd.append('file', file);
    await api.post(`/rooms/${code}/messages`, fd);
    setText('');
    setFile(null);
  };

  // 8) Рендер вложений
  const renderAttachment = (path: string) => {
    const raw = path.split('/').pop()!;
    const name = decodeURIComponent(raw.split('-').slice(1).join('-'));
    const url = `http://localhost:3001/rooms/files/${encodeURI(raw)}`;
    const ext = name.split('.').pop()!.toLowerCase();
    const imgs = ['png','jpg','jpeg','gif','webp'];
    return imgs.includes(ext)
      ? <a key={url} href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={name} className="max-h-48 rounded border mt-2"/>
        </a>
      : <a key={url} href={url} download className="flex items-center space-x-1 mt-2 text-blue-600 hover:underline">
          📄<span>{name}</span>
        </a>;
  };

  // 9) JSX
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between bg-gray-100 p-2 border-b">
        <div className="flex items-center space-x-2">
          <button onClick={() => copy(code!)}>📋</button>
          {isTeacher && <button>✏️</button>}
          <code>{code}</code>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowCodeBig(v=>!v)}>⛶</button>
          <div className="relative">
            <button onClick={toggleChat}>💬</button>
            {!showChat && Object.values(unreadCounts).some(c => c > 0) && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full" />
            )}
          </div>
          {isTeacher && <button>⚙️</button>}
        </div>
      </header>

      {showCodeBig && (
        <div className="fixed inset-0 bg-white p-8 overflow-auto z-50">
          <button onClick={()=>setShowCodeBig(false)}>✕</button>
          <pre>{code}</pre>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {showChat
          ? (
            <div className="flex-1 flex">
              {isTeacher && (
                <div className="w-1/3 border-r p-4 space-y-2 overflow-auto">
                  <h2>Ученики</h2>
                  {chatSessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s.id)}
                      className={`p-2 cursor-pointer rounded ${s.id===chatSessionId?'bg-gray-200':''}`}
                    >
                      {s.student?.email}
                      {unreadCounts[s.id] > 0 && <span className="ml-2 text-red-600">●</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1">
                {chatSessionId
                  ? <ChatWindow sessionId={chatSessionId} setUnreadCounts={setUnreadCounts}/>
                  : <div className="p-4">Выберите чат</div>}
              </div>
            </div>
          )
          : (
            <div className="flex-1 flex flex-col">
              <div className="overflow-auto p-4 space-y-4">
                {messages.map(m => (
                  <div key={m.id} className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">
                      {m.author||'Гость'} — {new Date(m.createdAt).toLocaleString()}
                    </div>
                    {m.text && <div dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(m.text)}} />}
                    {m.attachmentUrl && renderAttachment(m.attachmentUrl)}
                  </div>
                ))}
              </div>
              {isTeacher && (
                <form onSubmit={sendMaterial} className="border-t p-4 flex items-center space-x-2">
                  <ReactQuill
                    value={text}
                    onChange={setText}
                    modules={{ toolbar: [['bold','italic'],['link'],['clean']] }}
                    className="flex-1 h-24"
                  />
                  <input
                    type="file"
                    onChange={e => setFile(e.target.files?.[0]||null)}
                    className="border rounded px-2 py-1"
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
                    Отправить
                  </button>
                </form>
              )}
            </div>
          )
        }
      </div>
    </div>
  );
}
