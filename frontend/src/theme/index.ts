// src/theme/index.ts

import { createTheme } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { cubitTheme } from "./cubitTheme";

export const getTheme = (mode: "light" | "dark") => {
  // 1. Создаём тему строго из cubitTheme
  let base = createTheme(cubitTheme);

  // 2. Добавляем динамические поля поверх
  const dynamic = {
    palette: {
      mode,
      background: {
        default: mode === "dark" ? "#0B0F13" : "#F6F8FA",
        paper:   mode === "dark" ? "#10151B" : "#FFFFFF",
      },
      text: {
        primary:   mode === "dark" ? "#E6EAF0" : "#111111",
        secondary: mode === "dark" ? "#9CA3AF" : "#555555",
      },
      divider: mode === "dark" ? "rgba(255,255,255,0.12)" : "#E5E7EB",
    }
  };

  return deepmerge(base, dynamic);
};
