import { createTheme, responsiveFontSizes } from '@mui/material/styles'

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e6f5c',
    },
    secondary: {
      main: '#f4a261',
    },
    background: {
      default: '#f4f7f2',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Manrope, "Segoe UI", sans-serif',
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.55,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: -0.2,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: -0.1,
    },
    h6: {
      fontWeight: 700,
    },
    overline: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
          '@media (max-width:600px)': {
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #e5ece5',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            '&:hover': {
              backgroundColor: '#185f4e',
            },
          },
        },
      ],
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
          '&:active': {
            boxShadow: 'none',
          },
        },
        sizeLarge: {
          paddingTop: 12,
          paddingBottom: 12,
          '@media (max-width:600px)': {
            paddingTop: 10,
            paddingBottom: 10,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          '@media (max-width:600px)': {
            borderRadius: 0,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          '&:hover': {
            opacity: 0.85,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
        },
      },
    },
  },
})

export const appTheme = responsiveFontSizes(baseTheme)
