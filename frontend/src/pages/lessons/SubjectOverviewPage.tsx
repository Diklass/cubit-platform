import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SubjectSidebar } from "../../components/lessons/SubjectSidebar";
import { SubjectOverview } from "../../components/lessons/SubjectOverview";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api";
import { Box } from "@mui/material";

export default function SubjectOverviewPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const role = user?.role ?? "GUEST";
  const [modules, setModules] = useState<any[]>([]);

  // ← слушаем состояние коллапса, чтобы двигать контент
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    const handler = (e: any) => {
      setSidebarCollapsed(Boolean(e?.detail?.collapsed));
    };
    window.addEventListener("sidebar-collapsed-changed", handler);
    // на всякий случай синхронизируем из localStorage при загрузке
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
    return () => window.removeEventListener("sidebar-collapsed-changed", handler);
  }, []);

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

  // геометрия
  const PANEL_LEFT_GAP = 20;          // от края экрана до панели
  const PANEL_MAIN_GAP = 20;          // зазор между панелью и контентом
  const PANEL_WIDTH = sidebarCollapsed ? 64 : 320;
  const CONTENT_MARGIN_LEFT = PANEL_LEFT_GAP + PANEL_WIDTH + PANEL_MAIN_GAP; // ← ровно 20/20

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "#0e0f10" : "#f4f6f8",
      }}
    >
      {/* Боковая панель (fixed) */}
      <SubjectSidebar
        subjectId={subjectId}
        modules={modules}
        currentRole={role}
        onDataChange={loadModules}
        onSelectLesson={() => {}}
      />

      {/* Контентная область со сдвигом */}
      <Box
        sx={{
          flex: 1,
          marginLeft: `${CONTENT_MARGIN_LEFT}px`, // ← всегда ровно рядом с панелью
          marginTop: "20px",                      // ← отступ от шапки
          marginRight: "20px",
          marginBottom: "20px",
          transition: "margin-left 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)",
        }}
      >
        <Box
          sx={{
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: "20px",
            boxShadow: (theme) => theme.shadows[2],
            p: { xs: 2, md: 2.5 }, // 16–20px внутри белой карточки
          }}
        >
          {subjectId && (
            <SubjectOverview
              subjectId={subjectId}
              role={role}
              onDataChange={loadModules}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
