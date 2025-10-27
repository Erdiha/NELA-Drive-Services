// theme.js
// NELA Professional Theme - Modern, Warm, Inviting
// Sunset gradient palette with clear online/offline states

export const theme = {
  // COLORS - Sunset Gradient Palette
  colors: {
    // Primary: Rich Purple (Online state)
    primary: {
      main: "#7c3aed",
      light: "#8b5cf6",
      dark: "#6d28d9",
    },

    // Secondary: Warm Amber/Gold
    secondary: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },

    // Accent: Bright Cyan
    accent: {
      main: "#06b6d4",
      light: "#22d3ee",
      dark: "#0891b2",
    },

    // Status colors
    status: {
      success: "#10b981", // Emerald green
      danger: "#ef4444", // Red
      warning: "#f59e0b",
      info: "#06b6d4",
      online: "#10b981",
      offline: "#71717a",
    },

    // Background colors - Clean & Modern
    background: {
      primary: "#fafafa", // neutral-50 - Main screen background
      secondary: "#f4f4f5", // neutral-100 - Secondary areas
      card: "#ffffff", // Pure white cards
      border: "#e4e4e7", // neutral-200 - Subtle borders
      offline: "#f4f4f5", // Offline state background
    },

    // Text colors - Clear hierarchy
    text: {
      primary: "#18181b", // neutral-900 - Main text
      secondary: "#3f3f46", // neutral-700 - Secondary text
      tertiary: "#71717a", // neutral-500 - Subtle text
      disabled: "#a1a1aa", // neutral-400 - Disabled text
      onPrimary: "#ffffff", // Text on colored backgrounds
    },

    // Neutral palette (full spectrum)
    neutral: {
      50: "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
    },

    // Online/Offline specific colors
    online: {
      gradient: ["#8b5cf6", "#ec4899"], // Purple to Pink
      background: "#f0fdf4", // Light green tint
      border: "#10b981",
      text: "#065f46",
      glow: "#8b5cf6",
    },

    offline: {
      background: "#fafafa",
      border: "#d4d4d8",
      text: "#71717a",
      glow: "#a1a1aa",
    },
  },

  // GRADIENTS - Beautiful transitions
  gradients: {
    // Primary gradient (Online state)
    primary: {
      colors: ["#8b5cf6", "#ec4899"], // Purple to Pink
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },

    // Secondary gradient
    secondary: {
      colors: ["#fbbf24", "#f59e0b"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },

    // Accent gradient
    accent: {
      colors: ["#22d3ee", "#06b6d4"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },

    // Success gradient
    success: {
      colors: ["#34d399", "#10b981"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },

    // Offline gradient (subtle gray)
    offline: {
      colors: ["#d4d4d8", "#a1a1aa"],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    },
  },

  // SPACING (8px base - comfortable & consistent)
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // TYPOGRAPHY - Clear & readable
  typography: {
    fontSize: {
      xxs: 10,
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      xxxxl: 40,
    },
    fontWeight: {
      light: "300",
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // SHADOWS - Subtle depth
  shadows: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    // Glow effects for online/offline states
    glow: {
      online: {
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
      offline: {
        shadowColor: "#71717a",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    },
  },

  // LAYOUT - Consistent structure
  layout: {
    borderRadius: {
      xs: 4,
      sm: 6,
      md: 8,
      lg: 12,
      xl: 16,
      xxl: 24,
      full: 9999,
    },
    borderWidth: {
      thin: 1,
      medium: 2,
      thick: 3,
    },
    iconSize: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 40,
    },
  },

  // ANIMATIONS - Smooth & pleasant
  animations: {
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 500,
      verySlow: 800,
    },
    // Pulse animation for online button
    pulse: {
      duration: 2000,
      scale: [1, 1.05, 1],
    },
  },

  // OPACITY LEVELS
  opacity: {
    disabled: 0.4,
    subtle: 0.6,
    medium: 0.8,
    full: 1,
  },
};

export default theme;
