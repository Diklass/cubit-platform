import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button, TextField, Box } from '@mui/material';


type Lesson = { id: string; title: string; content?: string };

export default function LessonEditor() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!lessonId) return;
    api.get<Lesson>(`/lessons/${lessonId}`).then((r) => {
      setLesson(r.data);
      setTitle(r.data.title);
      setContent(r.data.content ?? '');
    });
  }, [lessonId]);

  const handleSave = () => {
    if (!lessonId) return;
    api.patch(`/subjects/lessons/${lessonId}`, { title, content }).then(() => {
      navigate(-1); // вернуться назад
    });
  };

  if (!lesson) return <p>Загрузка урока…</p>;

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        label="Название урока"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      <ReactQuill theme="snow" value={content} onChange={setContent} />
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSave}>
          Сохранить
        </Button>
      </Box>
    </Box>
  );
}
