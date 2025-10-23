import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Box,
} from "@mui/material";
import { motion } from "framer-motion";
import AnimatedSubmitButton from "./AnimatedSubmitButton"; // ✅ подключаем твою кнопку

interface AddDialogProps {
  open: boolean;
  title: string;
  label: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export const AddDialog: React.FC<AddDialogProps> = ({
  open,
  title,
  label,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = React.useState("");
  const theme = useTheme();

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
        sx: {
          borderRadius: "24px",
          p: 1,
          bgcolor: theme.palette.background.paper,
          boxShadow: theme.shadows[8],
          width: "min(400px, 90vw)",
        },
      }}
    >
      {/* 🔹 Заголовок */}
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          textAlign: "center",
          color: theme.palette.text.primary,
          mb: 1,
        }}
      >
        {title}
      </DialogTitle>

      {/* 🔹 Поле ввода */}
      <DialogContent>
        <TextField
          fullWidth
          variant="outlined"
          label={label}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor:
                theme.palette.mode === "dark" ? "#2d2d2d" : "#f7f9fc",
            },
          }}
        />
      </DialogContent>

      {/* 🔹 Кнопки */}
      <DialogActions
        sx={{
          justifyContent: "center",
          gap: 2,
          pb: 2,
          pt: 1,
        }}
      >
        {/* Отмена — нейтральная */}
        <AnimatedSubmitButton
          tone="neutral"
          size="medium"
          onClick={onClose}
        >
          Отмена
        </AnimatedSubmitButton>

        {/* Создать — акцентная */}
        <AnimatedSubmitButton
          tone="primary"
          size="medium"
          onClick={handleSubmit}
        >
          Создать
        </AnimatedSubmitButton>
      </DialogActions>
    </Dialog>
  );
};
