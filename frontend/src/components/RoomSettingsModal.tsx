import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import { HexColorPicker } from "react-colorful";
import CloseIcon from "@mui/icons-material/Close";

export interface RoomSettings {
  title: string;
  bgColor: string;
}

interface Props {
  initial: RoomSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: RoomSettings) => void;
}

export const RoomSettingsModal: React.FC<Props> = ({
  initial,
  isOpen,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const basePresets = ["#6750A4", "#33691E", "#006A67", "#B3261E", "#1E88E5"];

  const [title, setTitle] = useState(initial.title);
  const [bgColor, setBgColor] = useState(initial.bgColor);
  const [userPresets, setUserPresets] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [tempPickerColor, setTempPickerColor] = useState(initial.bgColor);

  useEffect(() => {
    setTitle(initial.title);
    setBgColor(initial.bgColor);
    setTempPickerColor(initial.bgColor);
  }, [initial, isOpen]);

  const onAddColorClick = () => {
    setTempPickerColor(bgColor);
    setShowPicker(true);
  };

  const confirmPicker = () => {
    const color = tempPickerColor;
    if (!basePresets.includes(color) && !userPresets.includes(color)) {
      setUserPresets((prev) => [...prev, color]);
    }
    setBgColor(color);
    setShowPicker(false);
  };

  const cancelPicker = () => setShowPicker(false);

  const removeUserPreset = (color: string) => {
    setUserPresets((prev) => prev.filter((c) => c !== color));
    if (bgColor === color) setBgColor(basePresets[0] || "");
  };

  const handleSave = () => onSave({ title, bgColor });

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          p: 2,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 6px 18px rgba(0,0,0,0.7)"
              : "0 6px 18px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* Заголовок */}
      <DialogTitle
        sx={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: theme.palette.text.primary,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Настройки комнаты
        <IconButton onClick={onClose}>
          <CloseIcon sx={{ color: theme.palette.text.secondary }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pb: 3 }}>
        {/* Название комнаты */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 0.5, color: theme.palette.text.secondary }}
          >
            Название комнаты
          </Typography>
          <TextField
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              },
            }}
          />
        </Box>

        {/* Текущий цвет */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: theme.palette.text.secondary }}
          >
            Текущий цвет:
          </Typography>
          <Box
            onClick={onAddColorClick}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "8px",
              bgcolor: bgColor,
              border: `1px solid ${theme.palette.divider}`,
              cursor: "pointer",
            }}
          />
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {bgColor}
          </Typography>
        </Box>

        {/* Базовые цвета */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
          {basePresets.map((color) => (
            <Box
              key={color}
              onClick={() => setBgColor(color)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: color,
                cursor: "pointer",
                border:
                  bgColor === color
                    ? `3px solid ${theme.palette.primary.main}`
                    : "2px solid transparent",
                transition: "border-color 0.2s",
              }}
            />
          ))}
        </Box>

        {/* Пользовательские пресеты */}
        {userPresets.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: theme.palette.text.secondary,
              }}
            >
              Мои цвета
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {userPresets.map((color) => (
                <Box
                  key={color}
                  sx={{ position: "relative" }}
                >
                  <Box
                    onClick={() => setBgColor(color)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border:
                        bgColor === color
                          ? `3px solid ${theme.palette.primary.main}`
                          : "2px solid transparent",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeUserPreset(color)}
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.error.main,
                      border: `1px solid ${theme.palette.divider}`,
                      "&:hover": { bgcolor: theme.palette.action.hover },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Добавить новый цвет */}
        <Button
          onClick={onAddColorClick}
          variant="outlined"
          sx={{
            borderRadius: "50px",
            textTransform: "none",
            fontWeight: 600,
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.action.hover,
            "&:hover": { backgroundColor: theme.palette.action.selected },
          }}
        >
          Добавить цвет
        </Button>

        {/* Цветовой пикер */}
        {showPicker && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1200,
            }}
          >
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                borderRadius: "16px",
                p: 3,
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <HexColorPicker
                color={tempPickerColor}
                onChange={setTempPickerColor}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button
                  onClick={cancelPicker}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    borderRadius: "8px",
                  }}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmPicker}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "8px",
                  }}
                >
                  ОК
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: "50px",
            color: theme.palette.text.primary,
          }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            textTransform: "none",
            borderRadius: "50px",
            fontWeight: 600,
          }}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};
