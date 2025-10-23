// src/pages/lessons/LessonsListPage.tsx
import React, { useEffect, useState } from "react";
import api, { deleteSubject, createSubject, updateSubject } from "../../api";
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
import { useNavigate } from "react-router-dom";
import type { Subject } from "../../types/lessons";
import { useAuth } from "../../auth/AuthContext";

const LessonsList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<Subject | null>(null);

  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  const loadSubjects = () => {
    api
      .get<Subject[]>("/subjects")
      .then((res) => setSubjects(res.data))
      .catch(() => setError("Не удалось загрузить предметы"));
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      if (editing) {
        await updateSubject(editing.id, { title: newTitle });
      } else {
        await createSubject({ title: newTitle });
      }
      setOpenModal(false);
      setNewTitle("");
      setEditing(null);
      loadSubjects();
    } catch (e: any) {
      console.error("Ошибка при сохранении предмета:", e);
      setError(e?.response?.data?.message || "Ошибка при сохранении предмета");
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (subjects === null) return <p>Загружаем предметы…</p>;

  const isEmpty = subjects.length === 0;

  return (
    <Box
      sx={{
        px: "20px",
        pt: "calc(0px + var(--appbar-offset, 0px))",
        pb: "40px",
        fontFamily: "Roboto, sans-serif",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "background-color 0.3s ease, color 0.3s ease",
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          my: "20px",
          color: theme.palette.text.primary,
          transition: "color 0.3s ease",
        }}
      >
        Список предметов
      </Typography>

      {/* === Если предметов нет === */}
      {isEmpty ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 300px)",
          }}
        >
          {isTeacher && (
            <Card
              elevation={5}
              onClick={() => {
                setEditing(null);
                setNewTitle("");
                setOpenModal(true);
              }}
              sx={{
                width: 220,
                height: 220,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.25s, box-shadow 0.25s, background-color 0.25s",
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: theme.shadows[8],
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Add sx={{ fontSize: 80, fontWeight: 300 }} />
            </Card>
          )}
        </Box>
      ) : (
        // === Когда есть предметы ===
        <Box
          sx={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(4, 1fr)",
              xl: "repeat(4, 1fr)",
            },
            justifyItems: "stretch",
          }}
        >
          {(() => {
            const getColumns = () => {
              const w = window.innerWidth;
              if (w >= 900) return 4;
              return 2;
            };
            const columns = getColumns();
            const remainder = subjects.length % columns;
            const fillers = remainder === 0 ? 0 : columns - remainder;

            const cards = subjects.map((s) => (
              <Card
                key={s.id}
                elevation={2}
                sx={{
                  borderRadius: "16px",
                  height: 200,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, color 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[6],
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/lessons/${s.id}`)}
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    px: 3,
                  }}
                >
                  <CardContent sx={{ py: 2, width: "100%" }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: ".6px",
                        fontSize: "clamp(24px, 4vw, 42px)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                        color: theme.palette.text.primary,
                      }}
                      title={s.title}
                    >
                      {s.title}
                    </Typography>
                  </CardContent>
                </CardActionArea>

                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ transition: "color 0.3s ease" }}
                  >
                    {s.moduleCount ?? 0} модулей • {s.lessonCount ?? 0} уроков
                  </Typography>

                  {isTeacher && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setEditing(s);
                          setNewTitle(s.title);
                          setOpenModal(true);
                        }}
                        size="small"
                      >
                        <EditOutlined />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={async () => {
                          if (confirm(`Удалить предмет "${s.title}"?`)) {
                            try {
                              await deleteSubject(s.id);
                              loadSubjects();
                            } catch {
                              alert("Ошибка при удалении предмета");
                            }
                          }
                        }}
                        size="small"
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Card>
            ));

            const emptyFillers = Array.from({ length: fillers }).map((_, i) => (
              <Box key={`filler-${i}`} sx={{ visibility: "hidden", height: 200 }} />
            ));

            return (
              <>
                {cards}
                {emptyFillers}
              </>
            );
          })()}

          {/* === Кнопка "+" === */}
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
                onClick={() => {
                  setEditing(null);
                  setNewTitle("");
                  setOpenModal(true);
                }}
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

      {/* === Модалка === */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
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
            transition: "background-color 0.3s ease",
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}
          >
            {editing ? "Редактировать предмет" : "Новый предмет"}
          </Typography>
          <TextField
            label="Название предмета"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenModal(false);
                setEditing(null);
              }}
            >
              Отмена
            </Button>
            <Button variant="contained" onClick={handleAdd}>
              {editing ? "Сохранить" : "Добавить"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default LessonsList;
