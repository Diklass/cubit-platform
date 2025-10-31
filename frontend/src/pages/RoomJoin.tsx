import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  IconButton,
  Modal,
  TextField,
  Button,
  Divider,
  useTheme,
} from "@mui/material";
import { Add, DeleteOutline, EditOutlined } from "@mui/icons-material";

export type Room = { id: string; code: string; title?: string };

export function RoomJoin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get<Room[]>("/rooms");
      setRooms(data);
    } catch {
      setError("Не удалось загрузить список комнат");
    } finally {
      setLoadingList(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        // ✏️ Обновляем существующую комнату
        await api.patch(`/rooms/${editing.id}`, { title: title.trim() });
        setRooms((prev) =>
          prev.map((r) =>
            r.id === editing.id ? { ...r, title: title.trim() } : r
          )
        );
      } else {
        // ➕ Создаём новую комнату
        const { data } = await api.post<Room>("/rooms", { title: title.trim() });
        setRooms((prev) => [...prev, data]);
        navigate(`/rooms/${data.code}`);
      }
      setOpenModal(false);
      setTitle("");
      setEditing(null);
    } catch {
      setError("Ошибка при сохранении комнаты");
    } finally {
      setSaving(false);
    }
  };

  const saveRoom = async () => {
  if (!title.trim()) return;
 setSaving(true);
  try {
    if (editingRoom) {
      const { data } = await api.patch<Room>(`/rooms/${editingRoom.id}`, { title: title.trim() });
      setRooms(prev => prev.map(r => (r.id === data.id ? data : r)));
    } else {
      const { data } = await api.post<Room>("/rooms", { title: title.trim() });
      setRooms(prev => [...prev, data]);
      navigate(`/rooms/${data.code}`);
    }
    setOpenModal(false);
    setTitle("");
    setEditingRoom(null);
  } catch {
    setError(editingRoom ? "Не удалось сохранить комнату" : "Не удалось создать комнату");
  } finally {
   setSaving(false);
  }
};

const handleEditRoom = (room: Room) => {
  setEditingRoom(room);
  setTitle(room.title || "");
  setOpenModal(true);
};


  const handleEnterRoom = (room: Room) => {
    navigate(`/rooms/${room.code}`);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Удалить комнату?")) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch {
      alert("Ошибка при удалении комнаты");
    }
  };

  const openEditModal = (room: Room) => {
    setEditing(room);
    setTitle(room.title || "");
    setOpenModal(true);
  };

  const openCreateModal = () => {
    setEditing(null);
    setTitle("");
    setOpenModal(true);
  };

  return (
    <Box
      sx={{
        px: "20px",
        pt: "calc(0px + var(--appbar-offset, 0px))",
        pb: "40px",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "background-color 0.3s ease",
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          my: "20px",
          color: theme.palette.text.primary,
        }}
      >
        {isStudent ? "Мои комнаты" : "Ваши комнаты"}
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loadingList ? (
        <Typography align="center" sx={{ mt: 4 }}>
          Загрузка…
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
         {rooms.map((room) => (
  <Card
    key={room.id}
    elevation={2}
    sx={{
      borderRadius: "16px",
      height: 200,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      transition: "transform .2s, box-shadow .2s, background-color .3s",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: theme.shadows[6],
        backgroundColor: theme.palette.action.hover,
      },
      // 📐 фиксируем layout как у карточек предметов
      display: "grid",
      gridTemplateRows: "1fr auto auto",
    }}
  >
    {/* Верх — название (занимает всё свободное) */}
    <CardActionArea
      onClick={() => handleEnterRoom(room)}
      sx={{
        gridRow: "1 / 2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <CardContent sx={{ py: 2, width: "100%" }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: ".5px",
            fontSize: "clamp(22px, 4vw, 36px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
            color: theme.palette.text.primary,
            textAlign: "center",
          }}
          title={room.title || room.code}
        >
          {room.title || room.code}
        </Typography>
        {/* 🔕 убрали отображение кода под названием */}
      </CardContent>
    </CardActionArea>

    {/* Разделитель — тонкая строка */}
    {isTeacher && <Divider sx={{ gridRow: "2 / 3" }} />}

    {/* Низ — компактная панель кнопок */}
    {isTeacher && (
      <Box
        sx={{
          gridRow: "3 / 4",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: 1.5,
          py: 0.75,          // компактнее
          gap: 0.5,
          minHeight: 44,      // как у карточек предметов
        }}
      >
        <IconButton
          color="primary"
          size="small"
          onClick={() => handleEditRoom(room)}
        >
          <svg
            width="24" height="24" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/>
          </svg>
        </IconButton>
        <IconButton
          color="error"
          size="small"
          onClick={() => handleDeleteRoom(room.id)}
        >
          <DeleteOutline />
        </IconButton>
      </Box>
    )}
  </Card>
))}


          {isTeacher && (
            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "center",
                mt: 2,
              }}
            >
              <Card
                elevation={3}
                onClick={openCreateModal}
                sx={{
                  borderRadius: "16px",
                  height: 200,
                  width: "100%",
                  maxWidth: 380,
                  minWidth: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition:
                    "transform .25s, box-shadow .25s, background-color .25s",
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.primary.main,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[4],
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Add sx={{ fontSize: 64, fontWeight: 300 }} />
              </Card>
            </Box>
          )}
        </Box>
      )}

      {/* === Модалка создания/редактирования === */}
      <Modal open={openModal} onClose={() => { setOpenModal(false); setEditingRoom(null); }}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.shadows[8],
            borderRadius: "16px",
            p: 4,
            width: 400,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
      {editingRoom ? "Редактировать комнату" : "Новая комната"}
    </Typography>
    <TextField
      label="Название комнаты"
      fullWidth
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
      <Button variant="outlined" onClick={() => { setOpenModal(false); setEditingRoom(null); }}>
        Отмена
      </Button>
      <Button variant="contained" onClick={saveRoom} disabled={saving}>
        {editingRoom ? "Сохранить" : "Создать"}
      </Button>
    </Box>
  </Box>
      </Modal>
    </Box>
  );
}
