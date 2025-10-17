// src/pages/LessonEditorPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
  Stack,
  Snackbar,
  Menu,
  MenuItem,
  TextField,
  Select,
} from "@mui/material";

import TextFieldsIcon from "@mui/icons-material/TextFields";
import ImageIcon from "@mui/icons-material/Image";
import MovieIcon from "@mui/icons-material/Movie";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { useLayoutEffect } from "react";

import { useCallback } from "react";

import { SidebarTree, ModuleNode } from "../components/SidebarTree";
import { SubjectSidebar } from "../components/SubjectSidebar";

import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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
  subjectId?: string;
  module?: {
    id: string;
    title: string;
    subject?: {
      id: string;
      title: string;
    };
  };
};

type Snapshot = { title: string; sections: Section[] };

// === SortableItem (перетаскиваемый блок) ===
function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (opts: { listeners: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ listeners })}
    </div>
  );
}

// === DroppableSection (зона для сброса внутри секции) ===
function DroppableSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        mb: 4,
        p: 0,
        borderRadius: 2,
        transition: "background-color 120ms",
        backgroundColor: isOver ? "action.hover" : "transparent",
      }}
    >
      {children}
    </Box>
  );
}


function useGlobalUndoRedo(handleUndo: () => void, handleRedo: () => void) {
  useLayoutEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrlOrCmd) return;

      const key = e.key.toLowerCase();

      // Поддержка английской и русской раскладки
      const isUndo = (key === "z" || key === "я") && !e.shiftKey;
      const isRedo =
        key === "y" ||
        key === "н" ||
        (e.shiftKey && (key === "z" || key === "я"));

      if (!isUndo && !isRedo) return;

      // Проверяем, не в поле ввода ли мы (input, textarea)
      const active = document.activeElement;
      const tag = active?.tagName?.toLowerCase();
      const isTypingField =
        tag === "input" || tag === "textarea" || active?.closest(".ql-editor");

      // Если пользователь реально вводит текст — Quill обрабатывает сам
      // Но если редактируется структура (секции/блоки) — перехватываем
      if (!isTypingField) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isUndo) handleUndo();
        if (isRedo) handleRedo();
      }
    };

    // useLayoutEffect ставит слушатель раньше React/Quill
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [handleUndo, handleRedo]);
}

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState(false);

  const [deletedBlock, setDeletedBlock] = useState<Block | null>(null);
  const [deletedIndex, setDeletedIndex] = useState<number | null>(null);
  const [deletedSection, setDeletedSection] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const [lastSaved, setLastSaved] = useState<Section[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [autoSaveNotice, setAutoSaveNotice] = useState(false);

  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "error">("saved");

  // Хранит до 3 последних версий урока
const [history, setHistory] = useState<Snapshot[]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);

  const historyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotRef = useRef<string>("");

  const [newModuleTitle, setNewModuleTitle] = useState("");


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  
const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const eq = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);



  // === Загрузка урока ===
   useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Lesson>(`/subjects/lessons/${id}`)
      .then((r) => {
        console.log("Ответ от сервера для урока:", r.data);
        setLesson(r.data);
        setTitle(r.data.title);
        let parsed: Section[] = [];
        try {
          parsed = JSON.parse(r.data.content || "[]");
        } catch {
          parsed = [];
        }
        if (!Array.isArray(parsed) || parsed.length === 0)
          parsed = [{ type: "section", title: "Основная секция", children: [] }];

        setSections(parsed);
        const firstSnap = { title: r.data.title, sections: deepClone(parsed) };
        setHistory([firstSnap]);
        setHistoryIndex(0);
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [id]);


    const applyChange = useCallback(
    (producer: (draft: Snapshot) => void) => {
      setHistory((prev) => {
        const current =
          historyIndex >= 0
            ? deepClone(prev[historyIndex])
            : { title, sections: deepClone(sections) };

        const before = deepClone(current);
        const draft = deepClone(current);
        if (!Array.isArray(draft.sections)) draft.sections = [];
        try {
          producer(draft);
        } catch (err) {
          console.error("Ошибка applyChange:", err);
          return prev;
        }
        if (eq(before, draft)) return prev;

        const newHistory = [
          ...prev.slice(0, historyIndex + 1),
          draft,
        ].slice(-50);

        setHistoryIndex(newHistory.length - 1);
        setTitle(draft.title);
        setSections(deepClone(draft.sections));
        return newHistory;
      });
    },
    [historyIndex, title, sections]
  );

    // === Undo / Redo функции ===
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


 

// === Инициализация истории при загрузке ===
useEffect(() => {
  if (!loading && lesson) {
    const first = { title, sections: deepClone(sections) };
    setHistory([first]);
    setHistoryIndex(0);
  }
}, [loading, lesson]);




  // === Загрузка файлов ===
  const uploadLessonFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/uploads", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return `http://localhost:3001${data.url}`;
  };

  // === Добавление секции ===
const handleAddSection = () => {
  applyChange((d) => {
    d.sections.push({ type: "section", title: "Новая секция", children: [] });
  });
};

// === Добавление блока ===
const handleAddBlock = (type: Block["type"], secIdx = 0) => {
  applyChange((d) => {
    d.sections[secIdx].children.push({ type, content: "" });
  });
  setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  setMenuAnchor(null);
};



// === Удаление блока ===
const handleDeleteBlock = (secIdx: number, idx: number) => {
  if (confirm("Удалить этот блок?")) {
    applyChange((d) => {
      d.sections[secIdx].children.splice(idx, 1);
    });
  }
};

// === Перетаскивание (внутри и между секциями) ===
const handleDragEnd = ({ active, over }: DragEndEvent) => {
  if (!over) return;

  // перетаскивание секции
  if (String(active.id).startsWith("section-") && String(over.id).startsWith("section-")) {
    const from = Number(String(active.id).split("-")[1]);
    const to = Number(String(over.id).split("-")[1]);
    if (from === to) return;

    applyChange((d) => {
      const [moved] = d.sections.splice(from, 1);
      d.sections.splice(to, 0, moved);
    });
  }

  // перетаскивание блока
  const [fromSec, fromIdx] = String(active.id).split("-").map(Number);
  let toSec: number, toIdx: number;
  if (String(over.id).startsWith("section-")) {
    toSec = Number(String(over.id).split("-")[1]);
    toIdx = sections[toSec].children.length;
  } else {
    [toSec, toIdx] = String(over.id).split("-").map(Number);
  }

  if (fromSec === toSec && fromIdx === toIdx) return;

  applyChange((d) => {
    const [moved] = d.sections[fromSec].children.splice(fromIdx, 1);
    d.sections[toSec].children.splice(toIdx, 0, moved);
  });
};

// === Добавляем снимок в историю (до 3 последних версий) ===
const pushToHistory = (snapshot: Section[]) => {
  setHistory((prev) => {
    const clone = JSON.parse(JSON.stringify(snapshot));
    const updated = [...prev.slice(-2), clone]; // храним максимум 3
    setHistoryIndex(updated.length - 1); // указываем на последнее
    return updated;
  });
};



  // === Сохранение урока ===
const handleSave = useCallback(async () => {
  if (!id) return;
  try {
    setSaveStatus("unsaved");
    await api.patch(`/subjects/lessons/${id}`, {
      title,
      content: JSON.stringify(sections),
    });
    setLastSaved(JSON.parse(JSON.stringify(sections)));
    setLastSavedAt(new Date().toLocaleTimeString());
    setSaveStatus("saved");
    setAutoSaveNotice(true);
    setTimeout(() => setAutoSaveNotice(false), 2000);
  } catch (err) {
    console.error("Ошибка при сохранении:", err);
    setSaveStatus("error");
  }
}, [id, title, sections]);


const handleUndoDelete = () => {
  if (
    deletedBlock !== null &&
    deletedIndex !== null &&
    deletedSection !== null
  ) {
    applyChange((d) => {
      d.sections[deletedSection].children.splice(deletedIndex, 0, deletedBlock);
    });
  }
  setDeletedBlock(null);
  setDeletedIndex(null);
  setDeletedSection(null);
  setSnackbarOpen(false);
};



// Автосохранение при изменении sections или title
useEffect(() => {
  if (!lesson) return;
  setSaveStatus("unsaved");
  

  const timeout = setTimeout(() => {
    handleSave();
  }, 3000);

  return () => clearTimeout(timeout);
}, [sections, title]);

  // === UI ===
if (loading) return <CircularProgress />;
  if (!lesson)
    return <Typography color="error">Ошибка: урок не найден</Typography>;

return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    {/* === Левая панель (SidebarTree) === */}
        {lesson?.module?.subject?.id ? (
      <SubjectSidebar
        subjectId={lesson.module.subject.id}
        currentLessonId={id}
        currentRole="TEACHER"
        onSelectLesson={(lessonId) => navigate(`/lessons/edit/${lessonId}`)}
      />
    ) : (
      <Box
        sx={{
          width: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          Загрузка панели...
        </Typography>
      </Box>
    )}


    {/* === Правая область: Редактор урока === */}
    <Box
      sx={{
        flexGrow: 1,
        p: 3,
        overflowY: "auto",
        backgroundColor: (theme) => theme.palette.background.default,
        color: (theme) => theme.palette.text.primary,
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      {/* === Заголовок и статус сохранения === */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <TextField
          label="Название урока"
          value={title}
          onChange={(e) =>
            applyChange((d) => {
              d.title = e.target.value;
            })
          }
          fullWidth
        />

         {/* === Индикатор сохранения === */}
        <Box
          sx={{
            ml: 2,
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor:
              saveStatus === "saved"
                ? "rgba(76, 175, 80, 0.15)" // зелёный фон
                : saveStatus === "unsaved"
                ? "rgba(255, 193, 7, 0.15)" // жёлтый фон
                : "rgba(244, 67, 54, 0.15)", // красный фон
            color:
              saveStatus === "saved"
                ? "#4CAF50"
                : saveStatus === "unsaved"
                ? "#FFC107"
                : "#F44336",
            transition: "all 0.3s ease",
          }}
        >
          {saveStatus === "saved" && "✅ Сохранено"}
          {saveStatus === "unsaved" && "💾 Изменения не сохранены"}
          {saveStatus === "error" && "❌ Ошибка сохранения"}
        </Box>
      </Stack>

      {/* === Контент: Предпросмотр / Редактор === */}
      {preview ? (
        // ======= ПРЕДПРОСМОТР =======
        <Box sx={{ p: 1 }}>
          {sections.map((section, secIdx) => (
            <Box key={secIdx} sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            pl: 2,
            borderLeft: `6px solid ${section.color || "#1976d2"}`,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {section.title}
        </Typography>
              {section.children.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Пустая секция
                </Typography>
              )}

              {section.children.map((b, idx) => (
                <Box key={`${secIdx}-${idx}`} sx={{ mb: 2 }}>
                  {b.type === "text" && (
                    <div dangerouslySetInnerHTML={{ __html: b.content }} />
                  )}
                  {b.type === "image" && b.content && (
                    <img
                      src={b.content}
                      alt="Изображение"
                      style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 8 }}
                    />
                  )}
                  {b.type === "video" && (
                    <Typography color="text.secondary">
                      Видео: {b.content}
                    </Typography>
                  )}
                  {b.type === "file" && b.content && (
                    <a href={b.content} target="_blank" rel="noreferrer">
                      📎 {decodeURIComponent(b.content.split("/").pop() || "Файл")}
                    </a>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        // ======= РЕДАКТОР =======
<DndContext
  sensors={sensors}
  collisionDetection={pointerWithin}
  onDragEnd={({ active, over }) => {
    if (!over) return;

    // если перетаскиваем секцию
    if (String(active.id).startsWith("section-") && String(over.id).startsWith("section-")) {
      const from = Number(String(active.id).split("-")[1]);
      const to = Number(String(over.id).split("-")[1]);
      if (from === to) return;

      applyChange((d) => {
        const [moved] = d.sections.splice(from, 1);
        d.sections.splice(to, 0, moved);
      });
      return;
    }

    // иначе — обычное перемещение блоков
    const [fromSec, fromIdx] = String(active.id).split("-").map(Number);
    let toSec: number, toIdx: number;
    if (String(over.id).startsWith("section-")) {
      toSec = Number(String(over.id).split("-")[1]);
      toIdx = sections[toSec].children.length;
    } else {
      [toSec, toIdx] = String(over.id).split("-").map(Number);
    }

    if (fromSec === toSec && fromIdx === toIdx) return;

    applyChange((d) => {
      const [moved] = d.sections[fromSec].children.splice(fromIdx, 1);
      d.sections[toSec].children.splice(toIdx, 0, moved);
    });
  }}
>
  {/* === Сортировка СЕКЦИЙ === */}
  <SortableContext
    items={sections.map((_, secIdx) => `section-${secIdx}`)}
    strategy={verticalListSortingStrategy}
  >
    {sections.map((section, secIdx) => (
      <SortableItem key={`section-${secIdx}`} id={`section-${secIdx}`}>
        {({ listeners }) => (
          <Box sx={{ mb: 4 }}>
            {/* === Шапка секции === */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                borderLeft: `6px solid ${section.color || "#1976d2"}`,
                backgroundColor: "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                <IconButton {...listeners}>
                  <DragIndicatorIcon />
                </IconButton>
                  <IconButton
                    onClick={() => {
                    applyChange((d) => {
                      d.sections[secIdx].collapsed = !d.sections[secIdx].collapsed;
                    });
                    }}
                  >
                    {section.collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </IconButton>
                <TextField
                  fullWidth
                  value={section.title}
                  onChange={(e) => {
                    applyChange((d) => {
                      d.sections[secIdx].title = e.target.value;
                    });
                  }}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Select
                  size="small"
                  value={section.color || "#1976d2"}
                  onChange={(e) => {
                    applyChange((d) => {
                      d.sections[secIdx].color = e.target.value as string;
                    });
                  }}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="#1976d2">Синий</MenuItem>
                  <MenuItem value="#2e7d32">Зелёный</MenuItem>
                  <MenuItem value="#9c27b0">Фиолетовый</MenuItem>
                  <MenuItem value="#f57c00">Оранжевый</MenuItem>
                  <MenuItem value="#d32f2f">Красный</MenuItem>
                </Select>

                {/* === Кнопка удалить секцию === */}
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    if (confirm(`Удалить секцию "${section.title}"?`)) {
                      applyChange((d) => {
                        d.sections.splice(secIdx, 1);
                      });
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>

            {/* === Блоки внутри секции === */}
            {!section.collapsed && (
              <SortableContext
                items={section.children.map((_, idx) => `${secIdx}-${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence>
                  {section.children.map((b, idx) => (
                    <SortableItem key={`${secIdx}-${idx}`} id={`${secIdx}-${idx}`}>
                      {({ listeners }) => (
                        // оставь тут весь твой старый код блока (Box, ReactQuill и т.д.)
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Box
                            sx={(theme) => ({
                              mb: 2,
                              p: 2,
                              border: "1px solid",
                              borderColor: theme.palette.divider,
                              borderRadius: 2,
                              backgroundColor: theme.palette.background.paper,
                            })}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file && (b.type === "image" || b.type === "file")) {
                                const url = await uploadLessonFile(file);
                               applyChange((d) => { d.sections[secIdx].children[idx].content = url; });
                              }
                            }}
                          >
                            <Stack direction="row" alignItems="flex-start" spacing={2}>
                              <Box sx={{ flex: 1 }}>
                                <Select
                                  size="small"
                                  value={b.type}
                                  onChange={(e) => {
                                    applyChange((d) => { d.sections[secIdx].children[idx].type = e.target.value as Block["type"]; });
                                  }}
                                  sx={{ mb: 1 }}
                                >
                                  <MenuItem value="text">Текст</MenuItem>
                                  <MenuItem value="image">Изображение</MenuItem>
                                  <MenuItem value="video">Видео</MenuItem>
                                  <MenuItem value="file">Файл</MenuItem>
                                </Select>

                                {b.type === "text" && (
                                  <ReactQuill
                                    value={b.content}
                                    onChange={(val) => {
                                      applyChange((d) => {
                                        d.sections[secIdx].children[idx].content = val;
                                      });
                                    }}
                                    modules={{
                                      toolbar: [
                                        ["bold", "italic", "underline", "strike"],
                                        [{ header: [1, 2, 3, false] }],
                                        [{ list: "ordered" }, { list: "bullet" }],
                                        ["link", "clean"],
                                      ],
                                    }}
                                    formats={[
                                      "header",
                                      "bold",
                                      "italic",
                                      "underline",
                                      "strike",
                                      "list",
                                      "bullet",
                                      "link",
                                    ]}
                                    placeholder="Введите текст..."
                                    style={{ minHeight: 120 }}
                                  />
                                )}

                                {b.type === "image" && (
                                  <>
                                    {b.content ? (
                                      <Box>
                                        <img
                                          src={b.content}
                                          alt="Превью"
                                          style={{
                                            maxWidth: "300px",
                                            maxHeight: 200,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            marginBottom: 8,
                                          }}
                                        />
                                        <Stack direction="row" spacing={1}>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={async () => {
                                              const input = document.createElement("input");
                                              input.type = "file";
                                              input.accept = "image/*";
                                              input.onchange = async () => {
                                                const file = input.files?.[0];
                                                if (file) {
                                                  const url = await uploadLessonFile(file);
                                                  applyChange((d) => {
                                                    d.sections[secIdx].children[idx].content = url;
                                                  });
                                                }
                                              };
                                              input.click();
                                            }}
                                          >
                                            Заменить
                                          </Button>
                                          <Button
                                            size="small"
                                            color="error"
                                            onClick={() => {
                                              applyChange((d) => { d.sections[secIdx].children[idx].content = ""; });
                                            }}
                                          >
                                            Удалить
                                          </Button>
                                        </Stack>
                                      </Box>
                                    ) : (
                                      <Button
                                        variant="outlined"
                                        onClick={async () => {
                                          const input = document.createElement("input");
                                          input.type = "file";
                                          input.accept = "image/*";
                                          input.onchange = async () => {
                                            const file = input.files?.[0];
                                            if (file) {
                                              const url = await uploadLessonFile(file);
                                              applyChange((d) => { d.sections[secIdx].children[idx].content = url; });
                                            }
                                          };
                                          input.click();
                                        }}
                                      >
                                        Загрузить изображение
                                      </Button>
                                    )}
                                  </>
                                )}

                                {b.type === "video" && (
                                  <TextField
                                    fullWidth
                                    placeholder="Вставьте ссылку на видео"
                                    value={b.content}
                                    onChange={(e) => {
                                      applyChange((d) => { d.sections[secIdx].children[idx].content = e.target.value; });
                                    }}
                                  />
                                )}

                                {b.type === "file" && (
                                  <>
                                    {b.content ? (
                                      <Box>
                                        <a
                                          href={b.content}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ display: "block", marginBottom: 8 }}
                                        >
                                          📎{" "}
                                          {decodeURIComponent(
                                            b.content.split("/").pop() || "Файл"
                                          )}
                                        </a>
                                        <Stack direction="row" spacing={1}>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={async () => {
                                              const input = document.createElement("input");
                                              input.type = "file";
                                              input.onchange = async () => {
                                                const file = input.files?.[0];
                                                if (file) {
                                                  const url = await uploadLessonFile(file);
                                                  applyChange((d) => { d.sections[secIdx].children[idx].content = url; });
                                                }
                                              };
                                              input.click();
                                            }}
                                          >
                                            Заменить
                                          </Button>
                                          <Button
                                            size="small"
                                            color="error"
                                            onClick={() => {
                                              applyChange((d) => { d.sections[secIdx].children[idx].content = ""; });
                                            }}
                                          >
                                            Удалить
                                          </Button>
                                        </Stack>
                                      </Box>
                                    ) : (
                                      <Button
                                        variant="outlined"
                                        onClick={async () => {
                                          const input = document.createElement("input");
                                          input.type = "file";
                                          input.onchange = async () => {
                                            const file = input.files?.[0];
                                            if (file) {
                                              const url = await uploadLessonFile(file);
                                              applyChange((d) => { d.sections[secIdx].children[idx].content = url; });
                                            }
                                          };
                                          input.click();
                                        }}
                                      >
                                        Прикрепить файл
                                      </Button>
                                    )}
                                  </>
                                )}
                              </Box>

                              {/* Хэндл перетаскивания + удаление */}
                              <Stack direction="column" spacing={1}>
                                <IconButton {...listeners} size="small">
                                  <DragIndicatorIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteBlock(secIdx, idx)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </Box>
                         </motion.div>
                      )}
                    </SortableItem>
                  ))}
                </AnimatePresence>
              </SortableContext>
            )}
          </Box>
        )}
      </SortableItem>
    ))}
  </SortableContext>
</DndContext>
      )}

      {/* === Плавающая панель действий === */}
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: 99,
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            backdropFilter: "blur(8px)",
          }}
        >
          <Button onClick={() => setPreview(!preview)}>
            {preview ? "Редактировать" : "Предпросмотр"}
          </Button>

           <Button onClick={handleUndo} disabled={historyIndex <= 0}>
          ↩ Undo
        </Button>
        <Button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
        >
          ↪ Redo
        </Button>


          <Button variant="outlined" onClick={() => navigate(-1)}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Сохранить
          </Button>
          <Button onClick={handleAddSection}>+ Секция</Button>
        </Paper>

        {/* Кнопка + (добавляет блок в первую секцию, как и было) */}
        <IconButton
          sx={{
            borderRadius: 3,
            width: 48,
            height: 48,
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { backgroundColor: "primary.dark" },
          }}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <AddIcon />
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => handleAddBlock("text")}>
            <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} /> Текст
          </MenuItem>
          <MenuItem onClick={() => handleAddBlock("image")}>
            <ImageIcon fontSize="small" sx={{ mr: 1 }} /> Изображение
          </MenuItem>
          <MenuItem onClick={() => handleAddBlock("video")}>
            <MovieIcon fontSize="small" sx={{ mr: 1 }} /> Видео
          </MenuItem>
          <MenuItem onClick={() => handleAddBlock("file")}>
            <AttachFileIcon fontSize="small" sx={{ mr: 1 }} /> Файл
          </MenuItem>
        </Menu>
      </Box>

      {/* Snackbar */}
           <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message="Блок удалён"
        action={
          <Button color="secondary" size="small" onClick={handleUndoDelete}>
            Отменить
          </Button>
        }
      />

      <Snackbar
        open={autoSaveNotice}
        autoHideDuration={2000}
        message={`✅ Сохранено в ${lastSavedAt}`}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  </Box>
  );
}
