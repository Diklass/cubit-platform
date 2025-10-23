// src/theme/index.ts

import { deepmerge } from "@mui/utils";
import { cubitTheme } from "./cubitTheme";
import { createTheme, type Theme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark") => {
  const base = createTheme({
    ...cubitTheme,
    palette: {
      mode,
      primary: { main: "#3C96EF", light: "#3C96EF", dark: "#3C96EF", contrastText: "#fff" },
      secondary: { main: "#626466", contrastText: "#fff" },
      background: {
        default: mode === "dark" ? "#0B0F13" : "#F6F8FA",
        paper:   mode === "dark" ? "#10151B" : "#FFFFFF",
      },
      text: {
        primary:   mode === "dark" ? "#E6EAF0" : "#111111",
        secondary: mode === "dark" ? "#9CA3AF" : "#555555",
      },
      divider: mode === "dark" ? "rgba(255,255,255,0.12)" : "#E5E7EB",
      action: {
        hover: mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(60,150,239,0.06)",
      },
    },
    shape: { borderRadius: 16 },
    components: {
      // 💥 ключевое
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",                // убираем бумажный градиент MUI
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            transition: "background-color .25s, color .25s",
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 1px 4px rgba(0,0,0,.8)"
                : theme.shadows[2],
            "&:hover": {
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 14px rgba(0,0,0,.9)"
                  : theme.shadows[6],
              backgroundColor: theme.palette.action.hover,
            },
          }),
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: ({ theme }) => ({
            transition: "color .25s",
            color: "inherit",
          }),
        },
      },
      MuiCssBaseline: {
  styleOverrides: (theme: Theme) => ({
    body: {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      transition: "background-color .25s, color .25s",
    },
  }),
},
    },
  });

  // ВАЖНО: base должен перезаписывать cubitTheme, а не наоборот
  return deepmerge(base, cubitTheme);
};
