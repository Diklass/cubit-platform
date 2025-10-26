// src/pages/lessons/LessonContentPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { LessonContent } from "../../components/lessons/LessonContent";
import { SubjectSidebar } from "../../components/lessons/SubjectSidebar";
import { MainContentLayout } from "../../components/layout/MainContentLayout";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api";
import type { Theme } from "@mui/material/styles";

export default function LessonContentPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? "GUEST";

  const [lesson, setLesson] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // === Загружаем данные урока ===
  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    api
      .get(`/subjects/lessons/${lessonId}`)
      .then((r) => {
        const data = r.data;
        setLesson(data);

        // ✅ пробуем вытащить subjectId из разных мест
        const sId =
          data.module?.subject?.id ||
          data.subjectId ||
          data.module?.subjectId ||
          null;
        setSubjectId(sId);

      
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  // === Загружаем дерево модулей ===
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
    if (subjectId) loadModules();
  }, [subjectId]);

  if (loading) return <Box sx={{ p: 4 }}>Загрузка...</Box>;
  if (!lesson) return <Box sx={{ p: 4, color: "error.main" }}>Ошибка: урок не найден</Box>;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: (theme: Theme) => theme.palette.background.default,
      }}
    >
      {/* === Левая боковая панель === */}
      {subjectId && (
        <SubjectSidebar
          subjectId={subjectId}
          modules={modules}
          currentLessonId={lessonId}
          currentRole={role}
          onDataChange={loadModules}
          // ✅ путь совпадает с App.tsx (/lessons/view/:lessonId)
          onSelectLesson={(newLessonId) => navigate(`/lessons/view/${newLessonId}`)}
        />
      )}

      {/* === Основной контент === */}
      <MainContentLayout>
        <LessonContent lessonId={lessonId} />
      </MainContentLayout>
    </Box>
  );
}
