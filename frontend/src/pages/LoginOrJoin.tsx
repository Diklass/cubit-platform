// src/pages/LoginOrJoin.tsx
import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "../auth/AuthContext";
import AnimatedSubmitButton from "../components/ui/AnimatedSubmitButton";
import ExpressiveSegmentedTabs from "../components/ui/ExpressiveSegmentedTabs";
import logo from "../assets/logo.svg";
import CubitLogo from "../assets/logo.svg?react";

type FormLogin = { email: string; password: string };
type FormRoom = { roomCode: string };

const MotionCard = motion(Card);

const LoginOrJoin: React.FC = () => {
  const theme = useTheme();
  const { login, loginWithRoom } = useAuth();
  const [mode, setMode] = useState<"login" | "room">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);

  const isDark = theme.palette.mode === "dark";


 // 🎨 тот же градиент, что на Dashboard
useEffect(() => {
  const newColors = isDark
    ? [
        "#0F5699", "#500F66",
        "#0F5699", "#66210A",
        "#0F5699", "#0A6647",
      ]
    : [
        "#91C3F2", "#E9CEF2",
        "#91C3F2", "#F2D7CE",
        "#91C3F2", "#CEF2E6",
      ];
  setColors(newColors);
}, [isDark]);

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
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const onJoin = async (data: FormRoom) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithRoom(data.roomCode);
    } catch (e: any) {
      setError(
        e?.response?.status === 404
          ? "Комната не найдена"
          : e?.response?.data?.message || "Ошибка входа"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
    {/* 🌈 Анимированный фон как в Dashboard */}
<motion.div
  key={isDark ? "dark" : "light"}
  className="fixed inset-0"
  style={{
    zIndex: 0,
    pointerEvents: "none",
    backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "300% 300%",
  }}
  initial={{ opacity: 0 }}
  animate={{
    opacity: 1,
    backgroundPosition: [
      "0% 0%",
      "50% 50%",
      "100% 100%",
      "50% 50%",
      "0% 0%",
    ],
  }}
  transition={{
    opacity: { duration: 1.5, ease: "easeOut" },
    backgroundPosition: {
      duration: 35,
      ease: "linear",
      repeat: Infinity,
    },
  }}
/>

    {/* 🔅 Виньетка */}
<div
  className="fixed inset-0"
  style={{
    zIndex: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(ellipse 1100px 700px at 50% 35%, rgba(0,0,0,0.1), rgba(0,0,0,0.4))",
    mixBlendMode: isDark ? "normal" : "multiply",
    opacity: isDark ? 0.6 : 0.35,
    transition: "opacity 1.2s ease-in-out",
  }}
/>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          width: "100%",
          maxWidth: 440,
          mx: "auto",
          px: 2,
        }}
      >
  {/* 🌟 Логотип и название поближе */}
<div className="flex items-center gap-3 z-10 mb-4 mt-4 select-none justify-center">
  <motion.div
    initial={{ scale: 0, rotate: -90, opacity: 0 }}
    animate={{ scale: 1, rotate: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 120, damping: 12, duration: 1.2 }}
    whileHover={{ scale: 1.05, rotate: [0, -4, 4, 0] }}
    className="w-[95px] h-[95px] drop-shadow-lg flex items-center justify-center"
  >
    <CubitLogo
      style={{
        width: "100%",
        height: "100%",
        color: isDark ? "#90caf9" : "#1976d2",
        transition: "color .3s ease-in-out",
      }}
    />
  </motion.div>

  <motion.span
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.25, duration: 0.6 }}
    style={{
      fontSize: "3.1rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.primary.main,
      textShadow: "0 2px 10px rgba(0,0,0,0.15)",
    }}
  >
    Cubit
  </motion.span>
</div>

    

        {/* 💡 карточка формы */}
        <MotionCard
          layout="size"
          elevation={6}
          transition={{
            layout: {
              type: "spring",
              stiffness: 180,
              damping: 14,
              mass: 0.8,
            },
          }}
          sx={{
            borderRadius: 3,                               // ~24px, можешь поставить 12, если нужно строго
    bgcolor: theme.palette.mode === "dark" ? "#000000" : "#FFFFFF", // ⬅ ЧИСТЫЕ цвета
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 6px 28px rgba(0,0,0,0.6)"
        : "0 6px 28px rgba(0,0,0,0.12)",
    overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <ExpressiveSegmentedTabs
              value={mode}
              onChange={(k) => {
                setMode(k as typeof mode);
                setError(null);
              }}
              options={[
                { key: "login" as const, label: "По паролю" },
                { key: "room" as const, label: "По коду" },
              ]}
              size="md"
              gap={2}
              sx={{ mb: 2 }}
            />

            <AnimatePresence mode="wait" initial={false}>
              {mode === "login" ? (
                <motion.div
                  key="login-form"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "tween", duration: 0.2 }}
                >
                  <form onSubmit={onLoginSubmit(onLogin)} noValidate style={{ marginTop: 16 }}>
                    <TextField
                      label="Email"
                      fullWidth
                      margin="normal"
                      {...regLogin("email", {
                        required: "Email обязателен",
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Неверный формат",
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
                      {...regLogin("password", {
                        required: "Пароль обязателен",
                        minLength: { value: 6, message: "Мин. 6 символов" },
                      })}
                      error={!!loginErr.password}
                      helperText={loginErr.password?.message}
                      disabled={loading}
                    />
                    {error && (
                      <Typography
                        color="error"
                        variant="body2"
                        sx={{ mt: 1, textAlign: "left" }}
                      >
                        {error}
                      </Typography>
                    )}
                    <AnimatedSubmitButton
                      type="submit"
                      fullWidth
                      loading={loading}
                      sx={{ mt: 3 }}
                    >
                      Войти
                    </AnimatedSubmitButton>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="room-form"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "tween", duration: 0.2 }}
                >
                  <form onSubmit={onRoomSubmit(onJoin)} noValidate style={{ marginTop: 16 }}>
                    <TextField
                      label="Код комнаты"
                      fullWidth
                      margin="normal"
                      {...regRoom("roomCode", {
                        required: "Код комнаты обязателен",
                      })}
                      error={!!roomErr.roomCode}
                      helperText={roomErr.roomCode?.message}
                      disabled={loading}
                    />
                    {error && (
                      <Typography
                        color="error"
                        variant="body2"
                        sx={{ mt: 1, textAlign: "left" }}
                      >
                        {error}
                      </Typography>
                    )}
                    <AnimatedSubmitButton
                      type="submit"
                      fullWidth
                      loading={loading}
                      sx={{ mt: 3 }}
                    >
                      Войти
                    </AnimatedSubmitButton>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </MotionCard>
      </Box>
    </Box>
  );
};

export default LoginOrJoin;
