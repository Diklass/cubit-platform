// src/components/layout/MainContentLayout.tsx
import React, { useEffect, useState } from "react";
import { Box, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";

interface MainContentLayoutProps {
  children: React.ReactNode;
}

export const MainContentLayout: React.FC<MainContentLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(Boolean(e?.detail?.collapsed));
    window.addEventListener("sidebar-collapsed-changed", handler);
    return () => window.removeEventListener("sidebar-collapsed-changed", handler);
  }, []);

  const PANEL_LEFT_GAP = 20;
  const PANEL_MAIN_GAP = 20;
  const PANEL_WIDTH = sidebarCollapsed ? 64 : 320;
  const CONTENT_MARGIN_LEFT = PANEL_LEFT_GAP + PANEL_WIDTH + PANEL_MAIN_GAP;

  return (
    <Box
      sx={{
        flex: 1,
        marginLeft: `${CONTENT_MARGIN_LEFT}px`,
        marginTop: "20px",
        marginRight: "20px",
        marginBottom: "20px",
        transition: "margin-left 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)",
      }}
    >
<Box
  sx={{
    backgroundColor: (theme:Theme) => theme.palette.background.paper,
    color: (theme:Theme) => theme.palette.text.primary,
    transition: "background-color 0.3s ease, color 0.3s ease",
    borderRadius: "20px",
    boxShadow: (theme:Theme) => theme.shadows[2],
    p: { xs: 2, md: 2.5 },
    minHeight: "calc(100vh - 40px)",
  }}
>

        {children}
      </Box>
    </Box>
  );
};
