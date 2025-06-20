// src/components/chat/ChatWindow.tsx
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../api';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../auth/AuthContext';

type Attachment = { id: string; url: string };

type Message = {
  id: string;
  text?: string;
  author?: { id: string; email: string };
  attachments?: Attachment[];
  createdAt: string;
  isTemp?: boolean;
};

interface Props {
  sessionId: string;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function ChatWindow({ sessionId, setUnreadCounts }: Props) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [dragCounter, setDragCounter] = useState<number>(0);

  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [editRemoveIds, setEditRemoveIds] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles]   = useState<File[]>([]);

  // 1) Загрузить историю
  useEffect(() => {
    api
      .get<Message[]>(`/chats/${sessionId}/messages`)
      .then(res => {
        setMessages(res.data);
        setUnreadCounts(prev => ({ ...prev, [sessionId]: 0 }));
      })
      .catch(console.error);
  }, [sessionId, setUnreadCounts]);

  // 2) WS
  useEffect(() => {
    const sock = io(`http://localhost:3001/chats/${sessionId}`, {
      transports: ['websocket'],
    });
    socketRef.current = sock;
    sock.emit('joinSession', sessionId);

    sock.on('chatMessage', msg => {
      setMessages(prev => {
        // убираем временные, показываем реальные
prev
         .filter(m => m.isTemp && m.attachments)
         .flatMap(m => m.attachments!)
         .forEach(att => URL.revokeObjectURL(att.url));
       // затем убираем все temp и показываем реальное
       const noTemp = prev.filter(m => !m.isTemp);
       return [...noTemp, msg];
      });
    });
    sock.on('chatEdited', msg => {
      setMessages(prev => prev.map(m => (m.id === msg.id ? msg : m)));
    });
    sock.on('chatDeleted', id => {
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    return () => {
      sock.disconnect();
    };
  }, [sessionId]);

  // 3) Скролл вниз
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4) Drag&Drop
  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;
    const onDragEnter = (e: DragEvent) => { e.preventDefault(); setDragCounter(c => c + 1); };
    const onDragOver  = (e: DragEvent) => e.preventDefault();
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setDragCounter(c => c - 1); };
    const onDrop      = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(0);
      const dropped = Array.from(e.dataTransfer?.files || []).slice(0, 10 - files.length);
      if (dropped.length) setFiles(prev => [...prev, ...dropped]);
    };
    div.addEventListener('dragenter', onDragEnter);
    div.addEventListener('dragover', onDragOver);
    div.addEventListener('dragleave', onDragLeave);
    div.addEventListener('drop', onDrop);
    return () => {
      div.removeEventListener('dragenter', onDragEnter);
      div.removeEventListener('dragover', onDragOver);
      div.removeEventListener('dragleave', onDragLeave);
      div.removeEventListener('drop', onDrop);
    };
  }, [files]);
  // 5) Отправка одного сообщения с файлами
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && files.length === 0) return;

    // 1) показываем временный message
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      isTemp: true,
      text: text.trim(),
      author: { id: user!.id, email: user!.email },
      attachments: files.map((f, i) => ({
        id: `temp-${Date.now()}-${i}`,
        url: URL.createObjectURL(f)
      })),
      createdAt: now,
    };
    setMessages(prev => [...prev, tempMsg]);

    // 2) готовим FormData
    const fd = new FormData();
    if (text.trim()) fd.append('text', text.trim());
    files.forEach(f => fd.append('files', f));

    setUploading(true);
    try {
      await api.post(`/chats/${sessionId}/messages`, fd, {
        onUploadProgress: evt => {
          const pct = Math.round((evt.loaded / (evt.total ?? 1)) * 100);
          setProgress(pct);
        },
      });
      // при успехе сразу сбрасываем поля
      setText('');
      setFiles([]);
    } catch (err: any) {
      // при ошибке убираем temp-сообщение и показываем alert
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Ошибка отправки:', err.response?.data || err);
      alert('Не удалось отправить сообщение');
      return;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // 6) Редактирование
  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditText(m.text || '');

    setEditRemoveIds([]);      
    setEditNewFiles([]);
  };
  const submitEdit = async () => {
    if (!editingId) return;

    // Собираем FormData
  const fd = new FormData();
  fd.append('text', editText);
  editRemoveIds.forEach(id => fd.append('removeAttachmentIds', id));
  editNewFiles.forEach(f => fd.append('newFiles', f));

    // Отправляем PATCH на контроллер
    try {
      await api.patch(
        `/chats/${sessionId}/messages/${editingId}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      // сброс локальных state
      setEditingId(null);
      setEditText('');
      setEditRemoveIds([]);
      setEditNewFiles([]);
    } catch (err) {
      console.error('Ошибка редактирования:', err);
      alert('Не удалось обновить сообщение');
    }
  };


  // 7) Удаление
  const deleteMsg = (id: string) => {
    socketRef.current?.emit('chatDeleted', { sessionId, messageId: id });
  };

  // Превью прикреплённых файлов
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

  // Рендер вложений из server-side URL
  const renderAttachment = (url: string) => {
    const name = decodeURIComponent(url.split('-').slice(1).join('-'));
    const ext = name.split('.').pop()?.toLowerCase();
    const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext || '');
    const full = `http://localhost:3001/rooms/files/${url}`;
    return isImg ? (
      <a key={url} href={full} target="_blank" rel="noreferrer">
        <img src={full} alt={name} className="max-h-48 mt-2 rounded border" />
      </a>
    ) : (
      <a key={url} href={full} download className="text-blue-600 mt-2 block hover:underline">
        📄 {name}
      </a>
    );
  };

    return (
      <div ref={containerRef} className="flex flex-col h-full relative">
        {dragCounter > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-20 border-4 border-dashed border-indigo-600 z-10 flex items-center justify-center">
            <span className="text-white text-lg">Перетащите файлы сюда</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className="relative bg-white p-3 rounded shadow-sm">
              <div className="text-sm text-gray-500 mb-1">
                {m.author?.email ?? 'Гость'} — {new Date(m.createdAt).toLocaleString()}
              </div>

        {editingId === m.id ? (
          <>
            {/* 1. Редактируем текст */}
            <ReactQuill theme="snow" value={editText} onChange={setEditText} />
            {/* 2. Существующие вложения: отметка на удаление */}
            <div className="mt-2">
              {m.attachments?.map(att => (
                <div key={att.id} className="inline-block relative mr-2">
                  <img src={`http://localhost:3001/rooms/files/${att.url}`}
                      className="max-h-24 rounded border" />
                  <button
                    onClick={() => {
                      setEditRemoveIds(ids =>
                        ids.includes(att.id) 
                          ? ids.filter(x => x !== att.id) 
                          : [...ids, att.id]
                      );
                    }}
                    className={`absolute top-0 right-0 bg-white rounded-full text-red-600 p-1 ${
                      editRemoveIds.includes(att.id) ? 'opacity-100' : 'opacity-50'
                    }`}
                    title="Удалить вложение"
                  >×</button>
                </div>
              ))}
            </div>
            {/* 3. Добавить новые файлы */}
            <div className="mt-2">
              <input
                type="file"
                multiple
                onChange={e => {
                  const chosen = Array.from(e.target.files || []);
                  setEditNewFiles(prev => [...prev, ...chosen]);
                }}
              />
              {/* превью новых файлов */}
              <div className="flex flex-wrap mt-2">
                {editNewFiles.map((f, i) => (
                  <div key={i} className="mr-2">
                    <span className="text-sm">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* 4. Кнопки */}
            <div className="flex space-x-2 mt-3">
              <button onClick={submitEdit} className="bg-green-600 text-white px-3 py-1 rounded">
                Сохранить
              </button>
              <button onClick={() => setEditingId(null)} className="bg-gray-300 px-3 py-1 rounded">
                Отмена
              </button>
            </div>
          </>
        ) : (
              <>
                {m.text && <div className="prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.text) }} />}
                {m.attachments?.map(att => {
                      // для blob-URL — оптимистичный рендер
                      if (att.url.startsWith('blob:')) {
                        return (
                          <img
                            key={att.url}
                            src={att.url}
                            alt="preview"
                            className="max-h-48 mt-2 rounded border"
                          />
                        );
                      }
                      // для обычных url — штатный рендерер
                      return renderAttachment(att.url);
                    })}
                {m.author?.id === user?.id && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button onClick={() => startEdit(m)} className="text-blue-600 hover:text-blue-800" title="Редактировать">✏️</button>
                    <button onClick={() => deleteMsg(m.id)} className="text-red-600 hover:text-red-800" title="Удалить">🗑️</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="bg-white border-t p-4 flex flex-col space-y-2">
        <ReactQuill theme="snow" value={text} onChange={setText}
          modules={{ toolbar: [['bold','italic'],['link'],['clean']] }}
          className="h-24" placeholder="Введите сообщение..."
        />

        <div className="flex items-center space-x-2">
          <input id="chatFiles" type="file" multiple accept="*"
            className="hidden"
            onChange={e => {
              const chosen = Array.from(e.target.files ?? []).slice(0, 10 - files.length);
              setFiles(prev => [...prev, ...chosen]);
            }}
          />
          <label htmlFor="chatFiles" className="bg-gray-200 p-2 rounded cursor-pointer text-xl select-none">+</label>

          <button type="submit" disabled={uploading}
            className={`px-4 py-2 rounded ${uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {uploading ? `Загрузка… ${progress}%` : 'Отправить'}
          </button>
        </div>
        {uploading && <progress value={progress} max={100} className="w-full mt-2" />}
        {files.length > 0 && renderPreview()}
      </form>
    </div>
  );
}
