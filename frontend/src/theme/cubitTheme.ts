import { createTheme } from '@mui/material/styles';

export const cubitTheme = createTheme({
  typography: {
    fontFamily: 'Roboto, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.3 },
    h2: { fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.35 },
    h3: { fontWeight: 500, fontSize: '1.5rem', lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 500 },
  },

  palette: {
    mode: 'light',
    background: {
      default: '#F0F5FA',
      paper: '#FFFFFF',
    },
    primary: {
      main: '#3C96EF',
      dark: '#2F7DD6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#626466',
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#626466',
    },
    divider: '#CED2D6',
    error: { main: '#E53935' },
    success: { main: '#43A047' },
    warning: { main: '#F9A825' },
  },

  shape: {
    borderRadius: 12,
  },

  // ✅ Исправлено: создаём строго 25 теней
   shadows: [
    'none', // 0
    '0 1px 2px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.12)',          // 1
    '0 2px 4px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.14)',          // 2
    '0 4px 8px rgba(0,0,0,.12), 0 6px 12px rgba(0,0,0,.16)',         // 3
    '0 6px 12px rgba(0,0,0,.14), 0 10px 18px rgba(0,0,0,.18)',       // 4
    '0 8px 16px rgba(0,0,0,.16), 0 12px 22px rgba(0,0,0,.20)',       // 5
    // 6–24 — одинаковые, но можно варьировать при желании
    ...Array(19).fill('0 12px 24px rgba(0,0,0,.18), 0 16px 32px rgba(0,0,0,.24)'),
  ] as any,

 components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 500,
          borderRadius: 12,
          padding: '8px 20px',
          transition: 'all 0.2s ease',
        },
        // ✅ чёрные тени вместо синевы
        contained: {
          backgroundColor: '#3C96EF',
          color: '#FFFFFF',
          boxShadow: '0 2px 6px rgba(0,0,0,.08)',
          '&:hover': {
            backgroundColor: '#2F7DD6',
            boxShadow: '0 4px 10px rgba(0,0,0,.12)',
          },
          '&:active': {
            boxShadow: '0 2px 6px rgba(0,0,0,.10) inset',
          },
        },
        outlined: {
          border: '1px solid #CED2D6',
          color: '#626466',
          borderRadius: 100,
          '&:hover': {
            border: '1px solid #3C96EF',
            color: '#3C96EF',
            boxShadow: '0 1px 3px rgba(0,0,0,.10)', // лёгкий hover
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          // ✅ используем системную тень
          boxShadow: undefined,
        },
      },
      defaultProps: {
        elevation: 2, // => theme.shadows[2]
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: undefined,
        },
      },
      defaultProps: { elevation: 3 },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem',
          backgroundColor: '#3C96EF',
          color: '#FFFFFF',
          borderRadius: 8,
          padding: '6px 12px',
          // тень тоже нейтральная
          boxShadow: '0 4px 10px rgba(0,0,0,.12)',
        },
      },
    },
  },
});
