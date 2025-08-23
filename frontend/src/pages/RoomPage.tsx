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

  // NEW: состояние свернутого/развернутого композера для материалов
  const [composerOpen, setComposerOpen] = useState(false);

  // Настройки комнаты (цвет/название)
  const [settings, setSettings] = useState<RoomSettings>({
    title: '',
    bgColor: '#FFFFFF',
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleEdit = () => setSettingsOpen(true);
  const handleFullscreen = () => {/* ваш код изначально */};
  const handleChat = () => {
    setShowChat(v => {
      const next = !v;
      if (next) {
        // уходим в чат — принудительно сворачиваем композер и скрываем FAB
        setComposerOpen(false);
      }
      return next;
    });
  };

  const { messages, setMessages, socket } = useRoomSocket({
    code,
    onError: console.error
  });

  const { data: info } = useQuery<RoomInfo, Error>({
    queryKey: ['roomInfo', code],
    queryFn: () => api.get<RoomInfo>(`/rooms/${code}`).then(r => r.data),
    enabled: !!code,
  });

  const { data: queriedMessages } = useQuery<RoomMessage[], Error>({
    queryKey: ['roomMessages', code],
    queryFn: () =>
      api.get<{ messages: RoomMessage[] }>(`/rooms/${code}`).then(res => res.data.messages.reverse()),
  });

  const roomTitle = info?.title ?? code!;

  useEffect(() => {
    if (info) setSettings({ title: info.title, bgColor: info.bgColor });
  }, [info]);

  const saveSettings = useMutation<
    { bgColor: string },
    Error,
    RoomSettings
  >({
    mutationFn: async (newSettings: RoomSettings): Promise<{ bgColor: string }> =>
      api
        .patch<{ bgColor: string; title: string }>(`/rooms/${code}/settings`, newSettings)
        .then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomInfo', code] });
      setSettingsOpen(false);
    },
  });

  useEffect(() => {
    if (queriedMessages) setMessages(queriedMessages);
  }, [queriedMessages, setMessages]);

  useEffect(() => {
    if (!isStudent) return;
    api.get<{ id: string }>(`/rooms/${code}/chats`)
      .then(r => {
        setChatSessionId(r.data.id);
        setUnreadCounts(u => ({ ...u, [r.data.id]: 0 }));
      })
      .catch(console.error);
  }, [isStudent, code]);

  useEffect(() => {
    if (!isTeacher || !showChat) return;
    api.get(`/rooms/${code}/chats`)
      .then(r => setChatSessions(r.data))
      .catch(console.error);
    api.get(`/rooms/${code}/unread-counts`)
      .then(r => setUnreadCounts(r.data))
      .catch(console.error);
  }, [isTeacher, showChat, code]);

  // DnD для материалов
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

  // Отправка материалов
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

  // Редактирование материала
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
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      if (socket) socket.emit('messageEdited', updated);
      setEditingMessage(null);
    } catch {
      alert('Не удалось обновить сообщение');
    }
  };

  const onDelete = (id: string) => {
    if (!window.confirm('Подтвердить удаление?')) return;
    api.delete(`/rooms/${code}/messages/${id}`)
      .then(() => {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (socket) socket.emit('deleteMessage', { roomCode: code, messageId: id });
      })
      .catch(() => alert('Не удалось удалить сообщение'));
  };

  // --- РЕНДЕР ---
  return (
    <div className="flex flex-col h-full bg-m3-bg overflow-auto">
      <div className="mt-[30px]" />

      {/* ШАПКА: compact — когда открыт чат */}
      <RoomHeader
        name={info?.title ?? code!}
        code={code!}
        onEdit={handleEdit}
        onFullscreen={() => {}}
        onChat={handleChat}
        bgColor={settings.bgColor}
        compact={showChat}          // <<< ВАЖНО
      />

      {/* Модалка настроек */}
      <RoomSettingsModal
        initial={settings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={newSettings => {
          saveSettings.mutate({ title: newSettings.title, bgColor: newSettings.bgColor });
        }}
      />

      {/* КОД КОМНАТЫ (большой баннер) — как у вас было, опускаю для краткости */}

      {/* КОНТЕНТ */}
      <div className="pt-1 pb-1 flex-1 relative">
        {showChat ? (
          // === ЧАТ ===
          <div className="mx-[20px] flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">
            {/* список сессий (учитель) */}
            {isTeacher && (
              <aside className="w-1/3 bg-m3-surf p-4 rounded-2xl mr-2 border border-gray-200">
                <h2 className="mb-2 text-lg font-semibold">Ученики</h2>
                {chatSessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setChatSessionId(s.id);
                      setUnreadCounts(u => ({ ...u, [s.id]: 0 }));
                    }}
                    className={[
                      'mb-2 px-3 py-2 rounded-lg cursor-pointer border',
                      s.id === chatSessionId
                        ? 'bg-gray-200 border-transparent'
                        : 'hover:bg-gray-100 border-gray-200'
                    ].join(' ')}
                  >
                    {s.student?.email}
                    {unreadCounts[s.id] > 0 && (
                      <span className="ml-2 text-red-600">●</span>
                    )}
                  </div>
                ))}
              </aside>
            )}

            {/* окно чата */}
            <div className="flex-1 bg-m3-surf overflow-y-auto rounded-2xl border border-gray-200" style={{ minHeight: 0 }}>
              {chatSessionId ? (
                <ChatWindow sessionId={chatSessionId} setUnreadCounts={setUnreadCounts} />
              ) : (
                <div className="p-6 text-center text-gray-500">Выберите чат</div>
              )}
            </div>
          </div>
        </div>
        ) : (
          // === МАТЕРИАЛЫ ===
          <div ref={containerRef} className="flex flex-1 flex-col min-h-0 mx-[20px]">
            {dragCounter > 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-20 border-4 border-dashed border-indigo-600 rounded-2xl">
                <span className="text-white">Перетащите файлы сюда</span>
              </div>
            )}

            <div className="flex-1 overflow-auto pt-4 pb-24 space-y-4"> {/* увеличили нижний паддинг под выезжающий композер */}
              {messages.slice().reverse().map(m => (
                <div key={m.id} className="relative bg-surface p-4 rounded-2xl shadow-level1 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">
                    {m.author?.email || 'Гость'} — {new Date(m.createdAt).toLocaleString()}
                  </div>

                  {m.text && (
                    <div
                      className="prose mb-2"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }}
                    />
                  )}

                  <div className="mt-2 flex flex-col space-y-2">
                    {m.attachments?.map(att => {
                      const url = `http://localhost:3001/uploads/${att.url}`;
                      const ext = att.url.split('.').pop()!.toLowerCase();
                      const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);
                      return (
                        <a key={att.id} href={url} download className="inline-block">
                          {isImg ? (
                            <img src={url} alt={decodeURIComponent(att.url)} className="max-h-48 rounded-lg border cursor-pointer" />
                          ) : (
                            <span className="text-blue-600 underline cursor-pointer">
                              📄 {decodeURIComponent(att.url)}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>

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

            {/* FAB — только в материалах, только для учителя */}
            {isTeacher && !showChat && !composerOpen && (
              <button
                onClick={() => setComposerOpen(true)}
                className="
                  fixed bottom-[20px] right-[20px] z-30
                  h-14 w-14 rounded-full
                  bg-blue-600 hover:bg-blue-700
                  text-white text-3xl leading-none
                  shadow-level2 flex items-center justify-center
                "
                aria-label="Открыть отправку сообщения"
                title="Отправить сообщение"
              >
                +
              </button>
            )}

            {/* Выезжающий композер — только в материалах */}
            {isTeacher && !showChat && (
              <div
                className={[
                  'fixed left-0 right-0 bottom-0 z-20',
                  'transition-all duration-300',
                  composerOpen ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0',
                ].join(' ')}
              >
                <form
                  onSubmit={(e) => {
                    sendMaterial(e);
                    setComposerOpen(false);
                  }}
                  className="w-full px-2 pt-1 pb-safe bg-transparent"
                >
                  <div className="bg-white rounded-t-lg border border-gray-300 px-3 pt-5 pb-12 mx-[10px]">
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

                  <div className="bg-white rounded-b-lg border border-gray-300 px-3 py-2 mx-[10px] flex items-center justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
                    >
                      Свернуть
                    </button>

                    <div className="flex items-center gap-3">
                      <input
                        id="roomFiles"
                        type="file"
                        className="hidden"
                        multiple
                        onChange={e => setFiles(Array.from(e.target.files || []))}
                      />
                      <label
                        htmlFor="roomFiles"
                        className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-base font-medium px-4 py-2 rounded-full"
                      >
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
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
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
