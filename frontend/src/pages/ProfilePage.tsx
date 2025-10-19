// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Paper, Typography, Button, Box, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

type Profile = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    api
      .get<Profile>('/users/me')
      .then(res => setProfile(res.data))
      .catch(() => setError('Не удалось загрузить профиль'));
  }, []);

  const handleLogout = async () => {
    try {
      // optionally: await api.post('/auth/logout');
    } catch {
      // игнорируем ошибку — важно почистить клиент
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3, color: theme.palette.error.main }}>
        {error}
      </Box>
    );
  }

  if (!profile) {
    return <Box sx={{ p: 3 }}>Загружаем профиль…</Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: '1px solid',
          borderColor: theme.palette.divider,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            Профиль
          </Typography>

          <Button
            onClick={handleLogout}
            variant="contained"
            sx={{
              bgcolor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              '&:hover': { bgcolor: theme.palette.error.dark },
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Выйти
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 1.5, columnGap: 2 }}>
          <Typography component="dt" color="text.secondary">ID:</Typography>
          <Typography component="dd">{profile.id}</Typography>

          <Typography component="dt" color="text.secondary">Email:</Typography>
          <Typography component="dd">{profile.email}</Typography>

          <Typography component="dt" color="text.secondary">Роль:</Typography>
          <Typography component="dd">{profile.role}</Typography>

          <Typography component="dt" color="text.secondary">Зарегистрирован:</Typography>
          <Typography component="dd">
            {new Date(profile.createdAt).toLocaleString()}
          </Typography>

          <Typography component="dt" color="text.secondary">Обновлён:</Typography>
          <Typography component="dd">
            {new Date(profile.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
