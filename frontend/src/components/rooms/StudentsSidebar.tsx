// src/components/rooms/StudentsSidebar.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import { useTheme, type Theme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Menu, MenuOpen } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../../auth/AuthContext";

interface Student {
  id: string;
  email: string;
}

interface Props {
  students: Student[];
  onSelectStudent: (id: string) => void;
  currentStudentId?: string;
  headerColor?: string;
}

export const StudentsSidebar: React.FC<Props> = ({
  students,
  onSelectStudent,
  currentStudentId,
  headerColor,
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  function getContrastColor(bg: string) {
    try {
      const c = bg.substring(1);
      const rgb = [
        parseInt(c.substr(0, 2), 16) / 255,
        parseInt(c.substr(2, 2), 16) / 255,
        parseInt(c.substr(4, 2), 16) / 255
      ];
      const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      return lum > 0.45 ? "#1C1B1F" : "#FFFFFF";
    } catch {
      return "#FFFFFF";
    }
  }

function lighten(hex: string, amount = 0.12) {
  try {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);

    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return hex;
  }
}

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studentsSidebarCollapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("studentsSidebarCollapsed", String(collapsed));
  }, [collapsed]);

  const sidebarWidth = collapsed ? 64 : 320;

  const springTap = {
    whileTap: { scale: 0.96 },
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
      mass: 0.7,
    },
  };

  return (
    <Box
      sx={(theme: Theme) => ({
        width: sidebarWidth,
        marginRight: 1,
        borderRadius: "20px",
        backgroundColor: theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 2px 8px rgba(0,0,0,0.6)"
            : "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)",
        overflow: "hidden",
      })}
    >
      {/* === Верхняя панель === */}
      {!collapsed ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: "14px 18px",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            Ученики
          </Typography>
          <Tooltip title="Свернуть">
            <IconButton onClick={() => setCollapsed(true)}>
              <MenuOpen />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.4,
            mt: 1,
          }}
        >
          <Tooltip title="Развернуть">
            <IconButton onClick={() => setCollapsed(false)}>
              <Menu />
            </IconButton>
          </Tooltip>

          {/* 🔹 Список учеников — свернутое состояние */}
          {students.map((student) => {
            const selected = currentStudentId === student.id;
            return (
              <Tooltip key={student.id} title={student.email}>
                <motion.div {...springTap}>
                  <IconButton
                    onClick={() => onSelectStudent(student.id)}
                    sx={(theme: Theme) => ({
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selected
                        ? headerColor || theme.palette.primary.main
                        : theme.palette.mode === "dark"
                          ? "#2b2b2b"
                          : "#E9F0FB",
                      color: selected
                        ? getContrastColor(headerColor || theme.palette.primary.main)
                        : theme.palette.text.secondary,
                      boxShadow: selected
                        ? "0 3px 8px rgba(0,0,0,0.25)"
                        : "0 2px 4px rgba(0,0,0,0.08)",
                      transition: "all .25s ease",
"&:hover": {
  backgroundColor: selected
    ? lighten(headerColor || theme.palette.primary.main, 0.12)
    : theme.palette.action.hover,
},
                    })}
                  >
                    <PersonIcon />
                  </IconButton>
                </motion.div>
              </Tooltip>
            );
          })}
        </Box>
      )}

      {!collapsed && <Divider sx={{ mx: 2, my: 1 }} />}

      {/* === Список учеников (развернутый режим) === */}
      {!collapsed && (
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            pb: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {students.map((student) => {
            const selected = currentStudentId === student.id;
            return (
              <motion.div key={student.id} {...springTap}>
                <Box
                  onClick={() => onSelectStudent(student.id)}
                  sx={(theme: Theme) => ({
                    p: "10px 16px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    backgroundColor: selected
                      ? headerColor || theme.palette.primary.main
                      : theme.palette.mode === "dark"
                        ? "#2b2b2b"
                        : "#E9F0FB",
                    color: selected
                      ? getContrastColor(headerColor || theme.palette.primary.main)
                      : theme.palette.text.primary,
                    boxShadow: selected
                      ? "0 3px 8px rgba(0,0,0,0.15)"
                      : "0 2px 4px rgba(0,0,0,0.05)",
"&:hover": {
  backgroundColor: selected
    ? lighten(headerColor || theme.palette.primary.main, 0.12)
    : theme.palette.action.hover,
},
                  })}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: selected
                        ? "rgba(255,255,255,0.25)"
                        : theme.palette.action.hover,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </Box>
                  <Typography
                    noWrap
                    sx={{ flex: 1, fontSize: "0.95rem", fontWeight: 500 }}
                  >
                    {student.email}
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
