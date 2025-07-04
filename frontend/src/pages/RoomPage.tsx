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
import { RoomHeader } from '../components/RoomHeader';
import { RoomSettingsModal } from '../components/RoomSettingsModal';


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { AxiosResponse } from 'axios';

import 'react-quill/dist/quill.snow.css';


import editIcon from '../assets/icons/edit.svg';
import deleteIcon from '../assets/icons/delete.svg';


  interface RoomInfo {
    id: string;
    code: string;
    title: string;
    ownerId: string;
    bgColor: string;
  }

 interface RoomSettings {
 title: string;
 bgColor: string;
 }

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

    // Состояние настроек фона
     const [settings, setSettings] = useState<RoomSettings>({
     title: '',
     bgColor: '#FFFFFF',
    });
    const [settingsOpen, setSettingsOpen] = useState(false);

    // для примера, обёртки для кнопок:
  const handleEdit = () => setSettingsOpen(true); /* откроет модалку настроек */;
  const handleFullscreen = () => setShowCodeBig(v => !v);
  const handleChat = () => setShowChat(v => !v);

    // Хук вытаскивает: messages, setMessages и socket
  const { messages, setMessages, socket } = useRoomSocket({
    code,
    onError: console.error
  });

     // Хук для загрузки информации о комнате (включая bgColor)
 const { data: info } = useQuery<RoomInfo, Error>({
   queryKey: ['roomInfo', code],
   queryFn: () => api.get<RoomInfo>(`/rooms/${code}`).then(r => r.data),
   enabled: !!code,
 });

 // 1) Подгружаем историю через React Query (с пушем в локальный setMessages)
 const { data: queriedMessages, isLoading: loadingMessages } = useQuery<RoomMessage[], Error>({
   queryKey: ['roomMessages', code],
   queryFn: () =>
     api
     .get<{ messages: RoomMessage[] }>(`/rooms/${code}`)
     .then(res => res.data.messages.reverse()),
 });


  const roomTitle = info?.title ?? code!;

  useEffect(() => {
    if (info) 
      setSettings({ title: info.title, bgColor: info.bgColor });
  }, [info]);

  // мутация для сохранения нового цвета
const saveSettings = useMutation<
  { bgColor: string },      // TData — что возвращает сервер
  Error,                    // TError
  RoomSettings              // TVariables — что мы передаём в mutate()
>({
  mutationFn: async (newSettings: RoomSettings): Promise<{ bgColor: string }> =>
    api
      .patch<{ bgColor: string; title: string }>(
        `/rooms/${code}/settings`,
        newSettings,
      )
      .then(res => res.data),
  onSuccess: () => {
    // теперь TS не ругается — передаём объект с queryKey
    queryClient.invalidateQueries({ queryKey: ['roomInfo', code] });
    setSettingsOpen(false);
  },
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


  const headerClass = "sticky top-0 z-20 bg-m3-surf px-6 py-4 shadow-sm";
  const footerClass = "sticky bottom-0 z-10 bg-m3-surf border-t p-4";

  

// --- РЕНДЕР ---
  return (
    <div className="flex flex-col h-full bg-m3-bg overflow-auto ">   
    <div className="mt-[30px]"></div>    
     {/* === ROOM HEADER BANNER === */}
       <RoomHeader
         name={roomTitle}           
         code={code!}
         onEdit={() => setSettingsOpen(true)}
         onFullscreen={handleFullscreen}
         onChat={handleChat}
         bgColor={settings.bgColor}
       />

       

          {/* === ROOM SETTINGS MODAL === */}
          <RoomSettingsModal
        initial={settings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={newSettings => {
          saveSettings.mutate({ title: newSettings.title, bgColor: newSettings.bgColor });
        }}
      />

    {/* === BIG CODE MODAL === */}
    {showCodeBig && (
      <div className="fixed inset-0 z-[200] bg-black bg-opacity-80 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg shadow-xl w-full h-full max-w-[90vw] max-h-[90vh] overflow-auto flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-2xl font-bold text-on-surface">Код комнаты: {code}</h2>
            <button
              onClick={() => setShowCodeBig(false)}
              className="text-on-surface hover:text-danger transition text-xl"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <pre className="text-9xl font-mono text-on-surface text-center break-all">
              {code}
            </pre>
          </div>
        </div>
      </div>
    )}


    {/* === MAIN CONTENT (между шапкой и футером) === */}
    <div className="px-2 pt-1 pb-1 flex-1">
      {showChat ? (
        // — ЧАТ —
        <div className="flex flex-1">
          {/* список чатов (только для учителя) */}
         {isTeacher && (
           <aside className="w-1/3 bg-m3-surf p-4">
              <h2 className="mb-2 text-lg font-semibold">Ученики</h2>
              {chatSessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    setChatSessionId(s.id);
                    setUnreadCounts(u => ({ ...u, [s.id]: 0 }));
                  }}
                  className={`
                    mb-2 px-3 py-2 rounded-lg cursor-pointer 
                    ${s.id === chatSessionId ? 'bg-gray-200' : 'hover:bg-gray-100'}
                  `}
                >
                  {s.student?.email}
                  {unreadCounts[s.id] > 0 && (
                    <span className="ml-2 text-red-600">●</span>
                  )}
                </div>
              ))}
            </aside>
          )}

          {/* окно самого чата */}
          <div
            className="flex-1 bg-m3-surf overflow-y-auto"
            style={{ minHeight: 0 }}
          >
            {chatSessionId ? (
              <ChatWindow
                sessionId={chatSessionId}
                setUnreadCounts={setUnreadCounts}
              />
            ) : (
              <div className="p-6 text-center text-gray-500">
                Выберите чат
              </div>
            )}
          </div>
        </div>
      ) : (
        // — МАТЕРИАЛЫ —
        <div ref={containerRef} className="flex flex-1 flex-col min-h-0">
          {dragCounter > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-20 border-4 border-dashed border-indigo-600">
              <span className="text-white">Перетащите файлы сюда</span>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4 pb-0 space-y-4">
          {messages.slice().reverse().map(m => (
            <div
              key={m.id}
              className="relative bg-surface p-4 rounded-lg shadow-level1"
            >
              {/* 1. Автор и дата */}
              <div className="text-xs text-gray-500 mb-2">
                {m.author?.email || 'Гость'} —{' '}
                {new Date(m.createdAt).toLocaleString()}
              </div>

              {/* 2. Текст сообщения */}
              {m.text && (
                <div
                  className="prose mb-2"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(m.text),
                  }}
                />
              )}

              {/* 3. Вложения — обёрнуты в <a download> */}
              <div className="mt-2 flex flex-col space-y-2">
                {m.attachments?.map(att => {
                  const url = `http://localhost:3001/rooms/files/${att.url}`;
                  const ext = att.url.split('.').pop()!.toLowerCase();
                  const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);

                  return (
                    <a
                      key={att.id}
                      href={url}
                      download
                      className="inline-block"
                    >
                      {isImg ? (
                        <img
                          src={url}
                          alt={decodeURIComponent(att.url)}
                          className="max-h-48 rounded-lg border cursor-pointer"
                        />
                      ) : (
                        <span className="text-blue-600 underline cursor-pointer">
                          📄 {decodeURIComponent(att.url)}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>



                {/* кнопки редактирования/удаления */}
                {m.author?.id === user?.id && !editingMessage && (
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => onStartEdit(m)}
                      title="Редактировать"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <img src={editIcon} alt="Редактировать" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(m.id)}
                      title="Удалить"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <img src={deleteIcon} alt="Удалить" className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>

    {/* === FOOTER: форма отправки (только для учителя) === */}

          {isTeacher && (
        <form
          onSubmit={sendMaterial}
          className="sticky bottom-0 w-full px-2 pt-1 pb-0 bg-transparent"
        >
          {/* Контейнер редактора и превью */}
          <div className="bg-white rounded-t-lg border border-gray-300 px-3 pt-5 pb-12 mx-3">
            {/* Редактор: фиксированная высота, больше места для текста */}
            <div className="h-[180px]">
              <ReactQuill
                value={text}
                onChange={setText}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ header: 1 }, { header: 2 }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ size: ['small', false, 'large', 'huge'] }],
                    ['link'], ['clean'],
                  ],
                }}
                formats={['header','bold','italic','underline','strike','list','bullet','size','link']}
                placeholder="Введите сообщение..."
                className="h-full"
              />
            </div>

            {/* Превью вложений */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 my-2">
                {files.map((file, idx) => (
                  <div key={idx} className="bg-gray-100 px-2 py-1 rounded-lg flex items-center space-x-1">
                    <span className="text-xs break-all">{file.name}</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

         {/* Контейнер кнопок ниже */}
          <div className="bg-white rounded-b-lg border border-gray-300 px-3 py-2 mx-3 flex items-center justify-end space-x-4">
            <input
              id="roomFiles"
              type="file"
              className="hidden"
              multiple
              onChange={e => setFiles(Array.from(e.target.files || []))}
            />
            <label htmlFor="roomFiles" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-base font-medium px-4 py-2 rounded">
              Прикрепить файл
            </label>
            <button
              type="submit"
              disabled={!text && files.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отправить
            </button>
          </div>
        </form>
      )}

    {/* === EDIT MESSAGE MODAL === */}
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
);
}
