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

import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
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
    { id: string; student?: { email: string } }[]
  >([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showChat, setShowChat] = useState(false);

  const [codeOverlayOpen, setCodeOverlayOpen] = useState(false);

  // раскрыт ли композер в "материалах"
  const [composerOpen, setComposerOpen] = useState(false);

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
      if (next) {
        // если уходим в чат — сворачиваем композер, как ты хотел
        setComposerOpen(false);
      }
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

  // ---------------- RENDER -----------------

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "background-color 0.3s ease, color 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* небольшой отступ сверху как на других страницах */}
      <Box sx={{ mt: "30px" }} />

      {/* ШАПКА КОМНАТЫ (RoomHeader твой, логика не менялась) */}
      <RoomHeader
        name={info?.title ?? code!}
        code={code!}
        onEdit={handleEdit}
        onFullscreen={handleFullscreen}
        onChat={handleChat}
        bgColor={settings.bgColor}
        compact={showChat}
        isTeacher={isTeacher}
      />

      {/* Модалка "код комнаты" (полноэкранный показ кода) */}
      {codeOverlayOpen && (
        <Box
          onClick={() => setCodeOverlayOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Paper
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
            sx={{
              borderRadius: "20px",
              p: 4,
              maxWidth: 720,
              width: "100%",
              textAlign: "center",
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 12px 32px rgba(0,0,0,0.8)"
                  : "0 12px 32px rgba(0,0,0,0.16)",
            }}
          >
            <Typography
              sx={{
                mb: 2,
                fontSize: "1rem",
                fontWeight: 500,
                opacity: 0.8,
                color: theme.palette.text.secondary,
              }}
            >
              Код курса
            </Typography>

            <Box
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: "0.08em",
                wordBreak: "break-all",
                userSelect: "all",
                fontSize: "clamp(28px,8vw,72px)",
                color: theme.palette.text.primary,
              }}
            >
              {code}
            </Box>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Box<'button'>
                component="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(code);
                    alert("✅ Код скопирован в буфер обмена");
                  } catch {
                    alert("❌ Не удалось скопировать");
                  }
                }}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: "24px",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  border: "none",
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                Скопировать
              </Box>

              <Box<'button'>
                component="button"
                onClick={() => setCodeOverlayOpen(false)}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: "24px",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  border: "none",
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: theme.palette.action.selected,
                  },
                }}
              >
                Закрыть
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Модалка настроек комнаты */}
      <RoomSettingsModal
        initial={settings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={(newSettings) => {
          saveSettings.mutate({
            title: newSettings.title,
            bgColor: newSettings.bgColor,
          });
        }}
      />

      {/* Основной контент: ЧАТ либо МАТЕРИАЛЫ */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          pb: 0, // композер сам нависает fixed внизу
        }}
      >
        {showChat ? (
          // ===================== ЧАТ =====================
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              px: { xs: 2, md: 3 },
              pb: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                gap: 2,
              }}
            >
              {/* список сессий (только для учителя) */}
              {isTeacher && (
                <Box
                  sx={{
                    width: { xs: "40%", md: "30%", lg: "28%" },
                    minWidth: 220,
                    maxWidth: 320,
                    borderRadius: "20px",
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 2px 8px rgba(0,0,0,0.6)"
                        : "0 2px 8px rgba(0,0,0,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                      mb: 1.5,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Ученики
                  </Typography>

                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {chatSessions.map((s) => (
                      <Box
                        key={s.id}
                        onClick={() => {
                          setChatSessionId(s.id);
                          setUnreadCounts((u) => ({
                            ...u,
                            [s.id]: 0,
                          }));
                        }}
                        sx={{
                          cursor: "pointer",
                          px: 2,
                          py: 1.5,
                          borderRadius: "12px",
                          border: `1px solid ${theme.palette.divider}`,
                          backgroundColor:
                            s.id === chatSessionId
                              ? theme.palette.action.selected
                              : theme.palette.background.paper,
                          "&:hover": {
                            backgroundColor:
                              s.id === chatSessionId
                                ? theme.palette.action.selected
                                : theme.palette.action.hover,
                          },
                          position: "relative",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          {s.student?.email}
                        </Typography>

                        {unreadCounts[s.id] > 0 && (
                          <Box
                            component="span"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 8,
                              height: 8,
                              borderRadius: "9999px",
                              backgroundColor: theme.palette.error.main,
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Окно чата */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: "20px",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 2px 8px rgba(0,0,0,0.6)"
                      : "0 2px 8px rgba(0,0,0,0.08)",
                  minHeight: 0,
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
              pb: 8, // место под плавающий композер
              position: "relative",
              display: "flex",
              flexDirection: "column",
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

            {/* список материалов */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                pt: 3,
                pb: 10, // дополнительный отступ над FAB
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
                      border: `1px solid ${theme.palette.divider}`,
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
                          <a
                            key={att.id}
                            href={url}
                            download
                            style={{ display: "inline-block" }}
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
                                  cursor: "pointer",
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
                          </a>
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
            {isTeacher && !showChat && !composerOpen && (
              <Box<'button'>
                component="button"
                onClick={() => setComposerOpen(true)}
                aria-label="Открыть отправку сообщения"
                title="Отправить сообщение"
                sx={{
                  position: "fixed",
                  right: 24,
                  bottom: 24,
                  zIndex: 30,
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontSize: "2rem",
                  fontWeight: 500,
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 4px 12px rgba(0,0,0,0.7)"
                      : "0 4px 12px rgba(0,0,0,0.15)",
                  transition: "background-color 0.25s ease",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                +
              </Box>
            )}

            {/* ВЫЕЗЖАЮЩИЙ КОМПОЗЕР (отправка материалов). Он остаётся управляемый твоими состояниями */}
            {isTeacher && !showChat && (
              <Box
                sx={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 20,
                  transform: composerOpen
                    ? "translateY(0)"
                    : "translateY(110%)",
                  opacity: composerOpen ? 1 : 0,
                  transition: "all 0.3s ease",
                }}
              >
                <form
                  onSubmit={(e) => {
                    sendMaterial(e);
                    setComposerOpen(false);
                  }}
                  className="w-full"
                >
                  {/* Верхняя часть с редактором */}
                  <Box
                    sx={{
                      mx: "10px",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      px: 2,
                      pt: 3,
                      pb: 4,
                    }}
                  >
                    <Box sx={{ height: "180px" }}>
                      <ReactQuill
                        value={text}
                        onChange={setText}
                        modules={{
                          toolbar: [
                            ["bold", "italic", "underline", "strike"],
                            [{ header: 1 }, { header: 2 }],
                            [{ list: "ordered" }, { list: "bullet" }],
                            [{ size: ["small", false, "large", "huge"] }],
                            ["link"],
                            ["clean"],
                          ],
                        }}
                        formats={[
                          "header",
                          "bold",
                          "italic",
                          "underline",
                          "strike",
                          "list",
                          "bullet",
                          "size",
                          "link",
                        ]}
                        placeholder="Введите сообщение..."
                        className="h-full"
                      />
                    </Box>

                    {files.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          my: 2,
                        }}
                      >
                        {files.map((file, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              backgroundColor:
                                theme.palette.action.hover,
                              color: theme.palette.text.secondary,
                              fontSize: "0.75rem",
                              lineHeight: 1.2,
                              wordBreak: "break-all",
                            }}
                          >
                            <span>{file.name}</span>
                            <Box<'button'>
                              component="button"
                              type="button"
                              onClick={() =>
                                setFiles((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              sx={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                lineHeight: 1,
                                color: theme.palette.error.main,
                              }}
                            >
                              ✕
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Нижняя панель кнопок */}
                  <Box
                    sx={{
                      mx: "10px",
                      borderBottomLeftRadius: "16px",
                      borderBottomRightRadius: "16px",
                      borderLeft: `1px solid ${theme.palette.divider}`,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      px: 2,
                      py: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      rowGap: 1.5,
                    }}
                  >
                    <Box<'button'>
                      component="button"
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      sx={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        px: 1,
                        py: 1,
                      }}
                    >
                      Свернуть
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1.5,
                      }}
                    >
                      <input
                        id="roomFiles"
                        type="file"
                        className="hidden"
                        multiple
                        onChange={(e) =>
                          setFiles(Array.from(e.target.files || []))
                        }
                      />

                      <Box<'label'>
                        component="label"
                        htmlFor="roomFiles"
                        sx={{
                          cursor: "pointer",
                          borderRadius: "999px",
                          px: 2,
                          py: 1,
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          backgroundColor:
                            theme.palette.action.hover,
                          color: theme.palette.text.primary,
                          "&:hover": {
                            backgroundColor:
                              theme.palette.action.selected,
                          },
                        }}
                      >
                        Прикрепить файл
                      </Box>

                      <Box<'button'>
                        component="button"
                        type="submit"
                        disabled={!text && files.length === 0}
                        sx={{
                          border: "none",
                          cursor: !text && files.length === 0 ? "default" : "pointer",
                          opacity: !text && files.length === 0 ? 0.5 : 1,
                          borderRadius: "999px",
                          px: 3,
                          py: 1,
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          "&:hover": {
                            backgroundColor: !text && files.length === 0
                              ? theme.palette.primary.main
                              : theme.palette.primary.dark,
                          },
                        }}
                      >
                        Отправить
                      </Box>
                    </Box>
                  </Box>
                </form>
              </Box>
            )}
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
    </Box>
  );
}
