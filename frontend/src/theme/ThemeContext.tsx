// src/theme/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "../theme"; // важно, чтобы getTheme(mode) реально использовал mode

type ThemeMode = "light" | "dark";

interface ThemeContextProps {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProviderCustom");
  }
  return ctx;
};

export const ThemeProviderCustom: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // === 1. Инициализация ===
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("themeMode") as ThemeMode | null;
    if (saved === "light" || saved === "dark") return saved;
    // автоопределение при первом запуске
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // === 2. Реакция на toggle ===
  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  // === 3. Обновляем тему ===
  const theme = useMemo(() => getTheme(mode), [mode]);

  // === 4. (необязательно, но красиво) обновляем data-атрибут для CSS/анимаций ===
  useEffect(() => {
    document.body.dataset.theme = mode;
  }, [mode]);

  useEffect(() => {
  console.log("Theme mode:", mode);
}, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
