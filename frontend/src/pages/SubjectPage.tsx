import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api';
import { SidebarTree, ModuleNode } from '../components/SidebarTree';
import { LessonContent } from '../components/LessonContent';
import { Button, TextField, Box } from '@mui/material';

type SubjectDetail = { id: string; title: string; tree: ModuleNode[] };

export default function SubjectPage() {
  const { subjectId } = useParams();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedLessonId = sp.get('lessonId') ?? undefined;
  const [newModuleTitle, setNewModuleTitle] = useState('');


  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    api.get<SubjectDetail>(`/subjects/${subjectId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const handleSelectLesson = (id: string) => {
    sp.set('lessonId', id);
    setSp(sp, { replace: true });
  };

  const handleAddLesson = (moduleId: string) => {
  const title = prompt('Введите название урока');
  if (!title) return;
  api.post(`/subjects/modules/${moduleId}/lessons`, { title })
    .then(() => api.get<SubjectDetail>(`/subjects/${subjectId}`))
    .then(r => setData(r.data));
};

  const handleAddModule = () => {
  if (!newModuleTitle.trim() || !subjectId) return;
  api.post(`/subjects/${subjectId}/modules`, { title: newModuleTitle })
    .then(() => {
      setNewModuleTitle('');
      // перезагрузим данные
      return api.get<SubjectDetail>(`/subjects/${subjectId}`);
    })
    .then(r => setData(r.data));
};

  if (loading) return <div className="p-4">Загрузка…</div>;
  if (!data) return <div className="p-4 text-red-600">Ошибка загрузки</div>;

  return (
    <div className="flex gap-4 p-4">
      <div className="w-1/3">
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
                label="Название модуля"
                size="small"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddModule}>
                Добавить модуль
            </Button>
        </Box>
        <SidebarTree
          tree={data.tree}
          onSelectLesson={handleSelectLesson}
          selectedLessonId={selectedLessonId}
          onAddLesson={handleAddLesson}
        />
      </div>
      <div className="flex-1">
        <LessonContent lessonId={selectedLessonId} />
      </div>
    </div>
  );
}
