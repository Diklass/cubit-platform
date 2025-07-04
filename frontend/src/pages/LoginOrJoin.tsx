// src/pages/LoginOrJoin.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { useForm } from 'react-hook-form';

type FormLogin = { email: string; password: string };
type FormRoom  = { roomCode: string };

const LoginOrJoin: React.FC = () => {
  const theme = useTheme();
  const { login, loginWithRoom } = useAuth();
  const [mode, setMode]     = useState<'login' | 'room'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const {
    register: regLogin,
    handleSubmit: onLoginSubmit,
    formState: { errors: loginErr },
  } = useForm<FormLogin>();

  const {
    register: regRoom,
    handleSubmit: onRoomSubmit,
    formState: { errors: roomErr },
  } = useForm<FormRoom>();

  const onLogin = async (data: FormLogin) => {
    setError(null); setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка входа');
    } finally { setLoading(false); }
  };

  const onJoin = async (data: FormRoom) => {
    setError(null); setLoading(true);
    try {
      await loginWithRoom(data.roomCode);
    } catch (e: any) {
      setError(
        e.response?.status === 404
          ? 'Комната не найдена'
          : e.response?.data?.message || 'Ошибка входа'
      );
    } finally { setLoading(false); }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card
        elevation={4}
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Добро пожаловать в Cubit
          </Typography>

          <Tabs
            value={mode}
            onChange={(_, v) => { setMode(v); setError(null); }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab value="login" label="По паролю" />
            <Tab value="room"  label="По коду комнаты" />
          </Tabs>

          {mode === 'login' ? (
            <Box component="form" onSubmit={onLoginSubmit(onLogin)} noValidate sx={{ mt: 2 }}>
              <TextField
                label="Email"
                fullWidth
                margin="normal"
                {...regLogin('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Неверный формат',
                  },
                })}
                error={!!loginErr.email}
                helperText={loginErr.email?.message}
                disabled={loading}
              />
              <TextField
                label="Пароль"
                type="password"
                fullWidth
                margin="normal"
                {...regLogin('password', {
                  required: 'Пароль обязателен',
                  minLength: { value: 6, message: 'Мин. 6 символов' },
                })}
                error={!!loginErr.password}
                helperText={loginErr.password?.message}
                disabled={loading}
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3, py: 1.5 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
              >
                Войти
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={onRoomSubmit(onJoin)} noValidate sx={{ mt: 2 }}>
              <TextField
                label="Код комнаты"
                fullWidth
                margin="normal"
                {...regRoom('roomCode', { required: 'Код комнаты обязателен' })}
                error={!!roomErr.roomCode}
                helperText={roomErr.roomCode?.message}
                disabled={loading}
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3, py: 1.5 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
              >
                Войти
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginOrJoin;
