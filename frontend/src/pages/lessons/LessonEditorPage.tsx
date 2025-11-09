import React, { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  IconButton,
  Stack,
  Menu,
  MenuItem,
  Paper,
  useTheme,
} from "@mui/material";
import {
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
  Movie as MovieIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  ExpandMore,
  ExpandLess,
  Add,
} from "@mui/icons-material";

import { MainContentLayout } from "../../components/layout/MainContentLayout";
import { SubjectSidebar } from "../../components/lessons/SubjectSidebar";
import { closestCenter } from "@dnd-kit/core";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { ColorPickerPopover } from "../../components/ui/ColorPickerPopover";
import { Menu as MuiMenu, MenuItem as MuiMenuItem } from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import type { Theme } from "@mui/material/styles";
import SaveIcon from "@mui/icons-material/Save";

import { Tooltip } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Crop32RoundedIcon from "@mui/icons-material/Crop32Rounded";

import { QuizBlock } from "../../components/quiz/QuizBlock";



// === Типы ===
type Block = { type: "text" | "image" | "video" | "file"; content: string };
type Section = {
  type: "section";
  title: string;
  children: Block[];
  collapsed?: boolean;
  color?: string;
};
type Lesson = {
  id: string;
  title: string;
  content: string | null;
  module?: { id: string; title: string; subject?: { id: string; title: string } };
};
type Snapshot = { title: string; sections: Section[] };

// === Хук глобального undo/redo ===
function useGlobalUndoRedo(handleUndo: () => void, handleRedo: () => void) {
  useLayoutEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrlOrCmd) return;

      const key = e.key.toLowerCase();
      const isUndo = (key === "z" || key === "я") && !e.shiftKey;
      const isRedo = key === "y" || key === "н" || (e.shiftKey && (key === "z" || key === "я"));

      if (!isUndo && !isRedo) return;
      const active = document.activeElement;
      const tag = active?.tagName?.toLowerCase();
      const isTypingField =
        tag === "input" || tag === "textarea" || active?.closest(".ql-editor");
      if (!isTypingField) {
        e.preventDefault();
        if (isUndo) handleUndo();
        if (isRedo) handleRedo();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [handleUndo, handleRedo]);
}

// === Перетаскиваемый элемент ===
function SortableItem({
  id,
  children,
  draggingSectionId,
}: {
  id: string;
  draggingSectionId: string | null;
  children: (opts: { listeners: any }) => React.ReactNode;
}) {
  const { setNodeRef, transform, transition, attributes, listeners } = useSortable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      layout // 👈 ключ для "умной" перестановки
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      animate={{
        scale: draggingSectionId === id ? 0.97 : 1,
        opacity: draggingSectionId === id ? 0.9 : 1,
      }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 26, mass: 0.8 },
        default: { type: "spring", stiffness: 320, damping: 28 },
      }}
    >
      {children({ listeners })}
    </motion.div>
  );
}

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "error">("saved");
  const [autoSaveNotice, setAutoSaveNotice] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Цвет секции (popover)
const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
const [colorTargetIndex, setColorTargetIndex] = useState<number | null>(null);

// Меню контента (⋯)
const [blockMenuAnchor, setBlockMenuAnchor] = useState<null | HTMLElement>(null);
const [selectedBlock, setSelectedBlock] = useState<{ secIdx: number; idx: number } | null>(null);

const [fabOpen, setFabOpen] = useState(false);

const [activeId, setActiveId] = useState<string | null>(null);
const [overId, setOverId] = useState<string | null>(null);

const applyReorder = useCallback((updater: (draft: Section[]) => void) => {
  setSections((prev) => {
    const next = deepClone(prev);
    updater(next);
    return next;
  });
}, []);




const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// === Загрузка модулей для боковой панели ===
const [modules, setModules] = useState<any[]>([]);

const loadModules = async () => {
  const subjectId = lesson?.module?.subject?.id;
  if (!subjectId) return;
  try {
    const { data } = await api.get(`/subjects/${subjectId}`);
    setModules(data.tree || []);
  } catch (err) {
    console.error("Ошибка загрузки модулей:", err);
  }
};

const sidebarIcon = (theme: Theme) => ({
  color: theme.palette.text.secondary,
  transition: 'color .2s ease',
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === 'dark' ? '#3b3b3b' : '#E8EEF7',
  },
  '&:focus-visible': { color: theme.palette.primary.main },
  '&:active':        { color: theme.palette.primary.main },
});

const blockIcon = (theme: Theme) => ({
  width: 40,
  height: 40,
  borderRadius: "12px",
  ...sidebarIcon(theme),
});

const actionIcon = (theme: Theme) => ({
  width: 40,
  height: 40,
  borderRadius: 12,
  color: theme.palette.primary.main,           // базово — синий
  transition: "color .2s ease, background-color .2s ease, transform .15s ease",
  "&:hover": {
    color: theme.palette.text.secondary,       // ховер — серый
    backgroundColor: theme.palette.mode === "dark" ? "#3b3b3b" : "#E8EEF7",
  },
  "&:active": { transform: "scale(0.97)" },
  "&.Mui-disabled": { color: theme.palette.action.disabled },
});

// подгружаем модули, когда урок загружен
useEffect(() => {
  if (lesson?.module?.subject?.id) loadModules();
}, [lesson]);
  

  // === Загрузка урока ===
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Lesson>(`/subjects/lessons/${id}`)
      .then((r) => {
        setLesson(r.data);
        setTitle(r.data.title);
        const parsed = JSON.parse(r.data.content || "[]") as Section[];
        setSections(Array.isArray(parsed) ? parsed : []);
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [id]);

  // === Undo/Redo и история ===
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const applyChange = useCallback(
    (producer: (draft: Snapshot) => void) => {
      setHistory((prev) => {
        const current =
          historyIndex >= 0
            ? deepClone(prev[historyIndex])
            : { title, sections: deepClone(sections) };
        const draft = deepClone(current);
        producer(draft);
        const newHistory = [...prev.slice(0, historyIndex + 1), draft].slice(-50);
        setHistoryIndex(newHistory.length - 1);
        setTitle(draft.title);
        setSections(draft.sections);
        return newHistory;
      });
    },
    [historyIndex, title, sections]
  );

  const handleUndo = useCallback(() => {
    setHistoryIndex((i) => {
      const newIndex = Math.max(0, i - 1);
      const snap = history[newIndex];
      if (snap) {
        setTitle(snap.title);
        setSections(deepClone(snap.sections));
      }
      return newIndex;
    });
  }, [history]);

  const handleRedo = useCallback(() => {
    setHistoryIndex((i) => {
      const newIndex = Math.min(history.length - 1, i + 1);
      const snap = history[newIndex];
      if (snap) {
        setTitle(snap.title);
        setSections(deepClone(snap.sections));
      }
      return newIndex;
    });
  }, [history]);

  useGlobalUndoRedo(handleUndo, handleRedo);

  // === Сохранение ===
  const handleSave = useCallback(async () => {
    if (!id) return;
    try {
      await api.patch(`/subjects/lessons/${id}`, {
        title,
        content: JSON.stringify(sections),
      });
      setSaveStatus("saved");
      setAutoSaveNotice(true);
      setTimeout(() => setAutoSaveNotice(false), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, [id, title, sections]);

  useEffect(() => {
    if (!lesson) return;
    setSaveStatus("unsaved");
    const timeout = setTimeout(() => handleSave(), 2500);
    return () => clearTimeout(timeout);
  }, [sections, title]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);


  // === UI ===
  if (loading) return <CircularProgress />;
  if (!lesson) return <Typography color="error">Ошибка: урок не найден</Typography>;

 const handleDragStart = (event: DragStartEvent) => {
  const id = String(event.active.id);
  setActiveId(id);
  setDraggingSectionId(id);

  const index = parseInt(id.split("-")[1], 10);
  applyChange((d) => {
    if (d.sections[index]) d.sections[index].collapsed = true;
  });
};

const handleDragOver = (event: any) => {
  const { over } = event;
  if (over) setOverId(String(over.id));
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setDraggingSectionId(null);
  setActiveId(null);
  setOverId(null);

  if (!over || active.id === over.id) return;

  const oldIndex = parseInt(String(active.id).split("-")[1], 10);
  const newIndex = parseInt(String(over.id).split("-")[1], 10);

setSections((prev) => arrayMove(prev, oldIndex, newIndex));
};

  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
        transition: "all 0.3s ease",
      }}
    >
      {/* === Левая панель === */}
      {lesson?.module?.subject?.id && (
        <SubjectSidebar
          subjectId={lesson.module!.subject!.id}
          modules={modules}
          currentLessonId={id}
          currentRole="TEACHER"
          onSelectLesson={(lessonId) =>
            navigate(`/lessons/${lesson.module!.subject!.id}?lessonId=${lessonId}`)
          }
          onDataChange={loadModules}
        />
      )}

      <ColorPickerPopover
        color={
          colorTargetIndex !== null
            ? sections[colorTargetIndex]?.color || "#3b82f6"
            : "#3b82f6"
        }
        onChange={(newColor) => {
          if (colorTargetIndex !== null) {
            applyChange((d) => {
              d.sections[colorTargetIndex].color = newColor;
            });
          }
        }}
        anchorEl={colorAnchor}
        onClose={() => {
          setColorAnchor(null);
          setColorTargetIndex(null);
        }}
      />

      {/* === Главная область === */}
      <MainContentLayout>
        {/* === Заголовок урока и статус === */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 4, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}
        >
          <Typography
            variant="h4"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e: React.FocusEvent<HTMLHeadingElement>) => {
              const newTitle = e.currentTarget.textContent?.trim() || "";
              applyChange((d) => {
                d.title = newTitle;
              });
            }}
            sx={{
              fontWeight: 700,
              outline: "none",
              cursor: "text",
              "&:hover": { color: theme.palette.primary.main },
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: 14,
              backgroundColor:
                saveStatus === "saved"
                  ? "rgba(76, 175, 80, 0.15)"
                  : saveStatus === "unsaved"
                  ? "rgba(255, 193, 7, 0.15)"
                  : "rgba(244, 67, 54, 0.15)",
              color:
                saveStatus === "saved"
                  ? "#4CAF50"
                  : saveStatus === "unsaved"
                  ? "#FFC107"
                  : "#F44336",
            }}
          >
            {saveStatus === "saved" && "✅ Сохранено"}
            {saveStatus === "unsaved" && "💾 Не сохранено"}
            {saveStatus === "error" && "❌ Ошибка"}
          </Box>
        </Stack>

        {/* === Секции === */}
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={sections.map((_, i) => `section-${i}`)}
    strategy={verticalListSortingStrategy}
  >
    <AnimatePresence>
      {sections.map((section, secIdx) => (
        <SortableItem
          key={`section-${secIdx}`}
          id={`section-${secIdx}`}
          draggingSectionId={draggingSectionId}
        >
          {({ listeners }) => {
            const isDraggingThis = draggingSectionId === `section-${secIdx}`;
            const isOverThis = overId === `section-${secIdx}`;

            return (
              <motion.div
                layout
                layoutId={`section-${secIdx}`}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                  mass: 0.8,
                }}
                animate={{
                  scale: isDraggingThis ? 0.97 : 1,
                  opacity: isDraggingThis ? 0.9 : 1,
                  y: isOverThis ? -4 : 0,
                  boxShadow: isOverThis
                    ? theme.palette.mode === "dark"
                      ? "0 6px 16px rgba(255,255,255,0.1)"
                      : "0 6px 16px rgba(0,0,0,0.15)"
                    : "none",
                }}
              >
                {/* Карточка секции */}
                <Box
                  {...listeners}
                  sx={(theme: Theme) => ({
                    mb: 5,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    transition: "all .3s cubic-bezier(0.25,1,0.5,1)",
                    overflow: "hidden",
                    p: 2,
                  })}
                >
                  {/* Подсветка места перетаскивания */}
                  <AnimatePresence>
                    {isOverThis && draggingSectionId && (
                      <motion.div
                        key={`placeholder-${secIdx}`}
                        initial={{ opacity: 0, scaleY: 0.4 }}
                        animate={{
                          opacity: 1,
                          scaleY: 1,
                          boxShadow: [
                            "0 0 0 rgba(0,0,0,0)",
                            theme.palette.mode === "dark"
                              ? "0 0 10px rgba(255,255,255,0.25)"
                              : "0 0 10px rgba(0,0,0,0.1)",
                            "0 0 0 rgba(0,0,0,0)",
                          ],
                        }}
                        exit={{ opacity: 0, scaleY: 0.4 }}
                        transition={{
                          repeat: isDraggingThis ? Infinity : 0,
                          duration: 1.2,
                          ease: "easeInOut",
                        }}
                        style={{
                          height: 14,
                          borderRadius: 6,
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(0,0,0,0.08)",
                          marginBottom: 12,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Шапка секции */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={(theme: Theme) => ({
                      mb: 1.5,
                      borderBottom: `3px solid ${
                        section.color || theme.palette.primary.main
                      }`,
                      pb: 0.5,
                      cursor: "grab",
                      userSelect: isDraggingThis ? "none" : "text",
                    })}
                  >
                    {/* Название секции */}
                    <Typography
                      variant="h6"
                      contentEditable={!isDraggingThis}
                      suppressContentEditableWarning
                      onBlur={(e: React.FocusEvent<HTMLHeadingElement>) =>
                        applyChange((d) => {
                          d.sections[secIdx].title =
                            e.currentTarget.textContent || "";
                        })
                      }
                      sx={{
                        outline: "none",
                        fontWeight: 600,
                        cursor: isDraggingThis ? "grabbing" : "text",
                        flexGrow: 1,
                        mr: 2,
                      }}
                    >
                      {section.title || "Без названия"}
                    </Typography>

                    {/* Кнопки секции */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.3}
                      sx={{ opacity: isDraggingThis ? 0.6 : 1 }}
                    >
                      {/* Индикатор цвета / выбор цвета */}
                      <Box
                        sx={(theme: Theme) => ({
                          width: 20,
                          height: 20,
                          borderRadius: "4px",
                          backgroundColor:
                            section.color || theme.palette.primary.main,
                          border: `1px solid ${theme.palette.divider}`,
                          cursor: "pointer",
                        })}
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          if (isDraggingThis) return;
                          setColorAnchor(e.currentTarget);
                          setColorTargetIndex(secIdx);
                        }}
                      />

                      {/* Свернуть/развернуть */}
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (isDraggingThis) return;
                          applyChange((d) => {
                            d.sections[secIdx].collapsed =
                              !d.sections[secIdx].collapsed;
                          });
                        }}
                        sx={(theme: Theme) => sidebarIcon(theme)}
                      >
                        {section.collapsed ? (
                          <ExpandMoreRoundedIcon fontSize="small" />
                        ) : (
                          <ExpandLessRoundedIcon fontSize="small" />
                        )}
                      </IconButton>

                      {/* Вверх */}
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (isDraggingThis) return;
                          applyChange((d) => {
                            if (secIdx > 0) {
                              const [moved] = d.sections.splice(secIdx, 1);
                              d.sections.splice(secIdx - 1, 0, moved);
                            }
                          });
                        }}
                        sx={(theme: Theme) => ({
    width: 32,
    height: 32,
    borderRadius: "12px",
    ...sidebarIcon(theme),
  })}
                      >
                        <ArrowUpwardRoundedIcon fontSize="small" />
                      </IconButton>

                      {/* Вниз */}
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (isDraggingThis) return;
                          applyChange((d) => {
                            if (secIdx < d.sections.length - 1) {
                              const [moved] = d.sections.splice(secIdx, 1);
                              d.sections.splice(secIdx + 1, 0, moved);
                            }
                          });
                        }}
                        sx={(theme: Theme) => ({
    width: 32,
    height: 32,
    borderRadius: "12px",
    ...sidebarIcon(theme),
  })}
                      >
                        <ArrowDownwardRoundedIcon fontSize="small" />
                      </IconButton>

                      {/* Удалить секцию */}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (isDraggingThis) return;
                          if (
                            confirm(`Удалить секцию "${section.title}"?`)
                          ) {
                            applyChange((d) =>
                              d.sections.splice(secIdx, 1)
                            );
                          }
                        }}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "12px",
                          "&:hover": {
                            backgroundColor:
                              theme.palette.mode === "dark"
                                ? "rgba(255,0,0,0.08)"
                                : "rgba(255,0,0,0.06)",
                          },
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* Контент секции */}
                  <AnimatePresence initial={false}>
                    {!section.collapsed && (
                      <motion.div
                        key={`section-content-${secIdx}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 220,
                          damping: 30,
                        }}
                        style={{ overflow: "hidden" }}
                      >
                        {/* Блоки внутри секции */}
                        <Box sx={{ pl: 1, pb: 1 }}>
                          {section.children.map((b, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                position: "relative",
                                mb: 2,
                                p: 2,
                                borderRadius: 2,
                                backgroundColor:
                                  theme.palette.background.paper,
                                "&:hover .block-tools": {
                                  opacity: 1,
                                  transform: "scale(1)",
                                },
                              }}
                            >
                              {b.type === "text" && (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: b.content,
                                  }}
                                />
                              )}

                              {b.type === "image" && (
                                <img
                                  src={b.content}
                                  alt=""
                                  style={{
                                    maxWidth: "100%",
                                    borderRadius: 8,
                                  }}
                                />
                              )}

                              {/* кнопка ⋯ для блока */}
<IconButton
  size="small"
  className="block-tools"
  sx={(theme: Theme) => ({
    position: "absolute",
    top: 6,
    right: 6,
    opacity: blockMenuAnchor ? 1 : 0,
    transform: "scale(0.95)",

    width: 32,
    height: 32,
    borderRadius: "12px",

    // ✅ никаких transition здесь
    ...sidebarIcon(theme), // содержит transition, но только color
  })}
  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setBlockMenuAnchor(e.currentTarget);
    setSelectedBlock({ secIdx, idx });
  }}
>
  <MoreVertIcon fontSize="small" />
</IconButton>
                            </Box>
                          ))}

                          {/* Плавающая кнопка + варианты (FAB) */}
                          <Box
                            sx={{
                              position: "relative",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              mt: 4,
                            }}
                          >
                            {/* Список вариантов */}
                            <AnimatePresence>
                              {fabOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 30 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 30 }}
                                  transition={{ duration: 0.25 }}
                                  style={{
                                    position: "absolute",
                                    bottom: 76,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "12px",
                                    zIndex: 20,
                                  }}
                                >
                                  {[
                                    {
                                      icon: <TextFieldsIcon />,
                                      label: "Текст",
                                      type: "text" as const,
                                    },
                                    {
                                      icon: <ImageIcon />,
                                      label: "Изображение",
                                      type: "image" as const,
                                    },
                                    {
                                      icon: <MovieIcon />,
                                      label: "Видео",
                                      type: "video" as const,
                                    },
                                    {
                                      icon: <AttachFileIcon />,
                                      label: "Файл",
                                      type: "file" as const,
                                    },
                                  ].map((item, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{
                                        opacity: 0,
                                        scale: 0.9,
                                        y: 10,
                                      }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                      }}
                                      exit={{
                                        opacity: 0,
                                        scale: 0.8,
                                        y: 10,
                                      }}
                                      transition={{
                                        delay: i * 0.05,
                                      }}
                                    >
                                      <Button
                                        variant="contained"
                                        startIcon={item.icon}
                                        onClick={() => {
                                          applyChange((d) => {
                                            const newBlock: Block =
                                              item.type === "text"
                                                ? {
                                                    type: "text",
                                                    content:
                                                      "<p>Новый текст</p>",
                                                  }
                                                : item.type === "image"
                                                ? {
                                                    type: "image",
                                                    content:
                                                      "https://placehold.co/600x400",
                                                  }
                                                : item.type === "video"
                                                ? {
                                                    type: "video",
                                                    content:
                                                      "https://www.youtube.com/embed/dQw4w9WgXcQ",
                                                  }
                                                : {
                                                    type: "file",
                                                    content:
                                                      "https://example.com/file.pdf",
                                                  };
                                            d.sections[
                                              secIdx
                                            ].children.push(newBlock);
                                          });
                                          setFabOpen(false);
                                        }}
                                        sx={(theme: Theme) => ({
                                          borderRadius: "9999px",
                                          textTransform: "none",
                                          fontWeight: 600,
                                          fontSize: "0.95rem",
                                          px: 3,
                                          py: 1.2,
                                          minWidth: 180,
                                          justifyContent: "center",
                                          alignItems: "center",
                                          gap: 1.2,
                                          boxShadow:
                                            theme.palette.mode === "dark"
                                              ? "0 3px 8px rgba(0,0,0,0.5)"
                                              : "0 3px 8px rgba(0,0,0,0.15)",
                                          backgroundColor:
                                            theme.palette.mode === "dark"
                                              ? "#3b3b3b"
                                              : "#DCE9F5",
                                          color:
                                            theme.palette.text.primary,
                                          "&:hover": {
                                            backgroundColor:
                                              theme.palette.mode ===
                                              "dark"
                                                ? "#4a4a4a"
                                                : "#cdddeb",
                                          },
                                          "&:active": {
                                            backgroundColor:
                                              theme.palette.primary.main,
                                            color: "#fff",
                                          },
                                        })}
                                      >
                                        {item.label}
                                      </Button>
                                      
                                    </motion.div>
                                  ))}
                                  
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Главная круглая кнопка + */}
                            <IconButton
                              onClick={() => setFabOpen(!fabOpen)}
                              sx={(theme: Theme) => ({
                                width: 58,
                                height: 58,
                                borderRadius: "50%",
                                backgroundColor: fabOpen
                                  ? theme.palette.primary.main
                                  : theme.palette.mode === "dark"
                                  ? "#3b3b3b"
                                  : "#DCE9F5",
                                color: fabOpen
                                  ? "#fff"
                                  : theme.palette.text.primary,
                               
                                "&:hover": {
                                  backgroundColor: fabOpen
                                    ? theme.palette.primary.dark
                                    : theme.palette.mode === "dark"
                                    ? "#4a4a4a"
                                    : "#cdddeb",
                                  transform: "scale(1.05)",
                                },
                                transition: "all 0.25s ease",
                                zIndex: 25,
                              })}
                            >
                              <motion.div
                                animate={{
                                  rotate: fabOpen ? 45 : 0,
                                }}
                                transition={{ duration: 0.25 }}
                              >
                                <AddRoundedIcon fontSize="large" />
                              </motion.div>
                            </IconButton>
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </motion.div>
            );
          }}
        </SortableItem>
      ))}
    </AnimatePresence>
  </SortableContext>
</DndContext>

   <Box sx={{ mt: 6 }}>
     <QuizBlock lessonId={id!} />
   </Box>
</MainContentLayout>

{/* === Меню блока (⋯) === */}
<MuiMenu
  anchorEl={blockMenuAnchor}
  open={Boolean(blockMenuAnchor)}
  onClose={() => setBlockMenuAnchor(null)}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  transformOrigin={{ vertical: "top", horizontal: "center" }}
  TransitionProps={{ timeout: 160 }}
  PaperProps={{
    sx: {
      mt: 0.5,
      borderRadius: "16px",
      px: 1,
      py: 1,
      backgroundColor: theme.palette.background.paper,
      boxShadow:
        theme.palette.mode === "dark"
          ? "0 12px 32px rgba(0,0,0,0.7)"
          : "0 12px 32px rgba(0,0,0,0.12)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0.5,
      minWidth: 48,
    },
  }}
  MenuListProps={{
    sx: {
      p: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0.5,
    },
  }}
>
  {/* === Действия меню блока === */}
  <IconButton
    size="small"
    sx={(theme: Theme) => blockIcon(theme)}
    onClick={() => {
      if (!selectedBlock) return;
      alert("Изменение контента пока не реализовано");
    }}

  >
    <EditOutlinedIcon fontSize="small" />
  </IconButton>

  <IconButton
    size="small"
    sx={(theme: Theme) => blockIcon(theme)}
    onClick={() => {
      if (!selectedBlock) return;
      applyChange((d) => {
        const { secIdx, idx } = selectedBlock;
        if (idx > 0) {
          const [moved] = d.sections[secIdx].children.splice(idx, 1);
          d.sections[secIdx].children.splice(idx - 1, 0, moved);
        }
      });
    }}

  >
    <ArrowUpwardRoundedIcon fontSize="small" />
  </IconButton>

  <IconButton
    size="small"
    sx={(theme: Theme) => blockIcon(theme)}
    onClick={() => {
      if (!selectedBlock) return;
      applyChange((d) => {
        const { secIdx, idx } = selectedBlock;
        const len = d.sections[secIdx].children.length;
        if (idx < len - 1) {
          const [moved] = d.sections[secIdx].children.splice(idx, 1);
          d.sections[secIdx].children.splice(idx + 1, 0, moved);
        }
      });
    }}
  >
    <ArrowDownwardRoundedIcon fontSize="small" />
  </IconButton>

  <IconButton
    size="small"
    onClick={() => {
      if (!selectedBlock) return;
      const { secIdx, idx } = selectedBlock;
      applyChange((d) => d.sections[secIdx].children.splice(idx, 1));
      setBlockMenuAnchor(null);
    }}
    sx={{
      width: 40,
      height: 40,
      borderRadius: "12px",
      color: theme.palette.error.main,
      "&:hover": {
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,0,0,0.08)"
            : "rgba(255,0,0,0.06)",
      },
    }}
  >
    <DeleteOutlineRoundedIcon fontSize="small" />
  </IconButton>
</MuiMenu>


{/* === Нижняя плавающая панель действий === */}
<Box
  sx={{
    position: "fixed",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 100,
  }}
>
 <Paper
  elevation={5}
  sx={(theme: Theme) => ({
    borderRadius: "999px",
    px: 2,
    py: 0.75,
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    backdropFilter: "blur(16px)",
    backgroundColor:
      theme.palette.mode === "dark" ? "rgba(30,30,30,0.75)" : "rgba(255,255,255,0.75)",
    border: `1px solid ${
      theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
    }`,
  })}
>
  {/* Undo */}
  <Tooltip title="Отменить">
    <span>
      <IconButton
        onClick={handleUndo}
        disabled={historyIndex <= 0}
        sx={(theme: Theme) => actionIcon(theme)}
      >
        <ArrowBackIosNewRoundedIcon />
      </IconButton>
    </span>
  </Tooltip>

  {/* Redo */}
  <Tooltip title="Повторить">
    <span>
      <IconButton
        onClick={handleRedo}
        disabled={historyIndex >= history.length - 1}
        sx={(theme: Theme) => actionIcon(theme)}
      >
        <ArrowForwardIosRoundedIcon />
      </IconButton>
    </span>
  </Tooltip>

  {/* Save (outline) */}
  <Tooltip title="Сохранить">
    <IconButton
      onClick={handleSave}
      sx={(theme: Theme) => actionIcon(theme)}
    >
      <SaveOutlinedIcon />
    </IconButton>
  </Tooltip>

  {/* New Section — квадрат в рамке */}
  <Tooltip title="Новая секция">
    <IconButton
      onClick={() =>
        applyChange((d) =>
          d.sections.push({ type: "section", title: "Новая секция", children: [] })
        )
      }
      sx={(theme: Theme) => actionIcon(theme)}
    >
      <Crop32RoundedIcon />
    </IconButton>
  </Tooltip>

  {/* Плюс — будущая область теста */}
  <Tooltip title="Добавить область теста">
    <IconButton
      onClick={() => {
        // пока просто заглушка, позже подключим логику “области теста”
        console.log("TODO: добавить область теста");
      }}
      sx={(theme: Theme) => actionIcon(theme)}
    >
      <AddRoundedIcon />
    </IconButton>
  </Tooltip>
</Paper>

</Box>

{/* === Меню выбора типа контента === */}
<Menu
  anchorEl={menuAnchor}
  open={Boolean(menuAnchor)}
  onClose={() => setMenuAnchor(null)}
>
  <MenuItem
    onClick={() => {
      const sectionIndex = sections.findIndex((s) =>
        s.children.some(() => true)
      );
      if (sectionIndex === -1) return;
      applyChange((d) =>
        d.sections[sectionIndex].children.push({
          type: "text",
          content: "<p>Новый текст</p>",
        })
      );
      setMenuAnchor(null);
    }}
  >
    <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} /> Текст
  </MenuItem>

  <MenuItem
    onClick={() => {
      const sectionIndex = sections.findIndex((s) =>
        s.children.some(() => true)
      );
      if (sectionIndex === -1) return;
      applyChange((d) =>
        d.sections[sectionIndex].children.push({
          type: "image",
          content: "https://placehold.co/600x400",
        })
      );
      setMenuAnchor(null);
    }}
  >
    <ImageIcon fontSize="small" sx={{ mr: 1 }} /> Изображение
  </MenuItem>

  <MenuItem
    onClick={() => {
      const sectionIndex = sections.findIndex((s) =>
        s.children.some(() => true)
      );
      if (sectionIndex === -1) return;
      applyChange((d) =>
        d.sections[sectionIndex].children.push({
          type: "video",
          content: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        })
      );
      setMenuAnchor(null);
    }}
  >
    <MovieIcon fontSize="small" sx={{ mr: 1 }} /> Видео
  </MenuItem>

  <MenuItem
    onClick={() => {
      const sectionIndex = sections.findIndex((s) =>
        s.children.some(() => true)
      );
      if (sectionIndex === -1) return;
      applyChange((d) =>
        d.sections[sectionIndex].children.push({
          type: "file",
          content: "https://example.com/file.pdf",
        })
      );
      setMenuAnchor(null);
    }}
  >
    <AttachFileIcon fontSize="small" sx={{ mr: 1 }} /> Файл
  </MenuItem>
</Menu>

</Box>

)};
