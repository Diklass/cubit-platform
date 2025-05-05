// frontend/src/pages/LessonsList.tsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { ModelViewer } from '../components/ModelViewer';

type Lesson = {
  id: string;
  title: string;
  modelUrl?: string;
};

export const LessonsList: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Lesson[]>('/lessons')
      .then(res => setLessons(res.data))
      .catch(() => setError('Не удалось загрузить уроки'));
  }, []);

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Список уроков</h1>
      {lessons.length === 0 && <p>Уроки отсутствуют.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {lessons.map(({ id, title, modelUrl }) => (
          <li key={id} style={{ marginBottom: 30 }}>
            <h2>{title}</h2>
            {modelUrl ? (
              <ModelViewer url={modelUrl} width={600} height={400} />
            ) : (
              <p>3D-модель не загружена</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
