import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../auth/AuthContext';
import EditMessageModal, { Attachment } from './EditMessageModal';
import { useChatSocket, ChatMessage } from '../../hooks/useChatSocket';

import {
  List,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  ListRowProps,
} from 'react-virtualized';


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

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: 100 }));
  const listRef = useRef<List>(null);
  

  const {
    messages,
    setMessages,
    socket,
    typing,           // <- новый флаг “печатает”
    emitTyping,       // <- чтобы эмитить “начал печатать”
    emitStopTyping,   // <- чтобы эмитить “прекратил печатать”
    emitRead,         // <- чтобы эмитить “прочитано”
  } = useChatSocket(sessionId, console.error);

  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
    if (!messages.length) return;
    const unread = messages
      .filter(m => !(m.readBy||[]).includes(user!.id))
      .map(m => m.id);
    if (unread.length) emitRead(unread);
  }, [messages]);

  // 1) Загрузка истории сообщений
useEffect(() => {
  api.get<ChatMessage[]>(`/chats/${sessionId}/messages`)
    .then(res => {
      // просто сетим ровно то, что пришло
      setMessages(res.data);
      setUnreadCounts(prev => ({ ...prev, [sessionId]: 0 }));

      setTimeout(() => {
              if (listRef.current && res.data.length > 0) {
                listRef.current.scrollToRow(res.data.length - 1);
              }
            }, 0);
          })
          .catch(console.error);
      }, [sessionId, setMessages, setUnreadCounts]);



  // 3) Скролл вниз
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4) Drag&Drop для формы отправки
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

  // 5) Отправка сообщения
const send = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!text.trim() && files.length === 0) return;

  // Собираем временное сообщение для прелоада
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

     // Формируем FormData
  const fd = new FormData();
  if (text.trim()) fd.append('text', text.trim());
  files.forEach(f => fd.append('files', f));

  setUploading(true);
  try {
    // Отправляем на сервер и ждём реального сообщения в ответе
    const res = await api.post<ChatMessage>(
      `/chats/${sessionId}/messages`,
      fd,
      {
        onUploadProgress: evt => {
          const pct = Math.round((evt.loaded / (evt.total ?? 1)) * 100);
          setProgress(pct);
        },
      }
    );
    const realMsg = res.data;
    // Заменяем temp-сообщение на реальное
    setMessages(prev =>
      prev.map(m => (m.id === tempId ? realMsg : m))
    );
    // Сбрасываем форму
    setText('');
    setFiles([]);
  } catch (err: any) {
    // Если ошибка — убираем temp-сообщение
    setMessages(prev => prev.filter(m => m.id !== tempId));
    console.error('Ошибка отправки:', err.response?.data || err);
    alert('Не удалось отправить сообщение');
    } finally {
    setUploading(false);
    setProgress(0);
    }
  };

  // 6) Начало редактирования
  const onStartEdit = (m: ChatMessage) => {
    setEditingMessage(m);
    setEditText(m.text || '');
    setEditRemoveIds([]);
    setEditNewFiles([]);
  };

  // 7) Сохранение редактирования
  const onSaveEdit = async () => {
    // сначала убедимся, что у нас есть настоящее сообщение
    if (!editingMessage) return;
    // не редактируем временные сообщения
    if (editingMessage.id.startsWith('temp-')) {
      setEditingMessage(null);
      return;
    }
    const fd = new FormData();

    // теперь безопасно можем взять id
    const messageId = editingMessage.id;

    fd.append('text', editText);
    editRemoveIds.forEach(id => fd.append('removeAttachmentIds', id));
    editNewFiles.forEach(f => fd.append('newFiles', f));

    try {
       const updated: ChatMessage = (await api.patch(
        `/chats/${sessionId}/messages/${editingMessage!.id}`,  // non-null assertion
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

  // 8) Удаление
  const deleteMsg = (id: string) => {
    socket.emit('chatDeleted', { sessionId, messageId: id });
  };

  // Вспомогательные функции
  const renderPreview = () => (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((f, i) => (
        <div key={i} className="bg-gray-100 px-2 py-1 rounded flex items-center space-x-2">
          <span className="text-sm break-all">{f.name}</span>
          <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-500">✕</button>
        </div>
      ))}
    </div>
  );

  const renderAttachment = (url: string) => {
    const name = decodeURIComponent(url.split('-').slice(1).join('-'));
    const ext = name.split('.').pop()?.toLowerCase();
    const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext || '');
    const full = `http://localhost:3001/rooms/files/${url}`;
    return isImg ? (
      <img key={url} src={full} alt={name} className="max-h-48 mt-2 rounded border" />
    ) : (
      <a key={url} href={full} download className="text-blue-600 mt-2 block hover:underline">
        📄 {name}
      </a>
    );
  };


  const [isAtBottom, setIsAtBottom] = useState(true);

  return (
    <div ref={containerRef} className="flex flex-col h-full relative">
 
      {/* Drag-overlay для формы отправки */}
      {dragCounter > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-20 border-4 border-dashed border-indigo-600 z-10 flex items-center justify-center">
          <span className="text-white text-lg">Перетащите файлы сюда</span>
        </div>
      )}

<div ref={containerRef} className="relative flex flex-col h-full">
  {/* Виртуализованный список сообщений */}
  <div className="flex-1 relative">
    <AutoSizer>
      {({ height, width }) => (
      <List
      ref={listRef}
          width={width}
          height={height}
          rowCount={messages.length}
          rowHeight={cache.current.rowHeight}
          deferredMeasurementCache={cache.current}
          overscanRowCount={5}
             // — Условный автоскролл вниз:
             onScroll={({ scrollTop, scrollHeight, clientHeight }) => {
               const atBot = scrollHeight - scrollTop - clientHeight < 20;
               setIsAtBottom(atBot);
             }}
             scrollToIndex={isAtBottom ? messages.length - 1 : undefined}
             scrollToAlignment="end"
          rowRenderer={({ index, key, parent, style }) => {
            const m = messages[index];
            return (
              <CellMeasurer
                key={key}
                cache={cache.current}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
              >
                {({ registerChild }) => (
                  <div
                    ref={registerChild}
                    style={style}
                    className="relative bg-white p-3 pb-6 rounded shadow-sm"
                  >
                    {/* Автор и время */}
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <span>
                          {m.author?.email ?? 'Гость'} — {new Date(m.createdAt).toLocaleString()}
                        </span>
                        {m.updatedAt && m.updatedAt !== m.createdAt && (
                          <span className="ml-2 italic text-xs text-gray-400">(изменено)</span>
                        )}
                      </div>

                    {/* Текст */}
                    {m.text && (
                      <div
                        className="prose"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(m.text),
                        }}
                      />
                    )}
                    {/* Вложения */}
                      {m.attachments?.map(att => {
                        const src = att.url.startsWith('blob:')
                          ? att.url
                          : `http://localhost:3001/rooms/files/${att.url}`;
                        const ext = att.url.split('.').pop()!.toLowerCase();
                        const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);

                        if (!isImg) {
                          return renderAttachment(att.url);
                        }

                        return (
                          <img
                            key={att.id}
                            src={src}
                            alt=""
                            className="max-h-48 mt-2 rounded border"
                            onLoad={() => {
                              cache.current.clear(index, 0);
                              listRef.current?.recomputeRowHeights(index);
                            }}
                          />
                        );
                      })}

                     {/* Счётчик прочитавших */}
                      {m.readBy && m.readBy.length > 0 && (
                        <div className="mt-1 text-xs text-green-600">
                          Прочитали: {m.readBy.length}
                        </div>
                      )}
                      
                    {/* Кнопки */}
                   {m.author?.id === user?.id && !m.isTemp && !editingMessage && (
                     <div className="absolute top-2 right-2 flex space-x-1">
                       <button
                         onClick={() => onStartEdit(m)}
                         className="text-blue-600 hover:text-blue-800"
                         title="Редактировать"
                       >
                         ✏️
                       </button>
                       <button
                         onClick={() => deleteMsg(m.id)}
                         className="text-red-600 hover:text-red-800"
                         title="Удалить"
                       >
                         🗑️
                       </button>
                     </div>
                   )}
                  </div>
                )}
              </CellMeasurer>
            );
          }}
        />
      )}
    </AutoSizer>
  </div>

    {typing && (
    <div
      className="
        absolute left-4
        bottom-[4.5rem]      /* чуть выше формы (4.5rem = 72px примерно) */
        bg-white
        px-3 py-1
        rounded
        shadow
        text-sm italic text-gray-600
        z-10
      "
    >
      Собеседник печатает…
    </div>
  )}

      {/* Форма нового сообщения */}
      <form onSubmit={send} className="bg-white border-t p-4 flex flex-col space-y-2">
        <ReactQuill
          theme="snow"
          value={text}
          onChange={value => {
            setText(value);
            emitTyping();
            clearTimeout((window as any).__stopTypingTimer);
            ;(window as any).__stopTypingTimer = setTimeout(() => {
              emitStopTyping();
            }, 1000);
          }}
          modules={{ toolbar: [['bold', 'italic'], ['link'], ['clean']] }}
          className="h-24"
          placeholder="Введите сообщение..."
        />


        <div className="flex items-center space-x-2">
          <input
            id="chatFiles"
            type="file"
            multiple
            accept="*"
            className="hidden"
            disabled={!!editingMessage}
            onChange={e => {
              const chosen = Array.from(e.target.files ?? []).slice(0, 10 - files.length);
              setFiles(prev => [...prev, ...chosen]);
            }}
          />
          <label
            htmlFor="chatFiles"
            className={`bg-gray-200 p-2 rounded cursor-pointer text-xl select-none ${
              editingMessage ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            +
          </label>
          <button
            type="submit"
            disabled={uploading || !!editingMessage}
            className={`px-4 py-2 rounded ${
              uploading || editingMessage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {uploading ? `Загрузка… ${progress}%` : 'Отправить'}
          </button>
        </div>

        {uploading && <progress value={progress} max={100} className="w-full mt-2" />}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">{renderPreview()}</div>
        )}
      </form>
</div>
      {/* Модалка редактирования */}
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
