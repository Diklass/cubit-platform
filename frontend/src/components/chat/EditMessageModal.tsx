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

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      setDragCount(c => c + 1);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      setDragCount(c => c - 1);
    };
    const onDrop = (e: DragEvent) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-white w-11/12 md:w-2/3 lg:w-1/2 p-4 rounded shadow-lg"
      >
        {/* ————— Оверлей при Drag&Drop ————— */}
        {dragCount > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-20 z-10 flex items-center justify-center pointer-events-none">
            <span className="text-white text-lg">Перетащите файлы сюда</span>
          </div>
        )}

        <h2 className="text-xl mb-4">Редактировать сообщение</h2>

        {/* Текстовый редактор */}
        <ReactQuill
          theme="snow"
          value={initialText}
          onChange={onTextChange}
          modules={{ toolbar: [['bold','italic'],['link'],['clean']] }}
          className="h-32 mb-4"
        />

        {/* Существующие вложения */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Вложения</h3>
          <div className="flex flex-wrap gap-2">
            {existingAttachments.map(att => (
              <div key={att.id} className="relative">
                <img
                  src={`http://localhost:3001/rooms/files/${att.url}`}
                  className="max-h-24 rounded border"
                />
                <button
                  onClick={() => onToggleRemove(att.id)}
                  className={`absolute top-0 right-0 bg-white p-1 rounded-full ${
                    removeIds.includes(att.id)
                      ? 'opacity-100 text-red-600'
                      : 'opacity-50 text-gray-400'
                  }`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Загрузка новых файлов */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Добавить файлы</h3>
          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
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
                <span key={i} className="px-2 py-1 bg-gray-100 rounded">
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Отмена
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
