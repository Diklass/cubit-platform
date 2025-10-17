import React, { useEffect, useState } from 'react';
import api from '../api';
import { Box, Typography } from '@mui/material';
import DOMPurify from 'dompurify';

type Block = { type: string; content: string };
type Lesson = { id: string; title: string; content: string | null };

interface Props {
  lessonId?: string;
}

export const LessonContent: React.FC<Props> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    api.get<Lesson>(`/subjects/lessons/${lessonId}`).then((r) => setLesson(r.data));
  }, [lessonId]);

  if (!lessonId) {
    return <div>Выберите урок</div>;
  }

  if (!lesson) {
    return <div>Загрузка...</div>;
  }

  let sections: any[] = [];
  try {
    const parsed = lesson.content ? JSON.parse(lesson.content) : [];
    sections = Array.isArray(parsed) ? parsed : [];
  } catch {
    sections = [];
  }
  // Функция для видео
  const renderVideo = (url: string) => {
    if (!url) return null;

    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 8, margin: '12px 0' }}
        />
      );
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          width="100%"
          height="315"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 8, margin: '12px 0' }}
        />
      );
    }

    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>
        ▶ Смотреть видео
      </a>
    );
  };

  // Функция для выбора иконки файла
  const renderFile = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    let icon = '📎';
    if (['pdf'].includes(ext)) icon = '📄';
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) icon = '📝';
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) icon = '📊';
    if (['ppt', 'pptx', 'odp'].includes(ext)) icon = '📑';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) icon = '📦';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) icon = '🎵';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) icon = '🎬';

    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        {decodeURIComponent(url.split('/').pop() || 'Файл')}
      </a>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {lesson.title}
      </Typography>
      {sections.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Нет содержимого
        </Typography>
      )}
      {sections.map((section, sIdx) => (
        <Box key={sIdx} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, borderBottom: "1px solid #ddd" }}>
            {section.title}
          </Typography>
          {section.children.map((b: any, idx: number) => (
            <Box key={idx} sx={{ mb: 2 }}>
              {b.type === "text" && (
                <div dangerouslySetInnerHTML={{ __html: b.content }} />
              )}
              {b.type === "image" && b.content && (
                <img src={b.content} alt="Изображение"
                  style={{ maxWidth: "100%", borderRadius: 8, margin: "8px 0" }}
                />
              )}
              {b.type === "video" && (
                <Typography color="text.secondary">Видео: {b.content}</Typography>
              )}
              {b.type === "file" && b.content && (
                <a href={b.content} target="_blank" rel="noreferrer">
                  📎 {decodeURIComponent(b.content.split("/").pop() || "Файл")}
                </a>
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};
