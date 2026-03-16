import { createTheme, type Theme } from '@mui/material/styles';
import { brandColors, semanticColors, neutralColors } from './color';

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      drawerWidth: number;
      borderRadius: {
        small: string;
        medium: string;
        large: string;
      };
    };
  }
  interface ThemeOptions {
    custom?: {
      drawerWidth?: number;
      borderRadius?: {
        small?: string;
        medium?: string;
        large?: string;
      };
    };
  }
}

const theme: Theme = createTheme({
  palette: {
    mode: 'light',

    primary: brandColors.primary,
    secondary: brandColors.secondary,

    ...semanticColors,

    background: neutralColors.background,
    grey: neutralColors.grey,
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },

  custom: {
    drawerWidth: 280,
    borderRadius: {
      small: '4px',
      medium: '8px',
      large: '16px',
    },
  },
});

export default theme;
