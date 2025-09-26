// src/components/chat/ChatWindow.tsx
import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../auth/AuthContext';
import EditMessageModal from './EditMessageModal';
import { useChatSocket, ChatMessage } from '../../hooks/useChatSocket';
import { useTheme } from "@mui/material/styles";


import editIcon from '../../assets/icons/edit.svg';
import deleteIcon from '../../assets/icons/delete.svg';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

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

  useEffect(() => {
    if (!messages.length || !user?.id) return;
    const unread = messages
      .filter(m => !(m.readBy || []).includes(user.id))
      .map(m => m.id);
    if (unread.length) emitRead(unread);
  }, [messages, user?.id]);

  useEffect(() => {
    api.get<ChatMessage[]>(`/chats/${sessionId}/messages`)
      .then(res => {
        setMessages(res.data);
        setUnreadCounts(prev => ({ ...prev, [sessionId]: 0 }));
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 0);
      })
      .catch(console.error);
  }, [sessionId, setMessages, setUnreadCounts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDragEnter = (e: DragEvent) => {
      if (editingMessage) return;
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
      if (editingMessage) return;
      e.preventDefault();
      setDragCounter(0);
      const dropped = Array.from(e.dataTransfer?.files || []).slice(0, 10 - files.length);
      if (dropped.length) setFiles(prev => [...prev, ...dropped]);
    };

    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, [files, editingMessage]);

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
        headers: { Accept: 'application/json' },
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
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setEditingMessage(null);
    } catch (err) {
      console.error('Ошибка редактирования:', err);
      alert('Не удалось обновить сообщение');
    }
  };

  const deleteMsg = (id: string) => {
    socket.emit('chatDeleted', { sessionId, messageId: id });
  };

  const renderAttachment = (url: string, isMine: boolean) => {
    const name = decodeURIComponent(url.split('-').slice(1).join('-'));
    const ext = name.split('.').pop()?.toLowerCase();
    const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
    const isEncoded = /%[0-9A-Fa-f]{2}/.test(url);
    const safeName = isEncoded ? url : encodeURIComponent(url);
    const full = `http://localhost:3001/uploads/${safeName}`;

    return isImg ? (
      <img
        key={url}
        src={full}
        alt={name}
        className="max-h-48 mt-2 rounded border"
        crossOrigin="anonymous"
      />
    ) : (
      <a
        key={url}
        href={full}
        download
        className={`${isMine ? 'text-white underline' : 'text-blue-600 underline'} mt-2 block`}
      >
        📄 {name}
      </a>
    );
  };

  const renderPreview = () => (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((f, i) => (
        <div key={i} className="bg-gray-100 px-2 py-1 rounded flex items-center space-x-2">
          <span className="text-sm break-all">{f.name}</span>
          <button
            onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
            className="text-red-500"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col h-full relative">
      {dragCounter > 0 && (
        <div className="absolute inset-0 bg-black/20 border-4 border-dashed border-indigo-600 z-10 flex items-center justify-center">
          <span className="text-white text-lg">Перетащите файлы сюда</span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto p-4 space-y-3 bg-m3-surf">
        {messages.map((m) => {
          const isMine = m.author?.id === user?.id;

          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={[
                  'max-w-[88%]',
                  'rounded-2xl',
                  'px-5 py-4',
                  'shadow-level1',
                  'border',
                  isMine
                    ? 'bg-blue-600 text-white border-transparent self-end ml-auto'
                    : 'bg-surface text-on-surface border-gray-200',
                ].join(' ')}
              >
                {/* ВЕРХНЯЯ ПОЛОСА: время/автор слева, кнопки справа */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className={`text-xs ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                    {m.author?.email ?? 'Гость'} — {new Date(m.createdAt).toLocaleString()}
                    {m.updatedAt && m.updatedAt !== m.createdAt && (
                      <span className="ml-2 italic opacity-70">(изменено)</span>
                    )}
                  </div>

                  {isMine && !m.isTemp && !editingMessage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onStartEdit(m)}
                        title="Редактировать"
                        className={`p-1 rounded ${isMine ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                      >
                        <img src={editIcon} alt="Редактировать" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMsg(m.id)}
                        title="Удалить"
                        className={`p-1 rounded ${isMine ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                      >
                        <img src={deleteIcon} alt="Удалить" className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ТЕКСТ */}
                {m.text && (
                  <div
                    className={
                      isMine
                        ? 'text-[16px] leading-relaxed'
                        : 'prose prose-sm max-w-none text-[16px] leading-relaxed'
                    }
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }}
                  />
                )}

                {/* ВЛОЖЕНИЯ */}
                {m.attachments?.map(att => {
                  const filename = att.url;
                  const isEncoded = /%[0-9A-Fa-f]{2}/.test(filename);
                  const safeName = isEncoded ? filename : encodeURIComponent(filename);

                  const src = att.url.startsWith('blob:')
                    ? att.url
                    : `http://localhost:3001/uploads/${safeName}`;

                  const ext = (filename.split('.').pop() || '').toLowerCase();
                  const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);

                  return isImg ? (
                    <img
                      key={att.id}
                      src={src}
                      alt=""
                      className="max-h-48 mt-2 rounded border"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    renderAttachment(att.url, isMine)
                  );
                })}

                {m.readBy && m.readBy.length > 0 && (
                  <div className={`mt-1 text-xs ${isMine ? 'text-white/80' : 'text-green-600'}`}>
                    Прочитали: {m.readBy.length}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="mx-1 bg-white px-3 py-1 rounded shadow text-sm italic text-gray-600">
            Собеседник печатает…
          </div>
        )}
      </div>

      <form onSubmit={send} className="sticky bottom-0 w-full px-2 pt-1 pb-0 bg-transparent">
  {/* Верхний блок: редактор + превью */}
  <div
    className="rounded-t-lg px-3 pt-5 pb-12 mx-[10px]"
    style={{
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    }}
  >
    <div className="h-[180px]">
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
        modules={{
          toolbar: [
            ['bold','italic','underline','strike'],
            [{header:1},{header:2}],
            [{list:'ordered'},{list:'bullet'}],
            [{size:['small',false,'large','huge']}],
            ['link'],
            ['clean']
          ]
        }}
        className="h-full"
        placeholder="Введите сообщение..."
      />
    </div>

    {/* Превью вложений */}
    {files.length > 0 && (
      <div className="flex flex-wrap gap-2 my-2">
        {files.map((file, idx) => (
          <div
            key={idx}
            className="px-2 py-1 rounded-lg flex items-center space-x-1"
            style={{
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.secondary,
            }}
          >
            <span className="text-xs break-all">{file.name}</span>
            <button
              onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
              className="text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Нижний блок: кнопки */}
  <div
    className="rounded-b-lg px-3 py-2 mx-[10px] flex items-center justify-end space-x-4"
    style={{
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
    }}
  >
    <input
      id="chatFiles"
      type="file"
      className="hidden"
      multiple
      onChange={e => setFiles(Array.from(e.target.files || []))}
      disabled={!!editingMessage}
    />
    <label
      htmlFor="chatFiles"
      className={`cursor-pointer px-4 py-2 rounded ${
        editingMessage ? 'opacity-50 pointer-events-none' : ''
      }`}
      style={{
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
      }}
    >
      Прикрепить файл
    </label>
    <button
      type="submit"
      disabled={uploading || !!editingMessage || (!text && files.length === 0)}
      className="px-6 py-2 rounded-full font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      }}
    >
      {uploading ? `Загрузка… ${progress}%` : 'Отправить'}
    </button>
  </div>
</form>

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
