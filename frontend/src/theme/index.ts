// src/theme/index.ts
import { createTheme } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { cubitTheme } from "./cubitTheme";

export const getTheme = (mode: "light" | "dark") => {
  const commonPrimary = {
    main: "#3C96EF",
    light: "#3C96EF",   // ⬅ одинаковый оттенок
    dark: "#3C96EF",    // ⬅ одинаковый оттенок
    contrastText: "#FFFFFF",
  };

  const base = createTheme({
    ...cubitTheme,
    palette: {
      mode,
      primary: commonPrimary,
      secondary: {
        main: "#626466",
        contrastText: "#FFFFFF",
      },
      background: {
        default: mode === "dark" ? "#0B0F13" : "#FFFFFF", // немного теплее и глубже
        paper: mode === "dark" ? "#10151B" : "#FFFFFF",
      },
      text: {
        primary: mode === "dark" ? "#E6EAF0" : "#111111",
        secondary: mode === "dark" ? "#9CA3AF" : "#555555",
      },
      divider: mode === "dark" ? "rgba(255,255,255,0.12)" : "#E5E7EB",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 600,
            transition:
              "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
          },
          containedPrimary: {
            backgroundColor: "#3C96EF",
            color: "#FFFFFF",
            "&:hover": { backgroundColor: "#3385E5" },
            "&:active": { backgroundColor: "#2A72CC" },
          },
          outlinedPrimary: {
            borderColor: "#3C96EF",
            color: "#3C96EF",
            "&:hover": {
              borderColor: "#3385E5",
              backgroundColor: "rgba(60,150,239,0.08)",
            },
            "&:active": {
              borderColor: "#2A72CC",
              backgroundColor: "rgba(60,150,239,0.16)",
            },
          },
        },
      },
    },
  });

  return deepmerge(cubitTheme, base);
};
