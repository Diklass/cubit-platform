import React from "react";
import ReactQuill from "react-quill";
import { Box, Button } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  placeholder?: string;
  submitLabel?: string;
}

export function MessageComposer({
  open,
  setOpen,
  value,
  onChange,
  onSubmit,
  files,
  setFiles,
  placeholder = "Введите сообщение...",
  submitLabel = "Отправить",
}: Props) {
  const theme = useTheme();

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {!open ? (
        // ✅ Свернутая кнопка "Написать сообщение"
        <motion.div
          key="collapsed-composer"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 16,
            mass: 0.9,
          }}
        >
          <Box
            onClick={() => setOpen(true)}
            sx={{
              cursor: "pointer",
              borderRadius: "20px",
              p: 2.5,
              textAlign: "center",
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "#2b2b2b"
                  : theme.palette.background.paper,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 2px 8px rgba(0,0,0,0.6)"
                  : "0 2px 8px rgba(0,0,0,0.08)",
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: "0.95rem",
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "#3a3a3a"
                    : theme.palette.action.hover,
                color: theme.palette.text.primary,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(0,0,0,0.8)"
                    : "0 4px 12px rgba(0,0,0,0.15)",
              },
              transition:
                "background-color .3s cubic-bezier(0.25,1,0.5,1), box-shadow .3s ease, color .3s ease",
            }}
          >
            ✏️ Написать сообщение
          </Box>
        </motion.div>
      ) : (
        // ✅ Развернутый композер
        <motion.div
          key="expanded-composer"
          initial={{ height: 0, opacity: 0, y: -12, scaleY: 0.97 }}
          animate={{
            height: "auto",
            opacity: 1,
            y: 0,
            scaleY: 1,
          }}
          exit={{
            height: 0,
            opacity: 0,
            y: -12,
            scaleY: 0.97,
          }}
          transition={{
            type: "spring",
            stiffness: 160,
            damping: 18,
            mass: 0.9,
          }}
          style={{
            overflow: "hidden",
            borderRadius: "20px",
            transformOrigin: "top center",
          }}
        >
          <Box
            sx={{
              borderRadius: "20px",
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 16px rgba(0,0,0,0.7)"
                  : "0 4px 16px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <Box sx={{ p: 3, pb: 5 }}>
                {/* ✅ красиво стилизованный Quill */}
                <Box
                  sx={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.background.paper === "#fff"
                          ? "#f4f4f4"
                          : "#1e1e1e"
                        : theme.palette.background.paper,
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.12)"
                        : `1px solid ${theme.palette.divider}`,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 12px rgba(0,0,0,0.45)"
                        : "0 2px 8px rgba(0,0,0,0.08)",
                    "& .ql-toolbar": {
                      border: "none!important",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "#262626"
                          : theme.palette.background.paper,
                    },
                    "& .ql-container": {
                      border: "none!important",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "#1e1e1e"
                          : theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                    "& .ql-editor": {
                      color: theme.palette.text.primary,
                      padding: "14px 16px",
                      minHeight: "180px",
                      fontSize: "0.95rem",
                    },
                    "& .ql-editor.ql-blank::before": {
                      color: theme.palette.text.disabled,
                      opacity: 0.5,
                    },
                    "& .ql-stroke": { stroke: theme.palette.text.primary },
                    "& .ql-fill": { fill: theme.palette.text.primary },
                  }}
                >
                  <ReactQuill
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    style={{ height: 180 }}
                    modules={{
                      toolbar: [
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link"],
                        ["clean"],
                      ],
                    }}
                  />
                </Box>

                {/* ✅ Прикрепленные файлы */}
                {files.length > 0 && (
                  <Box
                    sx={{
                      mt: 2.5,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.2,
                    }}
                  >
                    {files.map((file, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          px: 1.8,
                          py: 0.8,
                          borderRadius: "9999px",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.text.secondary,
                          fontSize: "0.85rem",
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
                            fontSize: "0.9rem",
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

              {/* ✅ Нижняя панель */}
              <Box
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  p: 3,
                  pt: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Button
                  onClick={() => setOpen(false)}
                  startIcon={
                    <ExpandMore
                      sx={{
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s cubic-bezier(0.25,1.25,0.5,1)",
                      }}
                    />
                  }
                  variant="outlined"
                  sx={{
                    borderRadius: "999px",
                    px: 2.8,
                    py: 0.9,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Свернуть
                </Button>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    sx={{
                      borderRadius: "999px",
                      px: 2.5,
                      py: 0.8,
                      fontSize: "0.9rem",
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    Прикрепить файл
                    <input
                      hidden
                      multiple
                      type="file"
                      onChange={(e) =>
                        setFiles(Array.from(e.target.files || []))
                      }
                    />
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!value && files.length === 0}
                    sx={{
                      borderRadius: "999px",
                      px: 3,
                      py: 0.8,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    {submitLabel}
                  </Button>
                </Box>
              </Box>
            </form>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
