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
import { Box, Typography, IconButton } from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { MessageComposer } from "./MessageComposer";
import { Menu, MenuItem } from "@mui/material";

interface Props {
  sessionId: string;
  setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  headerColor?: string;
}

export function ChatWindow({ sessionId, setUnreadCounts, headerColor  }: Props) {
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, socket, typing, emitTyping, emitStopTyping } =
    useChatSocket(sessionId, console.error);

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number | null;
    mouseY: number | null;
    message: ChatMessage | null;
  }>({
    mouseX: null,
    mouseY: null,
    message: null,
  });

  // Функция прокрутки до конца
  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  function getContrastColor(bg: string) {
  try {
    const c = bg.substring(1);
    const rgb = [
      parseInt(c.substr(0,2),16)/255,
      parseInt(c.substr(2,2),16)/255,
      parseInt(c.substr(4,2),16)/255
    ];
    const lum = 0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2];
    return lum > 0.45 ? "#1C1B1F" : "#FFFFFF"; // dark text on light bg and vice versa
  } catch {
    return "#FFFFFF";
  }
}


  // Получение истории сообщений при монтировании
  useEffect(() => {
    api
      .get<ChatMessage[]>(`/chats/${sessionId}/messages`)
      .then((res) => {
        setMessages(res.data);
        setUnreadCounts((u) => ({ ...u, [sessionId]: 0 }));
        setTimeout(scrollToBottom, 100);
      })
      .catch(console.error);
  }, [sessionId]);

  // Автопрокрутка при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Прокрутка при загрузке изображений
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleImageLoad = () => {
      scrollToBottom();
    };

    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", handleImageLoad);
        img.addEventListener("error", handleImageLoad);
      }
    });

    return () => {
      images.forEach((img) => {
        img.removeEventListener("load", handleImageLoad);
        img.removeEventListener("error", handleImageLoad);
      });
    };
  }, [messages]);

  // Отправка сообщения
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

  // Группировка сообщений по датам
  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    
    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString();
      const lastGroup = groups[groups.length - 1];
      
      if (lastGroup && lastGroup.date === msgDate) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: msgDate, messages: [msg] });
      }
    });
    
    return groups;
  };

  // Определение нужно ли показывать хвостик
  const shouldShowTail = (msg: ChatMessage, nextMsg: ChatMessage | undefined, isMine: boolean) => {
    if (!nextMsg) return true;
    const nextIsMine = nextMsg.author?.id === user?.id;
    if (isMine !== nextIsMine) return true;
    
    // Если следующее сообщение через > 5 минут - показываем хвостик
    const timeDiff = new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime();
    return timeDiff > 5 * 60 * 1000;
  };

  // Отображение сообщений
  const renderMsg = (m: ChatMessage, index: number, allMsgs: ChatMessage[]) => {
    const isMine = m.author?.id === user?.id;
    const nextMsg = allMsgs[index + 1];
    const showTail = shouldShowTail(m, nextMsg, isMine);
    const atts = m.attachments ?? [];

    return (
      <motion.div
        key={m.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
        style={{ marginBottom: showTail ? "12px" : "3px" }}
      >
        <Box
          sx={{
            maxWidth: "75%",
            minWidth: "80px",
            padding: "8px 12px",
            paddingBottom: "18px",
            borderRadius: "16px",
           backgroundColor: isMine
  ? headerColor || theme.palette.primary.main
  : theme.palette.background.paper,
color: isMine
  ? getContrastColor(headerColor || theme.palette.primary.main)
  : theme.palette.text.primary,
            backdropFilter: "blur(6px)",
            border: isMine
              ? "none"
              : `1px solid ${theme.palette.divider}`,
            borderBottomRightRadius: isMine && showTail ? "4px" : "16px",
            borderBottomLeftRadius: !isMine && showTail ? "4px" : "16px",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 1px 3px rgba(0,0,0,0.4)"
                : "0 1px 3px rgba(0,0,0,0.1)",
            position: "relative",
            transition: "all 0.15s ease",
            "&:hover": {
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 2px 6px rgba(0,0,0,0.6)"
                  : "0 2px 6px rgba(0,0,0,0.15)",
            },
          }}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            setContextMenu({
              mouseX: e.clientX + 2,
              mouseY: e.clientY - 6,
              message: m,
            });
          }}
        >
          {/* Текст сообщения */}
          {m.text && (
            <Box
              sx={{
                fontSize: "1.05rem",
lineHeight: 1.5,
                mb: atts.length > 0 ? 1 : 0,
                wordBreak: "break-word",
                "& p": { margin: 0 },
                "& a": {
                  color: isMine
                    ? theme.palette.primary.contrastText
                    : theme.palette.primary.main,
                  textDecoration: "underline",
                },
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
                mt: m.text ? 1 : 0,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              {atts.map((att) => {
                const src = att.url.startsWith("blob:")
                  ? att.url
                  : `http://localhost:3001/uploads/${att.url}`;
                const ext = att.url.split(".").pop()?.toLowerCase();
                const isImg = ["png", "jpg", "jpeg", "gif", "webp"].includes(
                  ext || ""
                );

                return isImg ? (
                  <Box
                    key={att.id}
                    sx={{
                      display: "block",
                      cursor: "zoom-in",
                      borderRadius: "12px",
                      overflow: "hidden",
                     "& img": {
  display: "block",
  width: "100%",
  maxHeight: "300px",
  objectFit: "cover",
  transition: "transform .2s ease",
  borderRadius: "10px",
  marginBottom: "8px",        // ✅ вот это спасает от пересечения
  "&:hover": { transform: "scale(1.02)" },
},
                    }}
                  >
                    <img src={src} alt="" />
                  </Box>
                ) : (
                  // @ts-ignore
                  <Box
                    key={att.id}
                    component="a"
                    href={src}
                    download
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: isMine
  ? headerColor || theme.palette.primary.main
  : theme.palette.background.paper,
                     color: isMine
  ? getContrastColor(headerColor || theme.palette.primary.main)
  : theme.palette.text.primary,
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      wordBreak: "break-all",
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        backgroundColor: isMine
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <span>📄</span>
                    <span>{decodeURIComponent(att.url.split("/").pop() || att.url)}</span>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Время сообщения */}
          <Typography
            sx={{
              position: "absolute",
              bottom: "4px",
              right: isMine ? "8px" : "8px",
              left: isMine ? "auto" : "auto",
              fontSize: "0.6875rem",
              opacity: isMine ? 0.7 : 0.5,
              pointerEvents: "none",
             color: isMine
  ? getContrastColor(headerColor || theme.palette.primary.main)
  : theme.palette.text.secondary,
            }}
          >
            {new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
      </motion.div>
    );
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        backgroundColor:
  theme.palette.mode === "dark"
    ? theme.palette.background.default
    : theme.palette.background.paper,
        borderRadius: "20px",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 2px 8px rgba(0,0,0,0.6)"
            : "0 2px 8px rgba(0,0,0,0.08)",
        position: "relative",
      }}
    >
      {/* === Скроллируемая область === */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          height: "100%",
            scrollBehavior: "smooth",
  overscrollBehavior: "contain",
        }}
      >
        {/* Контент с отступами */}
        <Box
          sx={{
            px: 2,
            pt: 3,
            pb: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messageGroups.map((group) => (
            <React.Fragment key={group.date}>
              {/* Разделитель дат */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  my: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {group.date === new Date().toLocaleDateString()
                    ? "Сегодня"
                    : group.date}
                </Typography>
              </Box>

              {/* Сообщения группы */}
              {group.messages.map((msg, idx) =>
                renderMsg(msg, idx, group.messages)
              )}
            </React.Fragment>
          ))}

          {/* Индикатор печати */}
          <AnimatePresence>
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                style={{
                  alignSelf: "flex-start",
                  marginTop: "8px",
                }}
              >
                <Box
                  sx={{
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                    borderRadius: "14px",
                    padding: "8px 14px",
                    display: "flex",
                    gap: 0.5,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: "3px",
                      "& span": {
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: theme.palette.text.secondary,
                        animation: "typing 1.4s infinite",
                      },
                      "& span:nth-of-type(2)": {
                        animationDelay: "0.2s",
                      },
                      "& span:nth-of-type(3)": {
                        animationDelay: "0.4s",
                      },
                      "@keyframes typing": {
                        "0%, 60%, 100%": { opacity: 0.3 },
                        "30%": { opacity: 1 },
                      },
                    }}
                  >
                    <span />
                    <span />
                    <span />
                  </Box>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Композер внутри скроллируемой области */}
        <Box sx={{ px: 3, pb: 3 }}>
          <MessageComposer
            open={composerOpen}
            setOpen={setComposerOpen}
            value={text}
            onChange={setText}
            onSubmit={() => {
              socket.emit("chatMessage", { sessionId, text, files });
              setText("");
              setFiles([]);
              setComposerOpen(false);
            }}
            files={files}
            setFiles={setFiles}
            placeholder="Сообщение..."
            submitLabel="Отправить"
          />
        </Box>

        {/* Якорь для прокрутки */}
        <div ref={messagesEndRef} />
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
              ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
            )
          }
          onAddNewFiles={(fs) => setEditNewFiles((p) => [...p, ...fs])}
          onClose={() => setEditingMessage(null)}
          onSave={onSaveEdit}
        />
      )}

      {/* === Контекстное меню === */}
      <Menu
        open={contextMenu.mouseY !== null}
        onClose={() =>
          setContextMenu({ mouseX: null, mouseY: null, message: null })
        }
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu.mouseY !== null && contextMenu.mouseX !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: "12px",
            overflow: "hidden",
            minWidth: 180,
            backgroundColor: theme.palette.background.paper,
            backdropFilter: "blur(12px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0px 8px 20px rgba(0,0,0,0.55)"
                : "0px 8px 20px rgba(0,0,0,0.12)",
            "& .MuiMenuItem-root": {
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "10px 16px",
            },
            "& .MuiMenuItem-root:hover": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            console.log("Reply to", contextMenu.message);
            setContextMenu({ mouseX: null, mouseY: null, message: null });
          }}
        >
          Ответить
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (contextMenu.message) onStartEdit(contextMenu.message);
            setContextMenu({ mouseX: null, mouseY: null, message: null });
          }}
        >
          Изменить
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigator.clipboard.writeText(
              contextMenu.message?.text?.replace(/<[^>]+>/g, "") || ""
            );
            setContextMenu({ mouseX: null, mouseY: null, message: null });
          }}
        >
          Копировать
        </MenuItem>

        <MenuItem
          sx={{ color: theme.palette.error.main, fontWeight: 600 }}
          onClick={() => {
            if (contextMenu.message) deleteMsg(contextMenu.message.id);
            setContextMenu({ mouseX: null, mouseY: null, message: null });
          }}
        >
          Удалить
        </MenuItem>
      </Menu>
    </Box>
  );
}