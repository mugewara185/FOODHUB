import { createTheme, type Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    foodApp: {
      colors: {
        primary: string;
        secondary: string;
        accent: string;
        success: string;
        warning: string;
        error: string;
      };
    };
  }
  interface ThemeOptions {
    foodApp?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        success?: string;
        warning?: string;
        error?: string;
      };
    };
  }
}

const foodTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6B35', // Orange - Food app primary
      light: '#FF8B5C',
      dark: '#E55300',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00C853', // Green - Success/Vegetarian
      light: '#5EFC82',
      dark: '#009624',
    },
    error: {
      main: '#FF5252', // Red - Non-veg/Error
      light: '#FF867F',
      dark: '#C50E29',
    },
    warning: {
      main: '#FFC107', // Yellow - Spicy/Warning
      light: '#FFF350',
      dark: '#C79100',
    },
    info: {
      main: '#2196F3', // Blue - Info
      light: '#64B5F6',
      dark: '#0D47A1',
    },
    success: {
      main: '#4CAF50', // Green - Success
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
      disabled: '#B2BEC3',
    },
    grey: {
      50: '#F8F9FA',
      100: '#F1F3F4',
      200: '#E9ECEF',
      300: '#DEE2E6',
      400: '#CED4DA',
      500: '#ADB5BD',
      600: '#6C757D',
      700: '#495057',
      800: '#343A40',
      900: '#212529',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.9375rem',
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(255, 107, 53, 0.4)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8B5C 100%)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
  foodApp: {
    colors: {
      primary: '#FF6B35',
      secondary: '#00C853',
      accent: '#FFC107',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#FF5252',
    },
  },
});

export default foodTheme;