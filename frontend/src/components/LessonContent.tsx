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

  let blocks: Block[] = [];
  try {
    blocks = lesson.content ? JSON.parse(lesson.content) : [];
  } catch {
    // fallback: если content — просто текст
    blocks = [{ type: 'text', content: lesson.content ?? '' }];
  }

  // Функция для рендера видео
  const renderVideo = (url: string) => {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (ytMatch) {
      const videoId = ytMatch[1];
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            borderRadius: 8,
            margin: '12px 0',
          }}
        />
      );
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          width="100%"
          height="315"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{
            borderRadius: 8,
            margin: '12px 0',
          }}
        />
      );
    }

    // Другие ссылки
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>
        ▶ Смотреть видео
      </a>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {lesson.title}
      </Typography>
      {blocks.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Нет содержимого
        </Typography>
      )}
      {blocks.map((b, idx) => (
        <Box key={idx} sx={{ mb: 2 }}>
          {b.type === 'text' && (
            <div
              style={{ lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(b.content) }}
            />
          )}
          {b.type === 'image' && b.content && (
            <img
              src={b.content}
              alt="Изображение"
              style={{
                maxWidth: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 8,
                display: 'block',
                margin: '12px 0',
              }}
            />
          )}
          {b.type === 'video' && renderVideo(b.content)}
          {b.type === 'file' && b.content && (
            <a href={b.content} target="_blank" rel="noreferrer">
              📎 {decodeURIComponent(b.content.split('/').pop() || 'Файл')}
            </a>
          )}
        </Box>
      ))}
    </Box>
  );
};
