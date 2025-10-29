import React, { useEffect, useRef, useState } from "react";
import api from "../../api";
import DOMPurify from "dompurify";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../../auth/AuthContext";
import EditMessageModal from "./EditMessageModal";
import { useChatSocket, ChatMessage } from "../../hooks/useChatSocket";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography, Button, IconButton } from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface Props {
  sessionId: string;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function ChatWindow({ sessionId, setUnreadCounts }: Props) {
  const { user } = useAuth();
  const theme = useTheme();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [editRemoveIds, setEditRemoveIds] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, socket, typing, emitTyping, emitStopTyping } =
    useChatSocket(sessionId, console.error);

  // === Получение истории сообщений ===
  useEffect(() => {
    api
      .get<ChatMessage[]>(`/chats/${sessionId}/messages`)
      .then((res) => {
        setMessages(res.data);
        setUnreadCounts((u) => ({ ...u, [sessionId]: 0 }));
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "instant",
          });
        }, 50);
      })
      .catch(console.error);
  }, [sessionId, setMessages, setUnreadCounts]);

  // === Автопрокрутка при новых сообщениях ===


  // === Отправка сообщения ===
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      isTemp: true,
      text,
      author: { id: user!.id, email: user!.email },
      attachments: files.map((f, i) => ({
        id: `temp-${tempId}-${i}`,
        url: URL.createObjectURL(f),
      })),
      createdAt: new Date().toISOString(),
    };
    setMessages((p) => [...p, tempMsg]);

    const fd = new FormData();
    if (text.trim()) fd.append("text", text.trim());
    files.forEach((f) => fd.append("files", f));

    setUploading(true);
    try {
      const res = await api.post<ChatMessage>(
        `/chats/${sessionId}/messages`,
        fd,
        {
          onUploadProgress: (evt) => {
            setProgress(Math.round((evt.loaded / (evt.total ?? 1)) * 100));
          },
        }
      );
      const realMsg = res.data;
      setMessages((p) =>
        [...p.filter((m) => m.id !== tempId), realMsg].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
      setText("");
      setFiles([]);
      setComposerOpen(false);
    } catch (e) {
      console.error("Send error", e);
      alert("Не удалось отправить сообщение");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteMsg = (id: string) =>
    socket.emit("chatDeleted", { sessionId, messageId: id });

  const onStartEdit = (m: ChatMessage) => {
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
    editNewFiles.forEach((f) => fd.append("newFiles", f));

    try {
      const updated: ChatMessage = (
        await api.patch(`/chats/${sessionId}/messages/${editingMessage.id}`, fd)
      ).data;
      setMessages((p) => p.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMessage(null);
    } catch (e) {
      alert("Ошибка сохранения");
    }
  };

  // === Отображение сообщений ===
  // === Автопрокрутка при новых сообщениях ===
useEffect(() => {
  // Автоматически прокручиваем вниз, когда добавляется новое сообщение
  const scrollArea = scrollRef.current;
  if (!scrollArea) return;
  scrollArea.scrollTo({
    top: scrollArea.scrollHeight,
    behavior: "smooth",
  });
}, [messages]);

// === Отображение сообщений ===
const renderMsg = (m: ChatMessage) => {
  const isMine = m.author?.id === user?.id;
  const bg = isMine
    ? theme.palette.primary.main
    : theme.palette.background.paper;
  const color = isMine
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary;

      const atts = m.attachments ?? [];

  return (
    <motion.div
      key={m.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <Box
        sx={{
          maxWidth: "80%",
          p: 2.2,
          borderRadius: "20px",
          backgroundColor: bg,
          color,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 4px 16px rgba(0,0,0,0.7)"
              : "0 4px 16px rgba(0,0,0,0.1)",
          border: `1px solid ${isMine ? "transparent" : theme.palette.divider}`,
          
        }}
      >
        {/* Верхняя строка — автор и время */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              opacity: 0.8,
              color,
            }}
          >
            {m.author?.email || "Гость"} —{" "}
            {new Date(m.createdAt).toLocaleTimeString()}
          </Typography>

          {isMine && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconButton
                onClick={() => onStartEdit(m)}
                size="small"
                title="Редактировать"
                sx={{
                  color: theme.palette.text.secondary,
                  "&:hover": { color: theme.palette.primary.main },
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => deleteMsg(m.id)}
                size="small"
                title="Удалить"
                sx={{
                  color: theme.palette.error.main,
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#4a2a2a" : "#fdeaea",
                  },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

       {/* Текст сообщения */}
{m.text && (
  <Box
    sx={{
      fontSize: "0.95rem",
      lineHeight: 1.45,
      mb: (atts.length ?? 0) > 0 ? 1 : 0,
    }}
    dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(m.text),
    }}
  />
)}

{/* Вложения */}
{atts.length > 0 && (
  <Box
    sx={{
      mt: 1,
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}
  >
    {atts.map((att) => {
      const src = att.url.startsWith("blob:")
        ? att.url
        : `http://localhost:3001/uploads/${att.url}`;
      const ext = att.url.split(".").pop()?.toLowerCase();
      const isImg = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "");

      return isImg ? (
        <Box
          key={att.id}
          sx={{
            display: "inline-block",
            cursor: "zoom-in",
            "& img": {
              maxHeight: 192,
              maxWidth: "100%",
              borderRadius: "12px",
              border: `1px solid ${theme.palette.divider}`,
              transition: "transform 0.25s ease",
              "&:hover": { transform: "scale(1.03)" },
            },
          }}
        >
          <img src={src} alt="" />
        </Box>
      ) : (
        <a
          key={att.id}
          href={src}
          download
          style={{
            color: theme.palette.primary.main,
            textDecoration: "underline",
            fontSize: "0.9rem",
            wordBreak: "break-all",
          }}
        >
          📄 {decodeURIComponent(att.url)}
        </a>
      );
    })}
  </Box>
)}
      </Box>
    </motion.div>
  );
};

  return (
    <Box
  sx={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.background.default
        : theme.palette.background.paper, // ✅ белый в светлой теме, серый в тёмной
    borderRadius: "20px",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 2px 8px rgba(0,0,0,0.6)"
        : "0 2px 8px rgba(0,0,0,0.08)",
    position: "relative",
  }}
>
      {/* === Кнопка / форма написания сообщения === */}
      <Box sx={{ p: 3, pb: 2 }}>
        <AnimatePresence initial={false} mode="popLayout">
          {!composerOpen ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <Box
                onClick={() => setComposerOpen(true)}
                sx={{
                  cursor: "pointer",
                  borderRadius: "20px",
                  p: 2,
                  textAlign: "center",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                    color: theme.palette.text.primary,
                  },
                }}
              >
                ✏️ Написать сообщение
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden" }}
            >
              <Box
                sx={{
                  borderRadius: "20px",
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[2],
                  p: 2,
                }}
              >
                <form
                  onSubmit={(e) => {
                    send(e);
                  }}
                >
                  <ReactQuill
                    theme="snow"
                    value={text}
                    onChange={(v) => {
                      setText(v);
                      emitTyping();
                      clearTimeout((window as any).__stopTypingTimer);
                      (window as any).__stopTypingTimer = setTimeout(
                        emitStopTyping,
                        800
                      );
                    }}
                    placeholder="Введите сообщение..."
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      height: 120,
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 1.5,
                      mt: 1.5,
                    }}
                  >
                    <Button
                      onClick={() => setComposerOpen(false)}
                      variant="outlined"
                      sx={{
                        borderRadius: "999px",
                        px: 2.5,
                        py: 0.8,
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      Свернуть
                    </Button>

                    <Button
                      type="submit"
                      disabled={!text && files.length === 0}
                      variant="contained"
                      sx={{
                        borderRadius: "999px",
                        px: 3,
                        py: 0.8,
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      {uploading ? `Загрузка… ${progress}%` : "Отправить"}
                    </Button>
                  </Box>
                </form>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* === Сообщения === */}
     <Box
  ref={scrollRef}
  sx={{
    flex: 1,
    overflowY: "auto",
    px: 3,
    pb: 3,
    display: "flex",
    flexDirection: "column", // 🔹 переворачиваем порядок
    gap: 1.5,
  }}
>
  {messages
    .slice() // 🔹 копия массива, чтобы не мутировать состояние
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) // 🔹 сортируем по убыванию (новые первыми)
    .map(renderMsg)}

  <AnimatePresence>
    {typing && (
      <motion.div
        key="typing"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.25 }}
        style={{
          alignSelf: "flex-start",
          backgroundColor: theme.palette.action.hover,
          borderRadius: "12px",
          padding: "4px 12px",
          fontSize: "0.85rem",
          opacity: 0.8,
        }}
      >
        Собеседник печатает…
      </motion.div>
    )}
  </AnimatePresence>
</Box>

      {/* === Модалка редактирования === */}
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
          onAddNewFiles={(fs) => setEditNewFiles((p) => [...p, ...fs])}
          onClose={() => setEditingMessage(null)}
          onSave={onSaveEdit}
        />
      )}
    </Box>
  );
}
