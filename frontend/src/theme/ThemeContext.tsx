// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "../theme";

type ThemeMode = "light" | "dark";

interface ThemeContextProps {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProviderCustom");
  return ctx;
};

export const ThemeProviderCustom: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Проверяем системные предпочтения
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const storedMode = (localStorage.getItem("themeMode") as ThemeMode) || (systemPrefersDark ? "dark" : "light");

  const [mode, setMode] = useState<ThemeMode>(storedMode);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", newMode);
      return newMode;
    });
  };

  useEffect(() => {
    document.body.dataset.theme = mode;
  }, [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
