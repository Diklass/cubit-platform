import React, { useEffect, useState } from 'react';
import api from '../api';
import { Box, Typography } from '@mui/material';

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
    // на случай, если в content всё ещё обычный текст
    blocks = [{ type: 'text', content: lesson.content ?? '' }];
  }

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
          {b.type === 'text' && <Typography>{b.content}</Typography>}
          {b.type === 'image' && (
            <Typography color="text.secondary">[Изображение]</Typography>
          )}
          {b.type === 'video' && (
            <Typography color="text.secondary">[Видео: {b.content}]</Typography>
          )}
          {b.type === 'file' && (
            <Typography color="text.secondary">[Файл]</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};
