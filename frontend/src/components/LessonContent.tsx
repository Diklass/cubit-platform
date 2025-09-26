import React, { useEffect, useState } from 'react';
import api from '../api';

type Lesson = { id: string; title: string; content?: string };

interface Props {
  lessonId?: string;
}

export const LessonContent: React.FC<Props> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    api.get<Lesson>(`/lessons/${lessonId}`).then((r) => setLesson(r.data));
  }, [lessonId]);

  if (!lessonId) return <p>Выберите урок слева</p>;
  if (!lesson) return <p>Загрузка урока…</p>;

  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
      {lesson.content ? (
        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
      ) : (
        <p className="opacity-70">Контент отсутствует</p>
      )}
    </div>
  );
};
