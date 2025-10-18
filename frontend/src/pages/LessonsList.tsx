// src/pages/LessonsList.tsx
import React, { useEffect, useState } from "react";
import api, { deleteSubject } from "../api";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { Grid } from "@mui/material"; // ✅ Используем Grid2 из MUI v6
import { useNavigate } from "react-router-dom";
import type { Subject } from "../types/lessons";
import { useAuth } from "../auth/AuthContext";

const LessonsList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const navigate = useNavigate();
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
        loadSubjects();
      })
      .catch(() => setError("Ошибка при создании предмета"));
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (subjects === null) return <p>Загружаем предметы…</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Список предметов</h1>

      {/* === Добавление нового предмета (только для учителей/админов) === */}
      {isTeacher && (
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Название предмета"
            size="small"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button variant="contained" onClick={handleAdd}>
            Добавить
          </Button>
        </Box>
      )}

      {subjects.length === 0 ? (
        <p>
          {isStudent
            ? "Пока нет доступных предметов."
            : "Предметы отсутствуют. Создайте хотя бы один."}
        </p>
      ) : (
        <Grid container spacing={2}>
          {subjects.map((s) => (
            <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardActionArea onClick={() => navigate(`/lessons/${s.id}`)}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {s.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.moduleCount ?? 0} модулей • {s.lessonCount ?? 0} уроков
                    </Typography>
                  </CardContent>
                </CardActionArea>

                {/* === Кнопка удаления (только для учителей/админов) === */}
                {isTeacher && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      p: 1,
                    }}
                  >
                    <Button
                      size="small"
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
                      🗑 Удалить
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
};

export default LessonsList;
