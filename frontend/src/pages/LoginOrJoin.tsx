// src/pages/LoginOrJoin.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { useForm } from 'react-hook-form';
import AnimatedSubmitButton from '../components/ui/AnimatedSubmitButton';
import ExpressiveSegmentedTabs from '../components/ui/ExpressiveSegmentedTabs';

type FormLogin = { email: string; password: string };
type FormRoom  = { roomCode: string };

const spring: import('framer-motion').Spring = { stiffness: 700, damping: 30, mass: 0.7 };

// делаем анимируемую карточку
const MotionCard = motion(Card);

const LoginOrJoin: React.FC = () => {
  const theme = useTheme();
  const { login, loginWithRoom } = useAuth();
  const [mode, setMode]       = useState<'login' | 'room'>('login');
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
    try { await login(data.email, data.password); }
    catch (e: any) {
      setError(e?.response?.data?.message || 'Ошибка входа');
    } finally { setLoading(false); }
  };

  const onJoin = async (data: FormRoom) => {
    setError(null); setLoading(true);
    try { await loginWithRoom(data.roomCode); }
    catch (e: any) {
      setError(
        e?.response?.status === 404
          ? 'Комната не найдена'
          : e?.response?.data?.message || 'Ошибка входа'
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
      {/* Карточка по центру и сама анимирует изменение высоты */}
        <MotionCard
          layout="size"
          transition={{
            // более "экспрессивная" пружина для изменения размеров карточки
            layout: {
              type: 'spring',
              stiffness: 180,   // ниже — мягче
              damping: 10,      // ниже — больше отскок
              mass: 0.75,
              restDelta: 0.02, // чтобы аккуратно «прилипала» в конце
            },
          }}
          elevation={4}
          sx={{
            maxWidth: 400,
            width: '100%',
            mx: 'auto',
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          }}
          style={{ willChange: 'height', contain: 'layout paint' }}
        >
          <motion.div
            layout
            transition={{
              layout: {
                type: 'spring',
                stiffness: 280,
                damping: 18,
                mass: 0.75,
              },
            }}
            style={{ overflow: 'hidden' }}
          >
            <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Добро пожаловать в Cubit
          </Typography>

          {/* Переключатель режимов со скользящей “пилюлей” */}
            <ExpressiveSegmentedTabs
            value={mode}
            onChange={(k) => { setMode(k as typeof mode); setError(null); }}
            options={[
              { key: 'login' as const, label: 'По паролю' },
              { key: 'room'  as const, label: 'По коду' },
            ]}
            gap={1}
            size="md"
            sx={{ mt: 1.5 , mb: 1 }}
          />

          {/* Меняем формы, высота карточки анимируется благодаря layout на MotionCard */}
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'login' ? (
                  <motion.div
                    key="login-form"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'tween', duration: 0.18 }}
                  >
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

                  <AnimatedSubmitButton
                    type="submit"
                    size="large"
    
                    fullWidth
                    loading={loading}
                    sx={{ mt: 3 }}
                  >
                    Войти
                  </AnimatedSubmitButton>
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key="room-form"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'tween', duration: 0.18 }}
              >
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

                  <AnimatedSubmitButton
                    type="submit"
                    size="large"
                    fullWidth
                    loading={loading}
                    sx={{ mt: 3 }}
                  >
                    Войти
                  </AnimatedSubmitButton>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        </motion.div>
      </MotionCard>
    </Box>
  );
};

export default LoginOrJoin;
