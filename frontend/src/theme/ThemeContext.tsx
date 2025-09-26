// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";
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
  // Определяем начальное значение по системе
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [mode, setMode] = useState<ThemeMode>(systemPrefersDark ? "dark" : "light");

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

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
