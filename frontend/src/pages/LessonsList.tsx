// src/pages/LessonsList.tsx
import React, { useEffect, useState } from "react";
import api, { deleteSubject } from "../api";
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
} from "@mui/material";
import { Add, DeleteOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { Subject } from "../types/lessons";
import { useAuth } from "../auth/AuthContext";



const LessonsList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  const loadSubjects = () => {
    api
      .get<Subject[]>("/subjects")
      .then((res) => setSubjects(res.data))
      .catch(() => setError("Не удалось загрузить предметы"));
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    api
      .post("/subjects", { title: newTitle })
      .then(() => {
        setNewTitle("");
        setOpenModal(false);
        loadSubjects();
      })
      .catch(() => setError("Ошибка при создании предмета"));
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (subjects === null) return <p>Загружаем предметы…</p>;

  return (
    <Box sx={{ p: 3, mt: 2, fontFamily: "Roboto, sans-serif" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: theme.palette.text.primary,
        }}
      >
        Список предметов
      </Typography>

      <Grid container spacing={3}>
  {subjects.map((s) => (
    <Grid xs={12} sm={6} md={4} lg={3} key={s.id}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 2,
                height: 180,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow:
                  "0px 2px 6px rgba(60,150,239,0.08), 0px 4px 12px rgba(60,150,239,0.06)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    "0px 4px 10px rgba(60,150,239,0.16), 0px 6px 18px rgba(60,150,239,0.12)",
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/lessons/${s.id}`)}
                sx={{ flexGrow: 1 }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.moduleCount ?? 0} модулей • {s.lessonCount ?? 0} уроков
                  </Typography>
                </CardContent>
              </CardActionArea>

              {isTeacher && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
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
                  >
                    <DeleteOutline />
                  </IconButton>
                </Box>
              )}
            </Card>
          </Grid>
        ))}

        {/* === Карточка "Добавить предмет" === */}
        {isTeacher && (
           <Grid xs={12} sm={6} md={4} lg={3}>
            <Card
              onClick={() => setOpenModal(true)}
              sx={{
                borderRadius: 2,
                height: 180,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px dashed ${theme.palette.divider}`,
                color: theme.palette.text.secondary,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Add sx={{ fontSize: 40 }} />
            </Card>
          </Grid>
        )}
      </Grid>

      {/* === Модальное окно создания предмета === */}
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
            Новый предмет
          </Typography>
          <TextField
            label="Название предмета"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
            <Button variant="outlined" onClick={() => setOpenModal(false)}>
              Отмена
            </Button>
            <Button variant="contained" onClick={handleAdd}>
              Добавить
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default LessonsList;
