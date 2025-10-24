import React, { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Box, Paper, Button, useTheme } from "@mui/material";

interface Props {
  color: string;
  onChange: (color: string) => void;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export const ColorPickerPopover: React.FC<Props> = ({
  color,
  onChange,
  anchorEl,
  onClose,
}) => {
  const theme = useTheme();
  const [tempColor, setTempColor] = useState(color);
  const ref = useRef<HTMLDivElement>(null);

  // закрытие по клику вне окна
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !anchorEl?.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorEl]);

  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  // рассчитываем позицию СЛЕВА
  const left = Math.max(12, rect.left - 240); // смещение влево
  const top = Math.min(
    window.innerHeight - 260,
    Math.max(8, rect.top + window.scrollY)
  );

  return (
    <Paper
      ref={ref}
      sx={{
        position: "absolute",
        top,
        left,
        p: 2,
        borderRadius: 3,
        boxShadow: theme.shadows[6],
        zIndex: 2000,
        backgroundColor: theme.palette.background.paper,
        width: 220,
      }}
    >
      <HexColorPicker color={tempColor} onChange={setTempColor} />
      <Box mt={1.5} display="flex" justifyContent="flex-end" gap={1}>
        <Button size="small" onClick={onClose}>
          Отмена
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            onChange(tempColor);
            onClose();
          }}
        >
          OK
        </Button>
      </Box>
    </Paper>
  );
};
