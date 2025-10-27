// src/pages/RoomJoin.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import AnimatedSubmitButton from "../components/ui/AnimatedSubmitButton";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  useTheme,
  TextField,
  Paper,
} from "@mui/material";

export type Room = { id: string; code: string; title?: string };

export function RoomJoin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pressedId, setPressedId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingList(true);
    api
      .get<Room[]>("/rooms")
      .then((res) => setRooms(res.data))
      .catch(() => setError("Не удалось загрузить список комнат"))
      .finally(() => setLoadingList(false));
  }, []);

  const createRoom = async () => {
    if (!title.trim()) {
      setError("Введите название комнаты");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const { data } = await api.post<Room>("/rooms", { title: title.trim() });
      setRooms((prev) => [...prev, data]);
      navigate(`/rooms/${data.code}`);
    } catch {
      setError("Не удалось создать комнату");
    } finally {
      setCreating(false);
    }
  };

  const handleEnterRoom = (room: Room) => {
    setPressedId(room.id);
    setTimeout(() => navigate(`/rooms/${room.code}`), 180);
  };

  // --- Карточка секции ---
  const Card: React.FC<React.PropsWithChildren<{ title: string }>> = ({
    title,
    children,
  }) => (
    <Paper
      elevation={0} // убираем белый фон/тень
      sx={{
        borderRadius: "20px",
        p: 3,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        transition: "background-color 0.3s ease, border-color 0.3s ease",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 2px 6px rgba(0,0,0,0.4)"
            : "0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      <Typography
        variant="h6"
        align="center"
        fontWeight={600}
        sx={{
          mb: 2,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );

  // --- Список комнат ---
   const RoomsList: React.FC = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {loadingList && (
        <Typography
          align="center"
          sx={{ color: theme.palette.text.secondary, py: 2 }}
        >
          Загрузка…
        </Typography>
      )}

      {!loadingList && rooms.length === 0 && (
        <Typography
          align="center"
          sx={{ color: theme.palette.text.secondary, py: 2 }}
        >
          Пока нет комнат.
        </Typography>
      )}

      {!loadingList &&
        rooms.map((r) => {
          const active = pressedId === r.id;
          const label = r.title || r.code;

          return (
            <AnimatedSubmitButton
              key={r.id}
              tone={active ? "primary" : "neutral"}
              activeRect={active}
              fullWidth
              onClick={() => handleEnterRoom(r)}
              sx={{
                justifyContent: "center",
                px: 2,
                py: 1.2,
                fontWeight: 600,
                borderRadius: "12px",
                backgroundColor: "transparent",
                boxShadow: "none",
                "&::before, &::after": { display: "none" },
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Typography>
            </AnimatedSubmitButton>
          );
        })}
    </Box>
  );

return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: 2.5, // ровно ~20px сверху/снизу
        minHeight: "calc(100vh - 64px)",
        backgroundColor: theme.palette.background.default,
        transition: "background-color 0.3s ease",
        display: "flex",
        alignItems: "center", // центрируем карточки по вертикали
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: isTeacher ? "1100px" : "700px",
          mx: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: isTeacher ? "1fr 1fr" : "1fr",
          },
          gap: 2.5,
        }}
      >
       {/* Список комнат */}
<Card title={isStudent ? "Мои комнаты" : "Ваши комнаты"}>
  {error && (
    <Typography color="error" sx={{ mb: 2 }}>
      {error}
    </Typography>
  )}
  <RoomsList />
</Card>

        {/* Создание комнаты */}
        {isTeacher && (
          <Card title="Создать новую комнату">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Название новой комнаты"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
                size="medium"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                }}
              />
              <AnimatedSubmitButton
                fullWidth
                loading={creating}
                onClick={createRoom}
                sx={{
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  "&::before, &::after": { display: "none" },
                }}
              >
                Создать комнату
              </AnimatedSubmitButton>
              <Typography
                variant="caption"
                align="center"
                sx={{
                  color: theme.palette.text.secondary,
                  opacity: 0.8,
                }}
              >
                Код комнаты будет сгенерирован автоматически.
              </Typography>
            </Box>
          </Card>
        )}
      </Box>
    </Box>
  );
}
