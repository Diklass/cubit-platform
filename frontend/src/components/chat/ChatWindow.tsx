// src/components/chat/ChatWindow.tsx
import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../auth/AuthContext';
import EditMessageModal from './EditMessageModal';
import { useChatSocket, ChatMessage } from '../../hooks/useChatSocket';

interface Props {
  sessionId: string;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function ChatWindow({ sessionId, setUnreadCounts }: Props) {
  const { user } = useAuth();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [editRemoveIds, setEditRemoveIds] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [dragCounter, setDragCounter] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null); // для DnD overlay
  const scrollRef = useRef<HTMLDivElement>(null);    // для автоскролла вниз

  const {
    messages,
    setMessages,
    socket,
    typing,
    emitTyping,
    emitStopTyping,
    emitRead,
  } = useChatSocket(sessionId, console.error);

  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // помечаем прочитанными
  useEffect(() => {
    if (!messages.length || !user?.id) return;
    const unread = messages.filter(m => !(m.readBy || []).includes(user.id)).map(m => m.id);
    if (unread.length) emitRead(unread);
  }, [messages, user?.id]);

  // загрузка истории
  useEffect(() => {
    api.get<ChatMessage[]>(`/chats/${sessionId}/messages`)
      .then(res => {
        setMessages(res.data);
        setUnreadCounts(prev => ({ ...prev, [sessionId]: 0 }));
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 0);
      })
      .catch(console.error);
  }, [sessionId, setMessages, setUnreadCounts]);

  // автоскролл при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // DnD для формы отправки
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDragEnter = (e: DragEvent) => { if (editingMessage) return; e.preventDefault(); setDragCounter(c => c + 1); };
    const onDragOver  = (e: DragEvent) => { if (editingMessage) return; e.preventDefault(); };
    const onDragLeave = (e: DragEvent) => { if (editingMessage) return; e.preventDefault(); setDragCounter(c => c - 1); };
    const onDrop      = (e: DragEvent) => {
      if (editingMessage) return;
      e.preventDefault();
      setDragCounter(0);
      const dropped = Array.from(e.dataTransfer?.files || []).slice(0, 10 - files.length);
      if (dropped.length) setFiles(prev => [...prev, ...dropped]);
    };
    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('dragover',  onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop',      onDrop);
    return () => {
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('dragover',  onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop',      onDrop);
    };
  }, [files, editingMessage]);

  // ОТПРАВКА: всегда HTTP + optimistic UI
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      isTemp: true,
      text: text.trim(),
      author: { id: user!.id, email: user!.email },
      attachments: files.map((f, i) => ({
        id: `temp-${tempId}-${i}`,
        url: URL.createObjectURL(f),
      })),
      createdAt: now,
    };
    setMessages(prev => [...prev, tempMsg]);

    const fd = new FormData();
    if (text.trim()) fd.append('text', text.trim());
    files.forEach(f => fd.append('files', f));

    setUploading(true);
    try {
      const res = await api.post<ChatMessage>(`/chats/${sessionId}/messages`, fd, {
        onUploadProgress: evt => {
          const pct = Math.round((evt.loaded / (evt.total ?? 1)) * 100);
          setProgress(pct);
        },
        headers: { 'Accept': 'application/json' },
      });
      const realMsg = res.data;
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        const i = withoutTemp.findIndex(m => m.id === realMsg.id);
        if (i >= 0) {
          const copy = withoutTemp.slice();
          copy[i] = realMsg;
          return copy;
        }
        return [...withoutTemp, realMsg];
      });
      setText('');
      setFiles([]);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Ошибка отправки (HTTP):', err);
      alert('Не удалось отправить сообщение');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // редактирование
  const onStartEdit = (m: ChatMessage) => {
    setEditingMessage(m);
    setEditText(m.text || '');
    setEditRemoveIds([]);
    setEditNewFiles([]);
  };

  const onSaveEdit = async () => {
    if (!editingMessage) return;
    if (editingMessage.id.startsWith('temp-')) { setEditingMessage(null); return; }
    const fd = new FormData();
    fd.append('text', editText);
    editRemoveIds.forEach(id => fd.append('removeAttachmentIds', id));
    editNewFiles.forEach(f => fd.append('newFiles', f));
    try {
      const updated: ChatMessage = (await api.patch(
        `/chats/${sessionId}/messages/${editingMessage.id}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )).data;
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      setEditingMessage(null);
    } catch (err) {
      console.error('Ошибка редактирования:', err);
      alert('Не удалось обновить сообщение');
    }
  };

  // удаление
  const deleteMsg = (id: string) => {
    socket.emit('chatDeleted', { sessionId, messageId: id });
  };

  const renderAttachment = (url: string) => {
    const name = decodeURIComponent(url.split('-').slice(1).join('-'));
    const ext = name.split('.').pop()?.toLowerCase();
    const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext || '');
    const full = `http://localhost:3001/uploads/${url}`; // имена вида uuid.ext

    return isImg ? (
      <img
        key={url}
        src={full}
        alt={name}
        className="max-h-48 mt-2 rounded-lg border"
        crossOrigin="anonymous"
      />
    ) : (
      <a key={url} href={full} download className="text-blue-600 mt-2 inline-flex items-center hover:underline">
        📄 {name}
      </a>
    );
  };

  const renderPreview = () => (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((f, i) => (
        <div key={i} className="bg-gray-100 px-2 py-1 rounded-lg flex items-center space-x-2">
          <span className="text-sm break-all">{f.name}</span>
          <button
            onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
            className="text-red-500 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-m3-surf">
      {/* Drag-overlay */}
      {dragCounter > 0 && (
        <div className="absolute inset-0 bg-black/20 border-4 border-dashed border-indigo-600 z-10 flex items-center justify-center rounded-lg m-2">
          <span className="text-white text-lg">Перетащите файлы сюда</span>
        </div>
      )}

      {/* СООБЩЕНИЯ: карточки в стиле RoomPage */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        {messages.map((m) => {
          const isMine = m.author?.id === user?.id;
          return (
            <div
              key={m.id}
              className={[
                'relative bg-surface rounded-lg shadow-level1 border',
                isMine ? 'border-blue-200' : 'border-gray-300',
                'p-4'
              ].join(' ')}
            >
              {/* Автор и дата */}
              <div className="text-xs text-gray-500 mb-2">
                {m.author?.email || 'Гость'} — {new Date(m.createdAt).toLocaleString()}
                {m.updatedAt && m.updatedAt !== m.createdAt && (
                  <span className="ml-2 italic text-xs text-gray-400">(изменено)</span>
                )}
              </div>

              {/* Текст */}
              {m.text && (
                <div
                  className="prose prose-sm text-on-surface"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }}
                />
              )}

              {/* Вложения */}
              <div className="mt-2 flex flex-col gap-2">
                {m.attachments?.map(att => {
                  const ext = (att.url.split('.').pop() || '').toLowerCase();
                  const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);
                  if (!isImg) return renderAttachment(att.url);

                  const src = att.url.startsWith('blob:')
                    ? att.url
                    : `http://localhost:3001/uploads/${att.url}`;
                  return (
                    <img
                      key={att.id}
                      src={src}
                      alt=""
                      className="max-h-56 rounded-lg border"
                      crossOrigin="anonymous"
                    />
                  );
                })}
              </div>

              {/* Прочитали */}
              {m.readBy && m.readBy.length > 0 && (
                <div className="mt-1 text-xs text-green-600">
                  Прочитали: {m.readBy.length}
                </div>
              )}

              {/* Кнопки */}
              {m.author?.id === user?.id && !m.isTemp && !editingMessage && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => onStartEdit(m)}
                    title="Редактировать"
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteMsg(m.id)}
                    title="Удалить"
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {typing && (
          <div className="mx-1 bg-surface px-3 py-1 rounded-lg shadow-level1 text-sm italic text-gray-600 border border-gray-200">
            Собеседник печатает…
          </div>
        )}
      </div>

      {/* ФОРМА: тот же паттерн, что в RoomPage — верх (редактор), низ (кнопки) */}
      <form onSubmit={send} className="sticky bottom-0 w-full px-2 pt-1 pb-0 bg-transparent">
        {/* Верхняя часть: редактор */}
        <div className="bg-white rounded-t-lg border border-gray-300 px-3 pt-4 pb-12 mx-3">
          <div className="h-[140px]">
            <ReactQuill
              theme="snow"
              value={text}
              onChange={value => {
                setText(value);
                emitTyping();
                clearTimeout((window as any).__stopTypingTimer);
                (window as any).__stopTypingTimer = setTimeout(() => {
                  emitStopTyping();
                }, 1000);
              }}
              modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] }}
              className="h-full"
              placeholder="Введите сообщение..."
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">{renderPreview()}</div>
          )}
        </div>

        {/* Нижняя часть: кнопки */}
        <div className="bg-white rounded-b-lg border border-gray-300 px-3 py-2 mx-3 flex items-center justify-end gap-4">
          <input
            id="chatFiles"
            type="file"
            multiple
            className="hidden"
            disabled={!!editingMessage}
            onChange={e => {
              const chosen = Array.from(e.target.files ?? []).slice(0, 10 - files.length);
              setFiles(prev => [...prev, ...chosen]);
            }}
          />
          <label
            htmlFor="chatFiles"
            className={[
              'cursor-pointer text-base font-medium px-4 py-2 rounded',
              editingMessage ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'
            ].join(' ')}
          >
            Прикрепить файл
          </label>

          <button
            type="submit"
            disabled={uploading || !!editingMessage || (!text.trim() && files.length === 0)}
            className={[
              'px-6 py-2 rounded-full font-semibold text-base',
              uploading || editingMessage || (!text.trim() && files.length === 0)
                ? 'bg-blue-600/60 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            ].join(' ')}
          >
            {uploading ? `Загрузка… ${progress}%` : 'Отправить'}
          </button>
        </div>
      </form>

      {/* Модалка редактирования — те же радиусы/кнопки */}
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
          onAddNewFiles={fils => setEditNewFiles(prev => [...prev, ...fils])}
          onClose={() => setEditingMessage(null)}
          onSave={onSaveEdit}
        />
      )}
    </div>
  );
}
