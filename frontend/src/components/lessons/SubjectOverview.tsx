import React, { useEffect, useState } from "react";
import api from "../../api";
import { Box, Typography, Grid, Divider, useTheme } from "@mui/material";
import { LessonCard } from "./LessonCard";

interface Lesson {
  id: string;
  title: string;
}
interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}
type Role = "ADMIN" | "TEACHER" | "STUDENT" | "GUEST";

interface SubjectOverviewProps {
  subjectId: string;
  role?: Role;
  onDataChange?: () => void;
}

export const SubjectOverview: React.FC<SubjectOverviewProps> = ({
  subjectId,
  role = "STUDENT",
  onDataChange,
}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const loadModules = async () => {
    try {
      const { data } = await api.get(`/subjects/${subjectId}`);
      setModules(data.tree || []);
    } catch (err) {
      console.error("Ошибка загрузки модулей:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, [subjectId]);

  if (loading)
    return (
      <Typography sx={{ p: 3 }} color="text.secondary">
        Загрузка...
      </Typography>
    );

  if (modules.length === 0)
    return (
      <Typography sx={{ p: 3 }} color="text.secondary">
        В этом предмете пока нет модулей.
      </Typography>
    );

  return (
    <Box
      sx={{
        px: "20px",
        pt: "calc(20px + var(--appbar-offset, 0px))",
        pb: "40px",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: "20px",
          color: theme.palette.text.primary,
        }}
      >
        Все модули и уроки
      </Typography>

      {modules.map((m, i) => (
        <Box key={m.id} sx={{ mb: 5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            {m.title}
          </Typography>

          <Grid container spacing={1.875}>
            {m.lessons.map((lesson) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={lesson.id}>
                <LessonCard
                  id={lesson.id}
                  title={lesson.title}
                  role={role}
                  onDelete={onDataChange}
                />
              </Grid>
            ))}
          </Grid>

          {i < modules.length - 1 && <Divider sx={{ mt: 4 }} />}
        </Box>
      ))}
    </Box>
  );
};
