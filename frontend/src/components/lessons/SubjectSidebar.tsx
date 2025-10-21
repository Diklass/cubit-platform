// src/components/lessons/SubjectSidebar.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Divider,
  Typography,
  Collapse,
  InputAdornment,
  Tooltip,
  Button,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Add,
  Search,
  Delete,
  MenuOpen,
  Menu,
} from "@mui/icons-material";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { useTheme } from "@mui/material";
import { CustomScrollArea } from "../ui/CustomScrollArea";


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

export const SubjectSidebar: React.FC<{
  subjectId?: string;
  modules: Module[];
  currentLessonId?: string;
  onSelectLesson: (id: string) => void;
  onDataChange?: () => void;
  currentRole?: Role;
}> = ({
  subjectId,
  modules,
  currentLessonId,
  onSelectLesson,
  onDataChange,
  currentRole = "GUEST",
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true"; // true если была свернута
  }
  return false;
});

  const isReadonly = currentRole === "STUDENT" || currentRole === "GUEST";
  const navigate = useNavigate();

  const searchRef = React.useRef<HTMLInputElement>(null);

  const [isSearching, setIsSearching] = useState(false);



  const [isSearchAnimating, setIsSearchAnimating] = useState(false);
  const searchAnimTimer = React.useRef<number | null>(null);

  const currentPath = window.location.pathname;

  const sidebarWidth = collapsed ? 64 : 320;

  const theme = useTheme();

  

  const handleAddLesson = async (moduleId: string) => {
    const title = prompt("Введите название урока:");
    if (!title) return;
    await api.post(`/subjects/modules/${moduleId}/lessons`, { title });
    onDataChange?.();
  };

  const handleAddModule = async () => {
    const title = prompt("Введите название модуля:");
    if (!title) return;
    await api.post(`/subjects/${subjectId}/modules`, { title });
    onDataChange?.();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Удалить этот урок?")) return;
    await api.delete(`/subjects/lessons/${lessonId}`);
    onDataChange?.();
  };

  const startSearchAnimation = (durationMs = 1600) => {
  setIsSearchAnimating(true);
  if (searchAnimTimer.current) window.clearTimeout(searchAnimTimer.current);
  searchAnimTimer.current = window.setTimeout(() => {
    setIsSearchAnimating(false);
  }, durationMs);
};

useEffect(() => {
  // при сворачивании панели — аккуратно гасим эффект
  if (collapsed) {
    setIsSearching(false);
    setIsSearchAnimating(false);
    if (searchAnimTimer.current) {
      window.clearTimeout(searchAnimTimer.current);
      searchAnimTimer.current = null;
    }
  }
  return () => {
    if (searchAnimTimer.current) window.clearTimeout(searchAnimTimer.current);
  };
}, [collapsed]);

  // === Сохраняем и восстанавливаем состояние свернутости ===

useEffect(() => {
  localStorage.setItem("sidebarCollapsed", String(collapsed));
}, [collapsed]);

useEffect(() => {
  localStorage.setItem("sidebarCollapsed", String(collapsed));
  window.dispatchEvent(new CustomEvent("sidebar-collapsed-changed", { detail: { collapsed } }));
}, [collapsed]);


const PANEL_LEFT = 20;
const HEADER_TOP = 22;  // то, что указано в Header: top-[22px]
const HEADER_HEIGHT = 58; // то, что видно из Header: h-[60px]
const GAP_BELOW_HEADER = 20; // желаемый зазор
const PANEL_TOP = HEADER_TOP + HEADER_HEIGHT + GAP_BELOW_HEADER; // = 102px
const PANEL_BOTTOM = 20;
const PANEL_WIDTH = collapsed ? 64 : 320;
 

  return (
<Box
  sx={(theme) => ({
    position: "fixed",
    top: `${PANEL_TOP}px`,         // ✅ теперь точно под шапкой
    left: `${PANEL_LEFT}px`,
    width: PANEL_WIDTH,
    height: `calc(100vh - ${PANEL_TOP + PANEL_BOTTOM}px)`,
    borderRadius: "20px",
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    zIndex: 10,                   // чтобы быть под шапкой (у шапки z-20)
    display: "flex",
    flexDirection: "column",
    transition: "width 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)",
  })}
>
{/* ВНУТРЕННЯЯ СКРОЛЛ-ОБЛАСТЬ с padding: 20px */}
<Box
  sx={{
    flex: "1 1 auto",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "20px 24px 20px 20px",
    pr: "20px",
    scrollbarWidth: "auto", // Firefox
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.mode === "dark" ? "#555" : "#bbb",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: theme.palette.mode === "dark" ? "#666" : "#999",
    },
  }}
>
  <Box className="sidebar-scroll">
    {/* === Верхняя панель: поиск + кнопка сворачивания === */}
    {!collapsed ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          gap: 1,
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? "translateX(-10px)" : "translateX(0)",
          transition: "all 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)",
        }}
      >
        <TextField
          inputRef={searchRef}
          onFocus={() => {
            setIsSearching(true);
            startSearchAnimation(1600);
          }}
          onBlur={() => {
            setIsSearching(false);
            setIsSearchAnimating(false);
            if (searchAnimTimer.current) {
              window.clearTimeout(searchAnimTimer.current);
              searchAnimTimer.current = null;
            }
          }}
          size="small"
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          sx={(theme) => ({
            flex: "1 1 auto",
            maxWidth: "80%",
            "& .MuiOutlinedInput-root": {
              borderRadius: "999px",
              height: 44,
              backgroundColor: isSearching
                ? theme.palette.mode === "dark"
                  ? "#363636"
                  : "#E7EEFB"
                : theme.palette.mode === "dark"
                ? "#2b2b2b"
                : theme.palette.background.default,
              transition:
                "background-color 0.6s cubic-bezier(0.25, 1.5, 0.5, 1)",
              "& fieldset": {
                border: "none",
              },
              "& input": {
                padding: "10px 16px",
                color: theme.palette.text.primary,
              },
            },
          })}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    animation: isSearchAnimating
                      ? "waveSearch 1.6s cubic-bezier(0.25, 1.5, 0.5, 1) 1 both"
                      : "none",
                    "@keyframes waveSearch": {
                      "0%": { transform: "rotate(0deg)" },
                      "30%": { transform: "rotate(-18deg)" },
                      "60%": { transform: "rotate(18deg)" },
                      "100%": { transform: "rotate(0deg)" },
                    },
                  }}
                >
                  <Search
                    sx={(theme) => ({
                      opacity: 0.75,
                      color: isSearching
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      transition:
                        "color 0.4s cubic-bezier(0.25, 1.5, 0.5, 1)",
                    })}
                  />
                </Box>
              </InputAdornment>
            ),
          }}
        />

        <IconButton onClick={() => setCollapsed(true)} sx={{ flexShrink: 0 }}>
          <MenuOpen />
        </IconButton>
      </Box>
    ) : (
      // 🔹 Когда панель свернута — показываем иконки
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.2,
          mt: 1,
        }}
      >
        <IconButton onClick={() => setCollapsed(false)}>
          <Menu />
        </IconButton>

        <IconButton
          onClick={() => {
            setCollapsed(false);
            setTimeout(() => {
              searchRef.current?.focus();
              startSearchAnimation(1600);
            }, 500);
          }}
        >
          <Search />
        </IconButton>

        <IconButton
          onClick={() => navigate(`/lessons/${subjectId}`)}
          sx={(theme) => ({
            color:
              currentPath === `/lessons/${subjectId}`
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#3b3b3b" : "#E8EEF7",
            },
          })}
        >
          <LibraryBooksIcon />
        </IconButton>

        {modules.map((m) => {
          const isActive =
            currentPath === `/lessons/${subjectId}/modules/${m.id}`;
          return (
            <IconButton
              key={m.id}
              onClick={() => navigate(`/lessons/${subjectId}/modules/${m.id}`)}
              sx={(theme) => ({
                color: isActive
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#3b3b3b" : "#E8EEF7",
                },
              })}
            >
              <MenuBookIcon />
            </IconButton>
          );
        })}
      </Box>
    )}

    {!collapsed && <Divider sx={{ my: "10px" }} />}

    {/* === Кнопка "Все модули" === */}
    {!collapsed && (
      <Box sx={{ mb: 1.5, borderRadius: "12px", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", p: "6px" }}>
          <Box
            onClick={() => navigate(`/lessons/${subjectId}`)}
            sx={(theme) => ({
              flexGrow: 1,
              height: 44,
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor:
                theme.palette.mode === "dark" ? "#3b3b3b" : "#DCE9F5",
              color: theme.palette.text.primary,
              transition: "all .25s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#4a4a4a" : "#cdddeb",
              },
              px: 2.5,
            })}
          >
            <Typography sx={{ fontWeight: 600 }}>Все модули</Typography>
          </Box>
        </Box>
      </Box>
    )}

    {/* === Список модулей === */}
    {!collapsed &&
      modules.map((m) => {
        const isOpen = !!expanded[m.id];
        return (
          <Box key={m.id} sx={{ mb: 1.5, borderRadius: "12px", overflow: "hidden" }}>
            {/* Кнопка модуля */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: isOpen ? 0 : "6px",
                transition: "gap 0.25s ease",
                p: "6px",
              }}
            >
              {/* Левая кнопка */}
              <Box
                onClick={() =>
                  navigate(`/lessons/${subjectId}/modules/${m.id}`)
                }
                sx={(theme) => ({
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#3b3b3b" : "#DCE9F5",
                  color: theme.palette.text.primary,
                  borderRadius: "999px 0 0 999px",
                  transition: "all .25s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#4a4a4a" : "#cdddeb",
                  },
                  px: 2.5,
                })}
              >
                <Typography sx={{ fontWeight: 600 }}>{m.title}</Typography>
              </Box>

              {/* Правая кнопка */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((prev) => ({
                    ...prev,
                    [m.id]: !prev[m.id],
                  }));
                }}
                sx={(theme) => ({
                  height: 44,
                  width: 44,
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#3b3b3b" : "#DCE9F5",
                  color: theme.palette.text.primary,
                  borderRadius: "0 999px 999px 0",
                  transition: "all .25s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transform: isOpen ? "translateX(-3px)" : "translateX(0)",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#4a4a4a" : "#cdddeb",
                  },
                })}
              >
                {isOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            {/* === Уроки === */}
            <Collapse in={isOpen}>
              <Box
                sx={(theme) => ({
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "#2b2b2b"
                      : theme.palette.background.default,
                  p: "6px 6px 0",
                  borderRadius: "12px",
                  mt: "4px",
                  transition: "background-color .3s",
                })}
              >
                {m.lessons.map((lesson) => {
                  const selected = currentLessonId === lesson.id;
                  return (
                    <Box
                      key={lesson.id}
                      onClick={() => navigate(`/lessons/view/${lesson.id}`)}
                      sx={(theme) => ({
                        px: "16px",
                        py: selected ? "5px" : "10px",
                        my: "6px",
                        cursor: "pointer",
                        borderRadius: "100px",
                        backgroundColor: selected
                          ? theme.palette.primary.main
                          : "transparent",
                        color: selected ? "#fff" : theme.palette.text.primary,
                        "&:hover": {
                          backgroundColor: selected
                            ? theme.palette.primary.dark
                            : theme.palette.action.hover,
                        },
                      })}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{lesson.title}</span>
                        {!isReadonly && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLesson(lesson.id);
                            }}
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}

                {/* Добавить урок */}
                {!isReadonly && (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleAddLesson(m.id)}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        );
      })}

    {/* Добавить модуль */}
    {!isReadonly && !collapsed && (
      <>
        <Divider sx={{ my: "10px" }} />
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <IconButton color="primary" onClick={handleAddModule}>
            <Add />
          </IconButton>
        </Box>
      </>
    )}
    {/* 🧩 КОНЕЦ КОНТЕНТА ПАНЕЛИ */}
  </Box>
</Box>
  </Box>
  );
};
