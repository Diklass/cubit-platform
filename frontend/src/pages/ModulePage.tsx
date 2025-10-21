// src/pages/ModulePage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import api from "../api";

interface Lesson {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export default function ModulePage() {
  const { id } = useParams(); // id модуля
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModule = async () => {
      try {
        const { data } = await api.get(`/subjects/modules/${id}`);
        setModuleData(data);
      } catch (err) {
        console.error("Ошибка загрузки модуля:", err);
      } finally {
        setLoading(false);
      }
    };
    loadModule();
  }, [id]);

  if (loading) return <LinearProgress />;

  if (!moduleData)
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Модуль не найден
        </Typography>
      </Box>
    );

  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* === Верхняя панель === */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Назад к предмету">
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {moduleData.title}
          </Typography>
        </Box>

        <Tooltip title="Редактировать модуль">
          <IconButton color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* === Прогресс (на потом можно динамический) === */}
      <LinearProgress
        variant="determinate"
        value={60}
        sx={{
          height: 6,
          borderRadius: 3,
          mb: 4,
        }}
      />

      {/* === Список уроков === */}
      <Grid container spacing={2}>
        {moduleData.lessons.map((lesson) => (
          <Grid item xs={12} sm={6} md={4} key={lesson.id}>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow:
                  "0px 2px 6px rgba(0,0,0,0.08), 0px 4px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow:
                    "0px 4px 10px rgba(0,0,0,0.16), 0px 6px 18px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardActionArea onClick={() => navigate(`/lessons/${lesson.id}`)}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      textAlign: "center",
                      color: "text.primary",
                    }}
                  >
                    {lesson.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}

        {moduleData.lessons.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            В этом модуле пока нет уроков.
          </Typography>
        )}
      </Grid>
    </Box>
  );
}
