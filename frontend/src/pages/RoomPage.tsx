// src/pages/RoomPage.tsx
import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";
import { useAuth } from "../auth/AuthContext";
import EditMessageModal, {
  Attachment,
} from "../components/chat/EditMessageModal";
import { useParams } from "react-router-dom";
import copy from "copy-to-clipboard";
import { ChatWindow } from "../components/chat/ChatWindow";
import { useRoomSocket, RoomMessage } from "../hooks/useRoomSocket";
import { RoomHeader } from "../components/RoomHeader";
import { RoomSettingsModal } from "../components/RoomSettingsModal";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";

import { ExpandMore, Add } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import { StudentsSidebar } from "../components/rooms/StudentsSidebar";
import { MessageComposer } from "../components/chat/MessageComposer";

import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Button,
} from "@mui/material";
import { EditOutlined, DeleteOutline } from "@mui/icons-material";

import "react-quill/dist/quill.snow.css";

interface RoomInfo {
  id: string;
  code: string;
  title: string;
  ownerId: string;
  bgColor: string;
}

interface RoomSettings {
  title: string;
  bgColor: string;
}

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  if (!code) return null;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragCounter, setDragCounter] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [editingMessage, setEditingMessage] = useState<RoomMessage | null>(
    null
  );
  const [editText, setEditText] = useState("");
  const [editRemoveIds, setEditRemoveIds] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

const [chatSessions, setChatSessions] = useState<
  { id: string; student?: { id: string; email: string } }[]
>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showChat, setShowChat] = useState(false);

  const [codeOverlayOpen, setCodeOverlayOpen] = useState(false);

  // раскрыт ли композер в "материалах"
  const [composerOpen, setComposerOpen] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);

  // настройки комнаты (название / цвет)
  const [settings, setSettings] = useState<RoomSettings>({
    title: "",
    bgColor: "#FFFFFF",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // === заголовок / кнопки шапки ===
  const handleEdit = () => setSettingsOpen(true);

  const handleFullscreen = () => {
    setCodeOverlayOpen(true);
  };

const handleChat = () => {
  setShowChat((v) => {
    const next = !v;
    setIsChatOpen(next); // 🟢 синхронизация с RoomHeader
    if (next) setComposerOpen(false);
    return next;
  });
};

  // esc закрывает оверлей кода
  useEffect(() => {
    if (!codeOverlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCodeOverlayOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [codeOverlayOpen]);

  // === WebSocket сообщений комнаты ===
  const { messages, setMessages, socket } = useRoomSocket({
    code,
    onError: console.error,
  });

  // === Запрос общей инфы о комнате ===
  const { data: info } = useQuery<RoomInfo, Error>({
    queryKey: ["roomInfo", code],
    queryFn: () => api.get<RoomInfo>(`/rooms/${code}`).then((r) => r.data),
    enabled: !!code,
  });

  // === История сообщений материалов ===
  const { data: queriedMessages } = useQuery<RoomMessage[], Error>({
    queryKey: ["roomMessages", code],
    queryFn: () =>
      api
        .get<{ messages: RoomMessage[] }>(`/rooms/${code}`)
        .then((res) => res.data.messages.reverse()),
  });

  const roomTitle = info?.title ?? code!;

  useEffect(() => {
    if (info)
      setSettings({
        title: info.title,
        bgColor: info.bgColor,
      });
  }, [info]);

  // === Сохранение настроек комнаты ===
  const saveSettings = useMutation<{ bgColor: string }, Error, RoomSettings>({
    mutationFn: async (newSettings: RoomSettings): Promise<{ bgColor: string }> =>
      api
        .patch<{ bgColor: string; title: string }>(
          `/rooms/${code}/settings`,
          newSettings
        )
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomInfo", code] });
      setSettingsOpen(false);
    },
  });

  // === применяем загруженные сообщения
  useEffect(() => {
    if (queriedMessages) setMessages(queriedMessages);
  }, [queriedMessages, setMessages]);

  // === для ученика: получить /rooms/:code/chats (его персональная сессия)
  useEffect(() => {
    if (!isStudent) return;
    api
      .get<{ id: string }>(`/rooms/${code}/chats`)
      .then((r) => {
        setChatSessionId(r.data.id);
        setUnreadCounts((u) => ({ ...u, [r.data.id]: 0 }));
      })
      .catch(console.error);
  }, [isStudent, code]);

  // === для учителя: список чатов, непрочитанные
  useEffect(() => {
    if (!isTeacher || !showChat) return;
    api
      .get(`/rooms/${code}/chats`)
      .then((r) => setChatSessions(r.data))
      .catch(console.error);

    api
      .get(`/rooms/${code}/unread-counts`)
      .then((r) => setUnreadCounts(r.data))
      .catch(console.error);
  }, [isTeacher, showChat, code]);

  // === DnD при перетаскивании файлов в область материалов ===
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((c) => c + 1);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((c) => c - 1);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(0);
      const dropped = Array.from(e.dataTransfer?.files || []);
      setFiles((prev) => [...prev, ...dropped]);
    };

    el.addEventListener("dragenter", onDragEnter);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);

    return () => {
      el.removeEventListener("dragenter", onDragEnter);
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [files]);

  // === Отправка нового материала ===
  const addMessage = useMutation<unknown, Error, FormData>({
    mutationFn: (fd: FormData) => api.post(`/rooms/${code}/messages`, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomMessages", code] });
    },
    onError: () => alert("Ошибка отправки"),
  });

  const sendMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text && files.length === 0) return;

    const fd = new FormData();
    if (text) fd.append("text", text);
    files.forEach((f) => fd.append("file", f));

    addMessage.mutate(fd);

    setText("");
    setFiles([]);
  };

  // === Редактирование имеющегося сообщения ===
  const onStartEdit = (m: RoomMessage) => {
    setEditingMessage(m);
    setEditText(m.text ?? "");
    setEditRemoveIds([]);
    setEditNewFiles([]);
  };

  const onSaveEdit = async () => {
    if (!editingMessage) return;
    const fd = new FormData();
    fd.append("text", editText);
    editRemoveIds.forEach((id) => fd.append("removeAttachmentIds", id));
    editNewFiles.forEach((f) => fd.append("file", f));

    try {
      const updated: RoomMessage = (
        await api.patch(`/rooms/${code}/messages/${editingMessage.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;

      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );

      if (socket) socket.emit("messageEdited", updated);

      setEditingMessage(null);
    } catch {
      alert("Не удалось обновить сообщение");
    }
  };

  const onDelete = (id: string) => {
    if (!window.confirm("Подтвердить удаление?")) return;
    api
      .delete(`/rooms/${code}/messages/${id}`)
      .then(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (socket)
          socket.emit("deleteMessage", { roomCode: code, messageId: id });
      })
      .catch(() => alert("Не удалось удалить сообщение"));
  };


  // 🔹 Просмотр изображений
const [imagePreview, setImagePreview] = useState<string | null>(null);

useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") setImagePreview(null);
  };
  window.addEventListener("keydown", handleEsc);
  return () => window.removeEventListener("keydown", handleEsc);
}, []);

// === Список учеников для боковой панели ===
  const [students, setStudents] = useState<{ id: string; email: string }[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

const handleSelectStudent = (studentId: string) => {
  setActiveStudentId(studentId);

  // ищем сессию по student.id
  const selected = chatSessions.find((s) => s.student?.id === studentId);

  if (selected) {
    console.log("Открываю чат с:", selected.student?.email);
    setChatSessionId(selected.id);
    setUnreadCounts((u) => ({ ...u, [selected.id]: 0 }));
  } else {
    console.warn("Не найден чат для студента:", studentId);
  }
};

  // Загружаем список учеников, если это учитель
useEffect(() => {
  if (!isTeacher) return;

  api
    .get(`/rooms/${code}/chats`)
    .then((r) => {
      setChatSessions(r.data);
      const list = (r.data || [])
        .filter((s: any) => s.student)
        .map((s: any) => ({
          id: s.student.id,
          email: s.student.email,
        }));
      setStudents(list);
    })
    .catch(console.error);
}, [isTeacher, code]);

useEffect(() => {
  // Блокируем скролл body при монтировании
  document.body.style.overflow = "hidden";
  return () => {
    // Возвращаем скролл при размонтировании
    document.body.style.overflow = "";
  };
}, []);

  // ---------------- RENDER -----------------
  

return (
  <Box
    sx={{
      position: "fixed",           // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ!
      top: "60px",  
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      transition: "background-color 0.3s ease, color 0.3s ease",
    }}
  >
    {/* Отступ сверху */}
    <Box sx={{ height: "30px", flexShrink: 20 }} />

    {/* ШАПКА КОМНАТЫ */}
    <Box sx={{ flexShrink: 0 }}>
      <RoomHeader
        name={info?.title ?? code!}
        code={code!}
        onEdit={handleEdit}
        onFullscreen={handleFullscreen}
        onChat={handleChat}
        bgColor={settings.bgColor}
        compact={showChat}
        isTeacher={isTeacher}
        isChatOpen={isChatOpen}
      />
    </Box>

    {/* Композер под шапкой */}
    {isTeacher && !showChat && (
      <Box sx={{ mt: 3, mx: { xs: 2, md: 3 }, flexShrink: 0 }}>
        <MessageComposer
          open={composerOpen}
          setOpen={setComposerOpen}
          value={text}
          onChange={setText}
          onSubmit={() => {
            const fd = new FormData();
            if (text) fd.append("text", text);
            files.forEach((f) => fd.append("file", f));
            addMessage.mutate(fd);
            setText("");
            setFiles([]);
            setComposerOpen(false);
          }}
          files={files}
          setFiles={setFiles}
          placeholder="Введите сообщение..."
          submitLabel="Отправить"
        />
      </Box>
    )}

    {/* Основной контент */}
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showChat ? (
        // ===================== ЧАТ =====================
        <Box
          sx={{
            flex: 1,
            minHeight: 0,           // ✅ критично
            overflow: "hidden",     // ✅ скролл только внутри ChatWindow
            px: { xs: 2, md: 3 },
            pb: 2,
            display: "flex",
            flexDirection: "column",
            mt: 2.5,
          }}
        >
          {/* Основной flex для панели и чата */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              gap: 2,
            }}
          >
            {/* Боковая панель */}
            {isTeacher && (
              <StudentsSidebar
                students={students}
                onSelectStudent={handleSelectStudent}
                currentStudentId={activeStudentId ?? undefined}
              />
            )}

            {/* Окно чата */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,       // ✅ критично
                minWidth: 0,
                borderRadius: "20px",
                backgroundColor: theme.palette.background.paper,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 2px 8px rgba(0,0,0,0.6)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {chatSessionId ? (
                <ChatWindow
                  sessionId={chatSessionId}
                  setUnreadCounts={setUnreadCounts}
                />
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    color: theme.palette.text.secondary,
                    fontSize: "0.9rem",
                  }}
                >
                  Выберите чат
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        // ===================== МАТЕРИАЛЫ =====================
        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            minHeight: 0,
            px: { xs: 2, md: 3 },
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",      // ✅ запрещаем скролл контейнера
          }}
        >
          {/* drag overlay */}
          {dragCounter > 0 && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "20px",
                bgcolor: "rgba(0,0,0,0.4)",
                border: `2px dashed ${theme.palette.primary.main}`,
                color: theme.palette.primary.contrastText,
                fontSize: "1.1rem",
                fontWeight: 500,
              }}
            >
              Перетащите файлы сюда
            </Box>
          )}

          {/* список материалов - СКРОЛЛИРУЕМЫЙ */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",    // ✅ скролл ТОЛЬКО здесь
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 3,
              pb: 3,
            }}
          >
              {messages
                .slice()
                .reverse()
                .map((m) => (
                  <Paper
                    key={m.id}
                    elevation={1}
                    sx={{
                      position: "relative",
                      p: 3,
                      borderRadius: "20px",
                      backgroundColor: theme.palette.background.paper,
                    
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 2px 8px rgba(0,0,0,0.6)"
                          : "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* метаданные сообщения */}
                    <Typography
                      variant="caption"
                      sx={{
                        mb: 1.5,
                        display: "block",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {(m.author?.email || "Гость") +
                        " — " +
                        new Date(m.createdAt).toLocaleString()}
                    </Typography>

                    {/* текст сообщения */}
                    {m.text && (
                      <Box
                        sx={{
                          mb: 1.5,
                          color: theme.palette.text.primary,
                          fontSize: "0.95rem",
                          lineHeight: 1.45,
                          wordBreak: "break-word",
                          "& a": {
                            color: theme.palette.primary.main,
                            textDecoration: "underline",
                          },
                        }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(m.text),
                        }}
                      />
                    )}

                    {/* вложения */}
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {m.attachments?.map((att) => {
                        const url = `http://localhost:3001/uploads/${att.url}`;
                        const ext = att.url.split(".").pop()!.toLowerCase();
                        const isImg = [
                          "png",
                          "jpg",
                          "jpeg",
                          "gif",
                          "webp",
                        ].includes(ext);

                        return (
                          <Box
                            key={att.id}
                            onClick={() => setImagePreview(url)}
                            sx={{
                              display: "inline-block",
                              cursor: "zoom-in",
                              "&:hover img": {
                                transform: "scale(1.03)",
                              },
                              transition: "transform 0.2s ease",
                            }}
                          >
                            {isImg ? (
                              <Box<'img'>
                                component="img"
                                src={url}
                                alt={decodeURIComponent(att.url)}
                                sx={{
                                  maxHeight: 192,
                                  maxWidth: "100%",
                                  borderRadius: "12px",
                                  border: `1px solid ${theme.palette.divider}`,
                                  cursor: "zoom-in",
                                  transition: "transform 0.25s ease",
                                }}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.palette.primary.main,
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                  wordBreak: "break-all",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                📄 {decodeURIComponent(att.url)}
                              </Typography>
                            )}


                          </Box>
                        );
                      })}
                    </Box>

                    {/* кнопки редактирования/удаления (только если автор = текущий пользователь) */}
                    {m.author?.id === user?.id && !editingMessage && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          display: "flex",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Редактировать">
                          <IconButton
                            size="small"
                            onClick={() => onStartEdit(m)}
                            sx={{
                              color: theme.palette.text.secondary,
                              "&:hover": {
                                backgroundColor:
                                  theme.palette.action.hover,
                              },
                            }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Удалить">
                          <IconButton
                            size="small"
                            onClick={() => onDelete(m.id)}
                            sx={{
                              color: theme.palette.error.main,
                              "&:hover": {
                                backgroundColor:
                                  theme.palette.action.hover,
                              },
                            }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Paper>
                ))}
              <div ref={bottomRef} />
            </Box>


            {/* FAB — только для учителя, только в материалах, только если композер закрыт */}

          </Box>
        )}
      </Box>

      {/* Модалка редактирования сообщения */}
      {editingMessage && (
        <EditMessageModal
          messageId={editingMessage.id}
          initialText={editText}
          existingAttachments={editingMessage.attachments || []}
          removeIds={editRemoveIds}
          newFiles={editNewFiles}
          onTextChange={setEditText}
          onToggleRemove={(id) =>
            setEditRemoveIds((ids) =>
              ids.includes(id)
                ? ids.filter((x) => x !== id)
                : [...ids, id]
            )
          }
          onAddNewFiles={(newAdded) =>
            setEditNewFiles((prev) => [...prev, ...newAdded])
          }
          onClose={() => setEditingMessage(null)}
          onSave={onSaveEdit}
        />
      )}

      {/* === Модальное окно просмотра изображения === */}
{imagePreview && (
  <Box
    onClick={() => setImagePreview(null)}
    sx={{
      position: "fixed",
      inset: 0,
      zIndex: 1300,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "zoom-out",
      p: 3,
      backdropFilter: "blur(3px)",
      animation: "fadeIn 0.3s ease",
      "@keyframes fadeIn": {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    }}
  >
    <Box
      component={"img" as React.ElementType}
      src={imagePreview}
      alt="preview"
      sx={{
        maxWidth: "95%",
        maxHeight: "90vh",
        borderRadius: "16px",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 0 30px rgba(0,0,0,0.8)"
            : "0 0 30px rgba(0,0,0,0.3)",
        transition: "transform 0.3s ease",
        transform: "scale(1)",
        "&:hover": { transform: "scale(1.02)" },
        cursor: "zoom-out",
      }}
    />
  </Box>
)}
    </Box>
  );
}
