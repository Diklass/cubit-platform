// src/pages/RoomPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { useAuth } from '../auth/AuthContext';
import EditMessageModal, { Attachment } from '../components/chat/EditMessageModal';
import { useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import 'react-quill/dist/quill.snow.css';
import { ChatWindow } from '../components/chat/ChatWindow';


type RoomMessage = { id: string; text?: string; author?: { id: string; email: string }; attachments?: Attachment[]; createdAt: string };



export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  if (!code) return null;
  const { user } = useAuth();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragCounter, setDragCounter] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [editingMessage, setEditingMessage] = useState<RoomMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [editRemoveIds, setEditRemoveIds] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const [chatSessions, setChatSessions] = useState<{ id: string; student?: { email: string } }[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showChat, setShowChat] = useState(false);
  const [showCodeBig, setShowCodeBig] = useState(false);

  const [file, setFile]       = useState<File | null>(null);


 // общий WS для комнаты (материалы)
  useEffect(() => {
    api.get<{ messages: RoomMessage[] }>(`/rooms/${code}`)
      .then(r => setMessages(r.data.messages))
      .catch(console.error);

    const ws = io('http://localhost:3001/rooms', { transports: ['websocket'] });
    ws.emit('join', code);
    ws.on('newMessage', (msg: RoomMessage) => setMessages(prev => [msg, ...prev]));
    ws.on('messageEdited', (upd: RoomMessage) => setMessages(prev => prev.map(m => m.id === upd.id ? upd : m)));
    ws.on('messageDeleted', (id: string) => setMessages(prev => prev.filter(m => m.id !== id)));
    return () => { ws.disconnect(); };
  }, [code]);

  
  // 1) загрузить материалы + подписаться на WS
  useEffect(() => {
    api.get<{ messages: RoomMessage[] }>(`/rooms/${code}`)
      .then(r => setMessages(r.data.messages))       // или .reverse() по желанию
      .catch(console.error);

    const ws = io('http://localhost:3001/rooms', { transports: ['websocket'] });
    ws.emit('join', code);
    ws.on('newMessage', msg =>   setMessages(prev => [msg, ...prev]));
    ws.on('messageEdited', upd => setMessages(prev => prev.map(m => m.id===upd.id?upd:m)));
    ws.on('messageDeleted', id => setMessages(prev => prev.filter(m=>m.id!==id)));
    return () => { ws.disconnect() };
  }, [code]);

   // 2) WS для чатов: студент сразу, учитель при открытии
  useEffect(() => {
    if (isStudent) {
      api.get<{ id: string }>(`/rooms/${code}/chats`)
        .then(r => setChatSessionId(r.data.id))
        .catch(console.error);
    }
  }, [isStudent, code]);

  useEffect(() => {
    if (isTeacher && showChat) {
      api.get(`/rooms/${code}/chats`).then(r => setChatSessions(r.data));
      api.get(`/rooms/${code}/unread-counts`).then(r => setUnreadCounts(r.data));
    }
  }, [isTeacher, showChat, code]);

  // 3) автоскролл
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // пример для ученика — получение своей сессии
useEffect(() => {
  if (isStudent) {
    api.get<{ id: string }>(`/rooms/${code}/chats`)
      .then(r => setChatSessionId(r.data.id))
      .catch(console.error);
  }
}, [isStudent, code]);

// пример для учителя — список сессий + не прочитанные
useEffect(() => {
  if (isTeacher && showChat) {
    api.get(`/rooms/${code}/chats`).then(r => setChatSessions(r.data));
    api.get(`/rooms/${code}/unread-counts`).then(r => setUnreadCounts(r.data));
  }
}, [isTeacher, showChat, code]);

  // 4) drag & drop для новой формы
   useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDragEnter = (e: DragEvent) => {
      if (editingMessage) return;    // если модал открыт — игнорируем
      e.preventDefault();
      setDragCounter(c => c + 1);
    };
    const onDragOver = (e: DragEvent) => {
      if (editingMessage) return;
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (editingMessage) return;
      e.preventDefault();
      setDragCounter(c => c - 1);
    };
    const onDrop = (e: DragEvent) => {
      if (editingMessage) return;    // <-- главное
      e.preventDefault();
      setDragCounter(0);
      const dropped = Array.from(e.dataTransfer?.files || []).slice(0, 10 - files.length);
      if (dropped.length) setFiles(prev => [...prev, ...dropped]);
    };

    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('dragover',  onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop',     onDrop);
    return () => {
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('dragover',  onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop',     onDrop);
    };
  }, [files, editingMessage]);

  // 5) отправка
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && files.length === 0) return;

    const fd = new FormData();
    if (text.trim()) fd.append('text', text.trim());
    files.forEach(f => fd.append('file', f));

    setUploading(true);
    try {
      await api.post(`/rooms/${code}/messages`, fd, {
        onUploadProgress: evt => {
          const pct = Math.round((evt.loaded/(evt.total??1))*100);
          setProgress(pct);
        },
      });
      setText(''); setFiles([]);
    } catch (err) {
      console.error(err);
      alert('Ошибка отправки');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // 6) начать редактирование
 const onStartEdit = (m: RoomMessage) => {
    setEditingMessage(m);
    setEditText(m.text ?? '');
    setEditRemoveIds([]);
    setEditNewFiles([]);
  };
  // 7) сохранить редактирование
  const onSaveEdit = async () => {
    if (!editingMessage) return;
    const fd = new FormData();
    fd.append('text', editText);
    editRemoveIds.forEach(id => fd.append('removeAttachmentIds', id));
    editNewFiles.forEach(f => fd.append('file', f));

    try {
      const updated: RoomMessage = (await api.patch(
        `/rooms/${code}/messages/${editingMessage.id}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )).data;
      // обновляем в локальном state
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      setEditingMessage(null);
    } catch {
      alert('Не удалось обновить сообщение');
    }
  };
  // 8) удалить
const onDelete = async (id: string) => {
   if (!window.confirm('Подтвердите удаление сообщения')) return;
   try {
     // вызываем DELETE /rooms/:code/messages/:messageId
     await api.delete(`/rooms/${code}/messages/${id}`);
     // локально удалим сразу, чтобы не ждать WS
     setMessages(prev => prev.filter(m => m.id !== id));
   } catch (err) {
     console.error('Ошибка удаления:', err);
     alert('Не удалось удалить сообщение');
   }
 };

  const renderAttachment = (url: string) => {
    const full = `http://localhost:3001/rooms/files/${url}`;
    const ext = url.split('.').pop()!;
    const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);
    return isImg
      ? <img key={url} src={full} className="max-h-48 mt-2 rounded border" />
      : <a key={url} href={full} download className="block text-blue-600">📄 {url}</a>;
  };

   // 4) Функция отправки материалов
  const sendMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && files.length === 0) return;
    const fd = new FormData();
    if (text)       fd.append('text', text);
    files.forEach(f => fd.append('file', f));
    try {
      await api.post(`/rooms/${code}/messages`, fd);
      setText(''); setFiles([]);
    } catch {
      alert('Ошибка отправки');
    }
  };

   return (
    <div className="flex flex-col h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-gray-100 p-2 border-b">
        <div className="flex items-center space-x-2">
          <button onClick={()=>copy(code)}>📋</button>
          <code>{code}</code>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={()=>setShowCodeBig(v=>!v)}>⛶</button>
          <div className="relative">
            <button onClick={()=>setShowChat(v=>!v)}>💬</button>
            {!showChat && Object.values(unreadCounts).some(c=>c>0) && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full"/>
            )}
          </div>
          {isTeacher && <button>⚙️</button>}
        </div>
      </header>

      {/* BIG CODE */}
      {showCodeBig && (
        <div className="fixed inset-0 bg-white p-8 overflow-auto z-50">
          <button onClick={()=>setShowCodeBig(false)}>✕</button>
          <pre>{code}</pre>
        </div>
      )}

      {/* MAIN */}
      {showChat ? (
        // — ЧАТ —
        <div className="flex flex-1 overflow-hidden">
          {isTeacher && (
            <div className="w-1/3 border-r p-4 overflow-y-auto" style={{ minHeight: 0 }}>
              <h2>Ученики</h2>
              {chatSessions.map(s => (
                <div
                  key={s.id}
                  onClick={()=>{
                    setChatSessionId(s.id);
                    setUnreadCounts(u=>({ ...u,[s.id]:0 }));
                  }}
                  className={`p-2 cursor-pointer rounded ${s.id===chatSessionId?'bg-gray-200':''}`}
                >
                  {s.student?.email}
                  {unreadCounts[s.id]>0 && <span className="ml-2 text-red-600">●</span>}
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {chatSessionId
              ? <ChatWindow sessionId={chatSessionId} setUnreadCounts={setUnreadCounts}/>
              : <div className="p-4 text-center">Выберите чат</div>}
          </div>
        </div>
      ) : (
        // — МАТЕРИАЛЫ —
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto p-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className="relative bg-white p-3 rounded shadow-sm">
                <div className="text-xs text-gray-500 mb-1">
                  {m.author?.email||'Гость'} — {new Date(m.createdAt).toLocaleString()}
                </div>
                {m.text && (
                  <div className="prose" dangerouslySetInnerHTML={{
                    __html:DOMPurify.sanitize(m.text!)
                  }} />
                )}
                {m.attachments?.map(att => {
                  const url = `http://localhost:3001/rooms/files/${att.url}`;
                  const ext = att.url.split('.').pop()!.toLowerCase();
                  const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);
                  return isImg
                    ? <img key={att.id} src={url} className="max-h-48 mt-2 rounded border"/>
                    : <a key={att.id} href={url} download className="block text-blue-600 mt-2">
                        📄 {att.url}
                      </a>;
                })}
                                  {/* Кнопки редактирования/удаления для автора */}
                 {/* Кнопки редактирования/удаления — только для автора сообщения */}
                {m.author?.id === user?.id && !editingMessage && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => onStartEdit(m)}
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
              </div>
              
            ))}
          </div>

          {isTeacher && (
            <form onSubmit={sendMaterial} className="border-t p-4 flex items-center space-x-2">
              <ReactQuill
                value={text}
                onChange={setText}
                modules={{ toolbar:[['bold','italic'],['link'],['clean']]}}
                className="flex-1 h-24"
              />
              <input
                type="file"
                multiple
                onChange={e=>setFiles(Array.from(e.target.files||[]))}
                className="border rounded px-2 py-1"
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
                Отправить
              </button>
            </form>
          )}
          {editingMessage && (
  <EditMessageModal
    messageId={editingMessage.id}
    initialText={editText}
    existingAttachments={editingMessage.attachments || []}
    removeIds={editRemoveIds}
    newFiles={editNewFiles}
    onTextChange={setEditText}
    onToggleRemove={id =>
      setEditRemoveIds(ids =>
        ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
      )
    }
    onAddNewFiles={files => setEditNewFiles(prev => [...prev, ...files])}
    onClose={() => setEditingMessage(null)}
    onSave={onSaveEdit}
  />
)}
        </div>
      )}
    </div>
    
  );
  
}
