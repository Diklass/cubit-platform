// src/components/ui/ExpressiveSegmentedTabs.tsx
import * as React from 'react';
import { Box, Button, SxProps, Theme } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

type Option = { key: string; label: React.ReactNode };

type Props = {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
  size?: 'sm' | 'md';
  gap?: number;
  sx?: SxProps<Theme>;
};

// Пружина с «магнитным» откликом (MD3-vibes)
const spring = { type: 'spring', stiffness: 520, damping: 28, mass: 0.7 } as const;

export default function ExpressiveSegmentedTabs({
  options,
  value,
  onChange,
  size = 'md',
  gap = 8,
  sx,
}: Props) {
  const theme = useTheme();

  const padY = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? '0.875rem' : '0.95rem';
  const radiusInactive = 10;

  return (
    <Box
      role="tablist"
      aria-label="Переключатель"
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px`,
        p: 0,
        bgcolor: 'transparent',
        ...sx,
      }}
    >
      {options.map((opt) => {
        const selected = opt.key === value;

        return (
          <Box key={opt.key} sx={{ position: 'relative', minWidth: 0, flex: 1 }}>
            {/* Пилюля рендерится только под активным сегментом и «телепортируется» между ними */}
            {selected && (
              <motion.div
                layoutId="expressive-pill"
                transition={spring}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  background: theme.palette.primary.main,
                  zIndex: 0,
                  pointerEvents: 'none',
                  willChange: 'transform',
                }}
              />
            )}

            <Button
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(opt.key)}
              disableElevation
              fullWidth
              sx={{
                position: 'relative',
                zIndex: 1,               // текст иконки поверх пилюли
                minHeight: 40,
                px: 2.2,
                py: `${padY}px`,
                lineHeight: 1.2,
                textTransform: 'none',
                fontWeight: 600,         // одинаковый вес → без «прыжков» ширины
                fontSize,
                borderRadius: selected ? '999px' : `${radiusInactive}px`,
                // фиксированная толщина бордера в обоих состояниях → без дерганья
                border: '1px solid',
                borderColor: selected ? 'transparent' : theme.palette.divider,
                color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
                bgcolor: 'transparent',  // фон делает пилюля
                transition: 'border-radius .24s cubic-bezier(.2,.8,.2,1), color .15s',
                '&:hover': {
                  bgcolor: selected ? 'transparent' : alpha(theme.palette.primary.main, 0.08),
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>
                {opt.label}
              </Box>
            </Button>
          </Box>
        );
      })}
    </Box>
  );
}
