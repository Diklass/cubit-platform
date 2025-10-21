import React, { useEffect, useState } from "react";
import api, { deleteSubject, createSubject, updateSubject } from "../../api";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Modal,
  TextField,
  Button,
  useTheme,
  Divider,
} from "@mui/material";
import { Add, DeleteOutline, EditOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { Subject } from "../../types/lessons";
import { useAuth } from "../../auth/AuthContext";

const LessonsList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
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
      .then((res: { data: Subject[] }) => setSubjects(res.data))
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

  return (
<Box
  sx={{
    px: "20px",
    pt: "calc(20px + var(--appbar-offset, 0px))", // 🔹 верхний отступ с учётом шапки
    pb: "40px",
    fontFamily: "Roboto, sans-serif",
  }}
>
  <Typography
    variant="h4"
    sx={{
      fontWeight: 700,
      my: "20px", // 🔹 теперь сверху и снизу по 20px
      color: theme.palette.text.primary,
    }}
  >
    Список предметов
  </Typography>

      <Grid container spacing={1.875}>
        {subjects.map((s) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
            <Card
              elevation={3} // ✅ этого достаточно
              sx={{
                borderRadius: 2,
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4], // ✅ усиление на hover
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
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: ".6px",
                      fontSize: "42px",
                    }}
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
                <Typography variant="body2" color="text.secondary">
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
                {/* === Модальное окно создания / редактирования предмета === */}
                <Modal open={openModal} onClose={() => setOpenModal(false)}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      bgcolor: theme.palette.background.paper,
                      boxShadow:
                        "0px 2px 6px rgba(60,150,239,0.08), 0px 4px 12px rgba(60,150,239,0.06)",
                      borderRadius: 2,
                      p: 4,
                      width: 400,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
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
            </Card>
          </Grid>
        ))}

        {/* === Карточка "Добавить предмет" === */}
        {isTeacher && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
            elevation={3}
              onClick={() => {
                setEditing(null);
                setNewTitle("");
                setOpenModal(true);
              }}
              sx={{
                borderRadius: 2,
                height: 200,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform .2s, box-shadow .2s, color .15s, background-color .15s',
                color: theme.palette.text.secondary,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Add sx={{ fontSize: 48 }} />
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default LessonsList;
