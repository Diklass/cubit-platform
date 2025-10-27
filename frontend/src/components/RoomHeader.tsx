import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button,
  useTheme,
} from "@mui/material";
import {
  Fullscreen,
  ChatBubbleOutline,
  SettingsOutlined,
} from "@mui/icons-material";

// Функция для вычисления яркости цвета
function getLuminance(hex: string): number {
  const rgb = hex
    .replace("#", "")
    .match(/.{1,2}/g)
    ?.map((x) => parseInt(x, 16) / 255) || [0, 0, 0];
  const [r, g, b] = rgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Функция для определения оптимального контрастного цвета
function getContrastColor(bgColor: string, light = "#FFFFFF", dark = "#1C1B1F") {
  try {
    const lum = getLuminance(bgColor);
    return lum > 0.45 ? dark : light;
  } catch {
    return light;
  }
}

interface RoomHeaderProps {
  name: string;
  code: string;
  bgColor?: string;
  bgImagePreview?: string | null;
  onEdit: () => void;
  onFullscreen: () => void;
  onChat: () => void;
  compact?: boolean;
  isTeacher?: boolean;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  name,
  code,
  bgColor,
  bgImagePreview,
  onEdit,
  onFullscreen,
  onChat,
  compact = false,
  isTeacher = false,
}) => {
  const theme = useTheme();

  // 🎨 Динамически вычисляем контрастный цвет (на основе фона)
  const iconColor = getContrastColor(bgColor || theme.palette.primary.main);
  const textColor = iconColor;

  // === COMPACT HEADER ===
  if (compact) {
    return (
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          height: 56,
          borderRadius: "16px",
          mx: { xs: 2, md: 3 },
          mt: 1,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: bgColor || theme.palette.primary.main,
          backgroundImage: bgImagePreview ? `url(${bgImagePreview})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 2px 8px rgba(0,0,0,0.6)"
              : "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 600,
              color: textColor,
              pr: 1,
              maxWidth: "60%",
            }}
          >
            {name}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Чат / К материалам">
              <IconButton
                size="small"
                onClick={onChat}
                sx={{
                  bgcolor: "rgba(255,255,255,0.25)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
                  boxShadow: 1,
                }}
              >
                <ChatBubbleOutline sx={{ color: iconColor, fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="На весь экран">
              <IconButton
                size="small"
                onClick={onFullscreen}
                sx={{
                  bgcolor: "rgba(255,255,255,0.25)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
                  boxShadow: 1,
                }}
              >
                <Fullscreen sx={{ color: iconColor, fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {isTeacher && (
              <Tooltip title="Настройки">
                <IconButton
                  size="small"
                  onClick={onEdit}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.25)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
                    boxShadow: 1,
                  }}
                >
                  <SettingsOutlined sx={{ color: iconColor, fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // === EXPANDED HEADER ===
  return (
    <Box
      sx={{
        position: "relative",
        flexShrink: 0,
        height: { xs: 160, md: 200 },
        borderRadius: "20px",
        mx: { xs: 2, md: 3 },
        mt: 1,
        overflow: "hidden",
        backgroundColor: bgColor || theme.palette.primary.main,
        backgroundImage: bgImagePreview ? `url(${bgImagePreview})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 4px 12px rgba(0,0,0,0.7)"
            : "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      {/* Название комнаты */}
      <Typography
        variant="h4"
        sx={{
          position: "relative",
          color: textColor,
          fontWeight: 700,
          pl: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
        }}
      >
        {name}
      </Typography>

      {/* Код курса */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: { xs: 2, md: 3 },
          mt: 1,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: textColor,
            fontWeight: 500,
          }}
        >
          Код курса: {code}
        </Typography>

        <Tooltip title="На весь экран">
          <IconButton
            size="small"
            onClick={onFullscreen}
            sx={{
              bgcolor: "rgba(255,255,255,0.25)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
            }}
          >
            <Fullscreen sx={{ color: iconColor, fontSize: 22 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Настройки */}
      {isTeacher && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Tooltip title="Настройки комнаты">
            <IconButton
              onClick={onEdit}
              sx={{
                bgcolor: "rgba(255,255,255,0.25)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
                boxShadow: 2,
              }}
            >
              <SettingsOutlined sx={{ color: iconColor, fontSize: 22 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Кнопка чата */}
      <Button
        onClick={onChat}
        variant="contained"
        disableElevation
        sx={{
          position: "absolute",
          right: 16,
          bottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2.5,
          py: 1,
          borderRadius: "50px",
          backgroundColor: "rgba(255,255,255,0.25)",
          color: iconColor,
          fontWeight: 600,
          textTransform: "none",
          fontSize: "1rem",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.4)",
          },
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 4px 12px rgba(0,0,0,0.8)"
              : "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <ChatBubbleOutline sx={{ fontSize: 22 }} />
        Чат
      </Button>
    </Box>
  );
};
