// src/theme.ts
import { createTheme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            // 🎨 цвета для светлой темы
            background: { default: "#fafafa" },
          }
        : {
            // 🎨 цвета для тёмной темы
            background: { default: "#121212" },
          }),
    },
    typography: {
      fontFamily: "Inter, Roboto, Arial, sans-serif",
    },
  });
