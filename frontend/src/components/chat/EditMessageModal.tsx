// src/components/chat/EditMessageModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export type Attachment = { id: string; url: string };

interface EditModalProps {
  messageId: string;
  initialText: string;
  existingAttachments: Attachment[];
  removeIds: string[];
  newFiles: File[];
  onTextChange: (v: string) => void;
  onToggleRemove: (id: string) => void;
  onAddNewFiles: (files: File[]) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditMessageModal({
  initialText,
  existingAttachments,
  removeIds,
  newFiles,
  onTextChange,
  onToggleRemove,
  onAddNewFiles,
  onClose,
  onSave,
}: EditModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [dragCount, setDragCount] = useState(0);

  // Drag&Drop внутри модалки с оверлеем
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const onDragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragCount(c => c + 1); };
    const onDragOver  = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragCount(c => c - 1); };
    const onDrop      = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      setDragCount(0);
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (dropped.length) onAddNewFiles(dropped);
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
  }, [onAddNewFiles]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-surface w-11/12 md:w-2/3 lg:w-1/2 p-4 rounded-lg shadow-level2 border border-gray-200"
      >
        {/* Drag overlay */}
        {dragCount > 0 && (
          <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center pointer-events-none rounded-lg">
            <span className="text-white text-lg">Перетащите файлы сюда</span>
          </div>
        )}

        <h2 className="text-xl font-semibold text-on-surface mb-4">Редактировать сообщение</h2>

        {/* Текстовый редактор */}
        <div className="h-32 mb-4">
          <ReactQuill
            theme="snow"
            value={initialText}
            onChange={onTextChange}
            modules={{ toolbar: [['bold','italic','underline'],[{ list:'ordered'},{ list:'bullet'}],['link'],['clean']] }}
            className="h-full"
          />
        </div>

        {/* Существующие вложения */}
        {existingAttachments.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2 text-on-surface">Вложения</h3>
            <div className="flex flex-wrap gap-3">
              {existingAttachments.map(att => {
                const src = `http://localhost:3001/uploads/${att.url}`;
                return (
                  <div key={att.id} className="relative">
                    <img
                      src={src}
                      className="max-h-24 rounded-lg border"
                      crossOrigin="anonymous"
                      alt=""
                    />
                    <button
                      onClick={() => onToggleRemove(att.id)}
                      className={[
                        'absolute top-1 right-1 bg-white rounded-full px-2 py-1 text-sm shadow',
                        removeIds.includes(att.id) ? 'text-red-600' : 'text-gray-500'
                      ].join(' ')}
                      title={removeIds.includes(att.id) ? 'Будет удалено' : 'Пометить на удаление'}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Загрузка новых файлов */}
        <div className="mb-4">
          <h3 className="font-medium mb-2 text-on-surface">Добавить файлы</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            Перетащите файлы сюда или
            <input
              type="file"
              multiple
              className="ml-2"
              onChange={e => {
                const chosen = Array.from(e.target.files || []);
                onAddNewFiles(chosen);
              }}
            />
          </div>
          {newFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {newFiles.map((f, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-lg">
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-on-surface"
          >
            Отмена
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
