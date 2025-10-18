// src/components/SubjectSidebar.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import api from "../api";
import { SidebarTree, ModuleNode } from "./SidebarTree";

interface SubjectSidebarProps {
  subjectId?: string;
  currentLessonId?: string;
  currentRole?: "ADMIN" | "TEACHER" | "STUDENT" | "GUEST";
  onSelectLesson: (lessonId: string) => void;
  collapsible?: boolean;
  storageKey?: string;
}

export const SubjectSidebar: React.FC<SubjectSidebarProps> = ({
  subjectId,
  currentLessonId,
  currentRole = "TEACHER",
  onSelectLesson,
  collapsible = true,
  storageKey = "subjectSidebar:isOpen",
}) => {
  const [tree, setTree] = useState<ModuleNode[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const isReadonly = currentRole === "STUDENT" || currentRole === "GUEST";

  // === открыт/закрыт (с памятью) ===
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw === null ? true : JSON.parse(raw);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(isOpen));
    } catch {}
  }, [isOpen, storageKey]);

  // === Загрузка дерева ===
  const loadTree = async () => {
    if (!subjectId) return;
    try {
      const { data } = await api.get(`/subjects/${subjectId}`);
      setTree(data.tree || []);
    } catch (err) {
      console.error("Ошибка загрузки дерева:", err);
      setTree([]);
    }
  };

  useEffect(() => {
    loadTree();
  }, [subjectId]);

  // === Добавление модуля (только для преподавателя) ===
  const handleAddModule = async () => {
    if (!subjectId || !newModuleTitle.trim()) return;
    await api.post(`/subjects/${subjectId}/modules`, { title: newModuleTitle });
    setNewModuleTitle("");
    await loadTree();
  };

  // === Добавление урока ===
  const handleAddLesson = async (moduleId: string) => {
    const title = prompt("Введите название нового урока:");
    if (!title) return;
    await api.post(`/subjects/modules/${moduleId}/lessons`, { title });
    await loadTree();
  };

  // === Удаление урока ===
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Удалить этот урок?")) return;
    await api.delete(`/subjects/lessons/${lessonId}`);
    await loadTree();
  };

  // === Удаление модуля ===
  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Удалить модуль со всеми уроками?")) return;
    await api.delete(`/subjects/modules/${moduleId}`);
    await loadTree();
  };

  const sidebarWidth = isOpen ? 320 : 56;

  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        width: sidebarWidth,
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "width 200ms ease",
      })}
    >
      {/* Toggle */}
      {collapsible && (
        <Tooltip title={isOpen ? "Свернуть" : "Развернуть"} placement="right">
          <IconButton
            size="small"
            onClick={() => setIsOpen((v) => !v)}
            sx={{
              position: "absolute",
              top: 8,
              right: isOpen ? 8 : "auto",
              left: isOpen ? "auto" : 8,
              zIndex: 2,
            }}
          >
            {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      )}

      {isOpen ? (
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 0,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {/* Добавление модуля — только не для студентов */}
          {!isReadonly && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Новый модуль"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleAddModule}>
                +
              </Button>
            </Box>
          )}

          <Divider />

          <SidebarTree
            tree={tree}
            selectedLessonId={currentLessonId}
            onSelectLesson={onSelectLesson}
            currentRole={currentRole}
            onAddLesson={!isReadonly ? handleAddLesson : undefined}
            onDeleteLesson={!isReadonly ? handleDeleteLesson : undefined}
            onDeleteModule={!isReadonly ? handleDeleteModule : undefined}
          />
        </Box>
      ) : (
        <Box sx={{ flex: 1 }} />
      )}
    </Box>
  );
};
