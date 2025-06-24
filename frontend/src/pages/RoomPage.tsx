// src/pages/RoomPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { useAuth } from '../auth/AuthContext';
import EditMessageModal, { Attachment } from '../components/chat/EditMessageModal';
import { useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useRoomSocket, RoomMessage } from '../hooks/useRoomSocket';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  if (!code) return null;
  const { user } = useAuth();
  const queryClient = useQueryClient();



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

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const [chatSessions, setChatSessions] = useState<{ id: string; student?: { email: string } }[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showChat, setShowChat] = useState(false);
  const [showCodeBig, setShowCodeBig] = useState(false);

    // Хук вытаскивает: messages, setMessages и socket
  const { messages, setMessages, socket } = useRoomSocket({
    code,
    onError: console.error
  });

 // 1) Подгружаем историю через React Query (с пушем в локальный setMessages)
 const { data: queriedMessages, isLoading: loadingMessages } = useQuery<RoomMessage[], Error>({
   queryKey: ['roomMessages', code],
   queryFn: () =>
     api
       .get<{ messages: RoomMessage[] }>(`/rooms/${code}`)
       .then(res => res.data.messages.reverse()),
 });

 useEffect(() => {
   if (queriedMessages) {
     setMessages(queriedMessages);
   }
 }, [queriedMessages, setMessages]);


  useEffect(() => {
  if (!isStudent) return;
  api.get<{ id: string }>(`/rooms/${code}/chats`)
    .then(r => {
      setChatSessionId(r.data.id);
      // сразу сбросим непрочитанный счётчик
      setUnreadCounts(u => ({ ...u, [r.data.id]: 0 }));
    })
    .catch(console.error);
}, [isStudent, code]);


  // — Чат для учителя (список сессий + непрочитанные)
  useEffect(() => {
  if (!isTeacher || !showChat) return;
  api.get(`/rooms/${code}/chats`)
    .then(r => setChatSessions(r.data))
    .catch(console.error);
  api.get(`/rooms/${code}/unread-counts`)
    .then(r => setUnreadCounts(r.data))
    .catch(console.error);
}, [isTeacher, showChat, code]);

  // — Автоскролл вниз
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // — Drag&Drop (создание нового сообщения)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDragEnter = (e: DragEvent) => { e.preventDefault(); setDragCounter(c => c + 1); };
    const onDragOver  = (e: DragEvent) => { e.preventDefault(); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setDragCounter(c => c - 1); };
    const onDrop      = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(0);
      const dropped = Array.from(e.dataTransfer?.files || []);
      setFiles(prev => [...prev, ...dropped]);
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
  }, [files]);

  // — Отправка нового сообщения
 // 2) Мутация на отправку нового сообщения
 const addMessage = useMutation<unknown, Error, FormData>({
   mutationFn: (fd: FormData) => api.post(`/rooms/${code}/messages`, fd),
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['roomMessages', code] });
   },
   onError: () => alert('Ошибка отправки'),
 });

 const sendMaterial = (e: React.FormEvent) => {
   e.preventDefault();
   if (!text && files.length === 0) return;
   const fd = new FormData();
   if (text) fd.append('text', text);
   files.forEach(f => fd.append('file', f));
   addMessage.mutate(fd);
   setText(''); setFiles([]);
 };

  // — Редактирование
const onStartEdit = (m: RoomMessage) => {
  setEditingMessage(m);
  setEditText(m.text ?? '');
  setEditRemoveIds([]);
  setEditNewFiles([]);
};

const onSaveEdit = async () => {
  if (!editingMessage) return;
  const fd = new FormData();
  fd.append('text', editText);
  editRemoveIds.forEach(id => fd.append('removeAttachmentIds', id));
  editNewFiles.forEach(f => fd.append('file', f));

  try {
    const updated: RoomMessage = (
      await api.patch(
        `/rooms/${code}/messages/${editingMessage.id}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    ).data;
    // обновляем локальный стейт
    setMessages(prev =>
      prev.map(m => m.id === updated.id ? updated : m)
    );
    // и рассылаем в WS
    socket.emit('messageEdited', updated);
    setEditingMessage(null);
  } catch {
    alert('Не удалось обновить сообщение');
  }
};

  // — Удаление через хук
  const onDelete = (id: string) => {
    if (!window.confirm('Подтвердить удаление?')) return;
    api.delete(`/rooms/${code}/messages/${id}`)
      .then(() => {
        setMessages(prev => prev.filter(m => m.id !== id));
        socket.emit('deleteMessage', { roomCode: code, messageId: id });
      })
      .catch(() => alert('Не удалось удалить сообщение'));
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
        <div ref={containerRef} className="flex-1 flex flex-col relative overflow-hidden">
          {dragCounter > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-20 border-4 border-dashed border-indigo-600">
              <span className="text-white">Перетащите файлы сюда</span>
            </div>
          )}

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
        <form onSubmit={sendMaterial} className="bg-white border-t p-4 flex flex-col space-y-2">
          <ReactQuill
            value={text}
            onChange={setText}
            modules={{ toolbar:[['bold','italic'],['link'],['clean']] }}
            className="h-24"
          />

      <div className="flex items-center space-x-2">
              <input
                id="roomFiles"
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  const chosen = Array.from(e.target.files || []);
                  setFiles(prev => [...prev, ...chosen]);
                }}
              />
              <label
                htmlFor="roomFiles"
                className="bg-gray-200 p-2 rounded cursor-pointer select-none"
              >+</label>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >Отправить</button>
            </div> 
        {/* превью выбранных файлов */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((f, i) => (
              <div key={i} className="bg-gray-100 px-2 py-1 rounded flex items-center space-x-2">
                <span className="text-sm break-all">{f.name}</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
        )}
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
