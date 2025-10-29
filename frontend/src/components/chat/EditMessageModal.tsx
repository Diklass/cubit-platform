// src/components/chat/EditMessageModal.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Typography,

} from "@mui/material";

export type Attachment = { id: string; url: string };

interface EditModalProps {
  messageId: string;
  initialText: string;
  existingAttachments: Attachment[];
  removeIds: string[];
  newFiles: File[];
  onTextChange: (v: string) => void;
  onToggleRemove: (id: string) => void;
  onAddNewFiles: (files: File[]) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditMessageModal({
  initialText,
  existingAttachments,
  removeIds,
  newFiles,
  onTextChange,
  onToggleRemove,
  onAddNewFiles,
  onClose,
  onSave,
}: EditModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [dragCount, setDragCount] = useState(0);
  const theme = useTheme();

  // Drag&Drop
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCount((c) => c + 1);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCount((c) => c - 1);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragCount(0);
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (dropped.length) onAddNewFiles(dropped);
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
  }, [onAddNewFiles]);

  // Закрытие по ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <motion.div
          key="card"
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 160, damping: 18 },
          }}
          exit={{
            opacity: 0,
            y: 40,
            scale: 0.95,
            transition: { duration: 0.25, ease: "easeInOut" },
          }}
          style={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: "24px",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 40px rgba(0,0,0,0.8)"
                : "0 8px 40px rgba(0,0,0,0.15)",
            width: "90%",
            maxWidth: 680,
            padding: "28px 32px",
            position: "relative",
          }}
        >
          {/* DnD overlay */}
          {dragCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "rgba(0,0,0,0.35)",
                border: `2px dashed ${theme.palette.primary.main}`,
                zIndex: 10,
              }}
            >
              <span
                style={{
                  color: theme.palette.primary.contrastText,
                  fontSize: "1.1rem",
                  fontWeight: 500,
                }}
              >
                Перетащите файлы сюда
              </span>
            </motion.div>
          )}

          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 600,
              fontSize: "1.3rem",
              color: theme.palette.text.primary,
            }}
          >
            ✏️ Редактировать сообщение
          </Typography>

          {/* Текстовый редактор */}
          <Box sx={{ mb: 3, borderRadius: "16px", overflow: "hidden" }}>
            <ReactQuill
              theme="snow"
              value={initialText}
              onChange={onTextChange}
              modules={{
                toolbar: [
                  ["bold", "italic", "underline"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ],
              }}
              style={{
                height: "160px",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "12px",
              }}
            />
          </Box>

          {/* Вложения */}
          {existingAttachments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>
                Вложения
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {existingAttachments.map((att) => {
                  const src = `http://localhost:3001/uploads/${att.url}`;
                  const marked = removeIds.includes(att.id);
                  return (
                    <Box
                      key={att.id}
                      sx={{
                        position: "relative",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: `2px solid ${
                          marked
                            ? theme.palette.error.main
                            : theme.palette.divider
                        }`,
                        transition: "border-color 0.25s ease",
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        style={{
                          maxHeight: 96,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <button
                        onClick={() => onToggleRemove(att.id)}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          backgroundColor: theme.palette.background.paper,
                          color: marked
                            ? theme.palette.error.main
                            : theme.palette.text.secondary,
                          border: "none",
                          borderRadius: "50%",
                          width: 24,
                          height: 24,
                          cursor: "pointer",
                          boxShadow:
                            theme.palette.mode === "dark"
                              ? "0 1px 4px rgba(0,0,0,0.7)"
                              : "0 1px 4px rgba(0,0,0,0.2)",
                        }}
                        title={
                          marked
                            ? "Пометка снята (не удалять)"
                            : "Пометить для удаления"
                        }
                      >
                        ×
                      </button>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Новые файлы */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>
              Добавить файлы
            </Typography>
            <Box
              sx={{
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: "12px",
                p: 2,
                textAlign: "center",
                color: theme.palette.text.secondary,
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                },
                transition: "border-color 0.3s ease",
              }}
            >
              Перетащите сюда или выберите
              <input
                type="file"
                multiple
                style={{ marginLeft: 8 }}
                onChange={(e) =>
                  onAddNewFiles(Array.from(e.target.files || []))
                }
              />
            </Box>

            {newFiles.length > 0 && (
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1.2 }}>
                {newFiles.map((f, i) => (
                  <Box
                    key={i}
                    sx={{
                      px: 1.6,
                      py: 0.6,
                      borderRadius: "999px",
                      fontSize: "0.9rem",
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {f.name}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Кнопки */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 2,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "10px 24px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Отмена
            </button>
            <button
              onClick={onSave}
              style={{
                padding: "10px 26px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 16px rgba(0,0,0,0.7)"
                    : "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              Сохранить
            </button>
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
