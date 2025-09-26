import * as React from 'react';
import { Button, ButtonProps, CircularProgress, useTheme, Box } from '@mui/material';
import { m } from 'framer-motion';

export type AnimatedSubmitButtonProps = ButtonProps & {
  loading?: boolean;
  /** серый вид для «неактивной» кнопки списка */
  tone?: 'primary' | 'neutral';
  /** форсируем прямоугольник (например, при «нажатой» комнате) */
  activeRect?: boolean;
};

const spring = { type: 'spring', stiffness: 520, damping: 28, mass: 0.7 } as const;
const sideSlot = 24;

const AnimatedSubmitButton = React.forwardRef<HTMLButtonElement, AnimatedSubmitButtonProps>(
  ({ loading = false, tone = 'primary', activeRect = false, children, startIcon, sx, ...rest }, ref) => {
    const theme = useTheme();

    // предсказуемая высота для всех размеров
    const sizeProp = (rest.size ?? 'large') as 'small' | 'medium' | 'large';
    const btnHeight = sizeProp === 'large' ? 44 : sizeProp === 'medium' ? 40 : 36;

    // цвета
    const primaryBg = theme.palette.primary.main;
    const onPrimary = theme.palette.primary.contrastText;
    const neutralBg =
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200];
    const onNeutral = theme.palette.text.primary;

    const isRect = loading || activeRect;
    const bgColor = tone === 'primary' ? primaryBg : neutralBg;
    const fgColor = tone === 'primary' ? onPrimary : onNeutral;

    const fullWidth = Boolean(rest.fullWidth);
    const leftNode = loading ? (
      <CircularProgress size={20} sx={{ color: onPrimary }} />
    ) : (
      startIcon ?? null
    );

   return (
  <m.div
    initial={false}
    animate={{
      borderRadius: isRect ? 12 : 999,
      scale: loading ? 0.99 : 1,
      backgroundColor: bgColor,
    }}
    transition={spring}
    style={{
      height: btnHeight,
      width: fullWidth ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
  <Button
    ref={ref}
    variant="text"
    disableElevation
    fullWidth={fullWidth}
    disabled={rest.disabled || loading}
    sx={{
      minHeight: btnHeight,
      height: btnHeight,
      py: 0,
      px: 0,

      display: 'grid',
      gridTemplateColumns: `${sideSlot}px 1fr ${sideSlot}px`,
      alignItems: 'stretch',
      justifyItems: 'center',

      lineHeight: 'normal',
      padding: 0,
      textTransform: 'none',
      fontWeight: 700,
      color: fgColor,
      bgcolor: 'transparent',
      '&:hover': { bgcolor: 'transparent' },

      // 🔑 фиксируем внутренний label
      '& .MuiButton-label': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        lineHeight: 1,
      },

      ...sx,
    }}
    {...rest}
>
  {/* левая «ячейка» */}
  <Box
    sx={{
      width: sideSlot,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {loading ? <CircularProgress size={20} sx={{ color: onPrimary }} /> : startIcon ?? null}
  </Box>

  {/* центральный слот */}
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',   // 🔑 строго центр
      justifyContent: 'center',
      px: 3,
      lineHeight: 1,          // 🔑 текст ровно по центру
    }}
  >
    {children ?? 'Войти'}
  </Box>

  {/* правый слот */}
  <Box sx={{ width: sideSlot, height: '100%' }} />
</Button>
      </m.div>
    );
  }
);

AnimatedSubmitButton.displayName = 'AnimatedSubmitButton';
export default AnimatedSubmitButton;
