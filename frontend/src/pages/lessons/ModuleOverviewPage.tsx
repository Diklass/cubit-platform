// src/pages/SubjectPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { SubjectSidebar } from "../../components/lessons/SubjectSidebar";
import { useAuth } from "../../auth/AuthContext";
import { ModuleOverview } from "../../components/lessons/ModuleOverview";
import api from "../../api";
import { MainContentLayout } from "../../components/layout/MainContentLayout"; 
import type { Theme } from "@mui/material/styles";

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [sp] = useSearchParams();
  const selectedLessonId = sp.get("lessonId") ?? undefined;
  const navigate = useNavigate();

  const { user } = useAuth();
  const role = user?.role ?? "GUEST";

  const [modules, setModules] = useState<any[]>([]);

  const loadModules = async () => {
    if (!subjectId) return;
    try {
      const { data } = await api.get(`/subjects/${subjectId}`);
      setModules(data.tree || []);
    } catch (err) {
      console.error("Ошибка загрузки модулей:", err);
    }
  };

  useEffect(() => {
    loadModules();
  }, [subjectId]);

  const handleDataChange = () => {
    loadModules();
  };

  const handleSelectLesson = (lessonId: string) => {
    navigate(`/lessons/view/${lessonId}`);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: (theme: Theme) => theme.palette.background.default,
      }}
    >
      {/* 🔹 Боковая панель */}
      <SubjectSidebar
        subjectId={subjectId}
        modules={modules}
        currentLessonId={selectedLessonId}
        currentRole={role}
        onSelectLesson={handleSelectLesson}
        onDataChange={handleDataChange}
      />

      {/* 🔹 Главная область */}
      <MainContentLayout>
        <ModuleOverview
          modules={modules}
          onDataChange={handleDataChange}
          role={role}
        />
      </MainContentLayout>
    </Box>
  );
}
