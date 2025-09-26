import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, CardActionArea, CardContent, Typography, Grid, Button, TextField, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Subject } from '../types/lessons';

const LessonsList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  const loadSubjects = () => {
    api.get<Subject[]>('/subjects')
      .then(res => setSubjects(res.data))
      .catch(() => setError('Не удалось загрузить предметы'));
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    api.post('/subjects', { title: newTitle })
      .then(() => {
        setNewTitle('');
        loadSubjects();
      })
      .catch(() => setError('Ошибка при создании предмета'));
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (subjects === null) return <p>Загружаем предметы…</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Список предметов</h1>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Название предмета"
          size="small"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button variant="contained" onClick={handleAdd}>
          Добавить
        </Button>
      </Box>

      {subjects.length === 0 ? (
        <p>Предметы отсутствуют. Создайте хотя бы один.</p>
      ) : (
        <Grid container spacing={2}>
          {subjects.map(s => (
            <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardActionArea onClick={() => navigate(`/lessons/${s.id}`)}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {s.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.moduleCount ?? 0} модулей • {s.lessonCount ?? 0} уроков
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
};

export default LessonsList;
