import React, { useEffect, useState } from 'react';
import api from '../api';

type Lesson = {
  id: string;
  title: string;
  modelUrl?: string;
};

const LessonsList: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Lesson[]>('/lessons')
      .then(res => setLessons(res.data))
      .catch(() => setError('Не удалось загрузить уроки'));
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (lessons === null) return <p>Загружаем уроки…</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Список уроков</h1>
      {lessons.length === 0 ? (
        <p>Уроки отсутствуют. Создайте хотя бы один.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {lessons.map(l => (
            <li key={l.id} style={{ marginBottom: 20 }}>
              <h2>{l.title}</h2>
              {l.modelUrl ? (
                <p>Модель: <a href={l.modelUrl} target="_blank">{l.modelUrl}</a></p>
              ) : (
                <p>3D-модель отсутствует</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LessonsList;
