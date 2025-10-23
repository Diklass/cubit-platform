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

  // 🎨 градиент из Dashboard
  useEffect(() => {
    const newColors = isDark
      ? ["#0E1A2B", "#12365C", "#1D5BAF", "#3C96EF"]
      : ["#E8F4FF", "#BFDFFF", "#6BB6FF", "#3C96EF"];
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
      {/* 🌈 фон — плавно анимированный градиент */}
      <motion.div
        key={isDark ? "dark" : "light"}
        className="fixed inset-0"
        style={{
          zIndex: 0,
          background: `linear-gradient(120deg, ${colors.join(", ")})`,
          backgroundSize: "400% 400%",
          pointerEvents: "none",
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 25,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* 🔅 виньетка для читаемости */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(900px 600px at 50% 40%, rgba(0,0,0,0.25), rgba(0,0,0,0.55))",
          opacity: isDark ? 0.5 : 0.35,
          mixBlendMode: isDark ? "normal" : "multiply",
          zIndex: 0,
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
        {/* 🌟 логотип */}
        <motion.img
          src={logo}
          alt="Cubit Logo"
          initial={{ scale: 0, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
          className="w-[100px] h-[100px] mb-4 select-none drop-shadow-lg mx-auto"
        />

        {/* 👋 приветствие */}
        <motion.h1
          className="text-4xl font-extrabold tracking-tight mb-4"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            color: theme.palette.mode === "dark" ? "#FFFFFF" : "#111827",
          }}
        >
          Добро пожаловать в Cubit{" "}
          <motion.span
            initial={{ rotate: 0 }}
            animate={{
              rotate: [0, 15, -10, 15, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 6,
              ease: "easeInOut",
            }}
            style={{ display: "inline-block", transformOrigin: "70% 70%" }}
          >
            👋
          </motion.span>
        </motion.h1>

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
