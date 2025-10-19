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
    'none', // elevation 0
    '0px 2px 6px rgba(60, 150, 239, 0.08), 0px 4px 12px rgba(60, 150, 239, 0.06)', // 1
    '0px 4px 8px rgba(60, 150, 239, 0.12), 0px 6px 20px rgba(60, 150, 239, 0.08)', // 2
    '0px 6px 10px rgba(60, 150, 239, 0.16), 0px 12px 24px rgba(60, 150, 239, 0.10)', // 3
    ...Array(21).fill('none'), // 4–24 (добавляем, чтобы было ровно 25)
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
        contained: {
          backgroundColor: '#3C96EF',
          color: '#FFFFFF',
          boxShadow: '0px 2px 6px rgba(60, 150, 239, 0.08)',
          '&:hover': {
            backgroundColor: '#2F7DD6',
            boxShadow: '0px 4px 8px rgba(60, 150, 239, 0.12)',
          },
        },
        outlined: {
          border: '1px solid #CED2D6',
          color: '#626466',
          borderRadius: 100,
          '&:hover': {
            border: '1px solid #3C96EF',
            color: '#3C96EF',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            '0px 2px 6px rgba(60, 150, 239, 0.08), 0px 4px 12px rgba(60, 150, 239, 0.06)',
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow:
            '0px 4px 8px rgba(60, 150, 239, 0.12), 0px 6px 20px rgba(60, 150, 239, 0.08)',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem',
          backgroundColor: '#3C96EF',
          color: '#FFFFFF',
          borderRadius: 8,
          padding: '6px 12px',
        },
      },
    },
  },
});
