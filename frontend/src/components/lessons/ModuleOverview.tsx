// src/components/lessons/ModuleOverview.tsx
import React from "react";
import { Box, Typography, Grid, useTheme } from "@mui/material";
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

interface ModuleOverviewProps {
  modules: Module[];
  role: Role;
  onDataChange?: () => void;
}

export const ModuleOverview: React.FC<ModuleOverviewProps> = ({
  modules,
  role,
  onDataChange,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: "20px",
        pt: "calc(20px + var(--appbar-offset, 0px))",
        pb: "40px",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      {modules.map((m) => (
        <Box key={m.id} sx={{ mb: 5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: "20px",
              color: theme.palette.text.primary,
            }}
          >
            {m.title}
          </Typography>

          {m.lessons.length === 0 ? (
            <Typography color="text.secondary">Нет уроков в этом модуле</Typography>
          ) : (
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
          )}
        </Box>
      ))}
    </Box>
  );
};
