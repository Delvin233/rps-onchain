/**
 * RPS-OnChain Theme Configuration
 * Centralized theme settings for colors, fonts, animations, and spacing
 */

export const themeConfig = {
  // Color Palette
  colors: {
    // Primary (Green/Emerald)
    primary: {
      main: "hsl(142 76% 36%)",
      light: "hsl(158 64% 52%)",
      dark: "hsl(142 76% 26%)",
      foreground: "hsl(222 84% 4.9%)",
    },
    // Secondary (Blue/Purple)
    secondary: {
      main: "hsl(217 91% 60%)",
      light: "hsl(271 91% 65%)",
      dark: "hsl(217 91% 50%)",
      foreground: "hsl(222 84% 4.9%)",
    },
    // Accent (Purple)
    accent: {
      main: "hsl(271 91% 65%)",
      light: "hsl(271 91% 75%)",
      dark: "hsl(271 91% 55%)",
      foreground: "hsl(210 40% 98%)",
    },
    // Game Colors
    game: {
      rock: "hsl(25 95% 53%)",
      paper: "hsl(47 96% 53%)",
      scissors: "hsl(0 84% 60%)",
    },
    // Status Colors
    status: {
      success: "hsl(142 76% 36%)",
      warning: "hsl(47 96% 53%)",
      error: "hsl(0 84% 60%)",
      info: "hsl(217 91% 60%)",
    },
    // Farcaster Brand
    farcaster: {
      purple: "#8a63d2",
      purpleDark: "#7952b3",
    },
  },

  // Typography
  typography: {
    fonts: {
      // System fonts (current)
      body: "system-ui, -apple-system, sans-serif",
      // Gaming fonts (to be added)
      heading: "var(--font-orbitron, system-ui)",
      mono: "monospace",
    },
    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing
  spacing: {
    touchTarget: "48px", // Minimum touch target size
    cardPadding: "1.5rem",
    sectionGap: "2rem",
  },

  // Border Radius
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px",
  },

  // Shadows & Effects
  effects: {
    shadows: {
      glow: "0 0 20px rgba(52, 211, 153, 0.3)",
      glowPrimary: "0 0 20px hsl(142 76% 36% / 0.3)",
      glowSecondary: "0 0 20px hsl(217 91% 60% / 0.3)",
      glowAccent: "0 0 20px hsl(271 91% 65% / 0.3)",
      card: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
    },
    blur: {
      sm: "4px",
      md: "8px",
      lg: "12px",
    },
  },

  // Animations
  animations: {
    durations: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
    easings: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      smooth: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },

  // Gradients
  gradients: {
    primary: "linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(158 64% 52%) 100%)",
    secondary: "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(271 91% 65%) 100%)",
    gaming: "linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))",
  },
} as const;

// Type exports for TypeScript
export type ThemeConfig = typeof themeConfig;
export type ColorKey = keyof typeof themeConfig.colors;
export type FontKey = keyof typeof themeConfig.typography.fonts;
