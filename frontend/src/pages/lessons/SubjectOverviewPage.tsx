// src/pages/SubjectOverviewPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box } from "@mui/material";
import { SubjectSidebar } from "../../components/lessons/SubjectSidebar";
import { SubjectOverview } from "../../components/lessons/SubjectOverview";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api";
import { MainContentLayout } from "../../components/layout/MainContentLayout";
import type { Theme } from "@mui/material/styles";

export default function SubjectOverviewPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
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

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: (theme:Theme) => theme.palette.background.default,
      }}
    >
      <SubjectSidebar
        subjectId={subjectId}
        modules={modules}
        currentRole={role}
        onDataChange={loadModules}
        onSelectLesson={() => {}}
      />

      <MainContentLayout>
        {subjectId && (
          <SubjectOverview
            subjectId={subjectId}
            role={role}
            onDataChange={loadModules}
          />
        )}
      </MainContentLayout>
    </Box>
  );
}
