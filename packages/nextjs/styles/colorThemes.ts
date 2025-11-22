/**
 * Color Theme Presets for RPS-OnChain
 * Switch between different color palettes
 */

export type ColorTheme = {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  success: string;
  error: string;
  warning: string;
};

export const COLOR_THEMES: Record<string, ColorTheme> = {
  // Theme 1: Delvin233's Default (Creator's Signature)
  delvin233: {
    name: "delvin233's Default",
    primary: "#10b981",
    secondary: "#6ee7b7",
    accent: "#34d399",
    background: "#0a0a0a",
    backgroundAlt: "#171717",
    card: "#1f1f1f",
    border: "#2d2d2d",
    text: "#f5f5f5",
    textMuted: "#a3a3a3",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
  },

  // Theme 2: Neon Cyberpunk
  neonCyberpunk: {
    name: "Neon Cyberpunk",
    primary: "#34d399",
    secondary: "#60a5fa",
    accent: "#a78bfa",
    background: "#0f172a",
    backgroundAlt: "#1e293b",
    card: "#1e293b",
    border: "#334155",
    text: "#f5f5f4",
    textMuted: "#94a3b8",
    success: "#34d399",
    error: "#ef4444",
    warning: "#fbbf24",
  },

  // Theme 3: Ocean Breeze
  oceanBreeze: {
    name: "Ocean Breeze",
    primary: "#06b6d4",
    secondary: "#3b82f6",
    accent: "#8b5cf6",
    background: "#0c1222",
    backgroundAlt: "#1a2332",
    card: "#1a2332",
    border: "#2d3f5f",
    text: "#e0f2fe",
    textMuted: "#7dd3fc",
    success: "#10b981",
    error: "#f43f5e",
    warning: "#f59e0b",
  },

  // Theme 4: Sunset Glow
  sunsetGlow: {
    name: "Sunset Glow",
    primary: "#f59e0b",
    secondary: "#ef4444",
    accent: "#ec4899",
    background: "#1c0f0a",
    backgroundAlt: "#2d1810",
    card: "#2d1810",
    border: "#4a2818",
    text: "#fef3c7",
    textMuted: "#fcd34d",
    success: "#84cc16",
    error: "#dc2626",
    warning: "#f97316",
  },

  // Theme 5: Forest Night
  forestNight: {
    name: "Forest Night",
    primary: "#10b981",
    secondary: "#059669",
    accent: "#14b8a6",
    background: "#0a1f1a",
    backgroundAlt: "#0f2f27",
    card: "#0f2f27",
    border: "#1a4d3f",
    text: "#d1fae5",
    textMuted: "#6ee7b7",
    success: "#22c55e",
    error: "#f87171",
    warning: "#fbbf24",
  },

  // Theme 6: Royal Purple
  royalPurple: {
    name: "Royal Purple",
    primary: "#8b5cf6",
    secondary: "#a78bfa",
    accent: "#c084fc",
    background: "#1a0f2e",
    backgroundAlt: "#2d1b4e",
    card: "#2d1b4e",
    border: "#4c2f7a",
    text: "#f3e8ff",
    textMuted: "#d8b4fe",
    success: "#34d399",
    error: "#f472b6",
    warning: "#fbbf24",
  },

  // Theme 7: Fire & Ice
  fireIce: {
    name: "Fire & Ice",
    primary: "#ef4444",
    secondary: "#06b6d4",
    accent: "#f97316",
    background: "#1a0a0a",
    backgroundAlt: "#2d1414",
    card: "#2d1414",
    border: "#4a2020",
    text: "#fef2f2",
    textMuted: "#fca5a5",
    success: "#22c55e",
    error: "#dc2626",
    warning: "#fb923c",
  },

  // Theme 8: Monochrome Pro
  monochromePro: {
    name: "Monochrome Pro",
    primary: "#6b7280",
    secondary: "#9ca3af",
    accent: "#d1d5db",
    background: "#0a0a0a",
    backgroundAlt: "#1a1a1a",
    card: "#1a1a1a",
    border: "#2d2d2d",
    text: "#f5f5f5",
    textMuted: "#a3a3a3",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
  },

  // Theme 9: Retro Arcade
  retroArcade: {
    name: "Retro Arcade",
    primary: "#fbbf24",
    secondary: "#f59e0b",
    accent: "#ef4444",
    background: "#1a0f00",
    backgroundAlt: "#2d1a00",
    card: "#2d1a00",
    border: "#4a2f00",
    text: "#fef3c7",
    textMuted: "#fcd34d",
    success: "#84cc16",
    error: "#dc2626",
    warning: "#fb923c",
  },
};

// 🎨 DEFAULT THEME
export const DEFAULT_COLOR_THEME: keyof typeof COLOR_THEMES = "delvin233";

// Get theme from localStorage or use default
export const getActiveColorTheme = (): ColorTheme => {
  if (typeof window === "undefined") {
    return COLOR_THEMES[DEFAULT_COLOR_THEME];
  }

  const saved = localStorage.getItem("colorTheme") as keyof typeof COLOR_THEMES;
  return COLOR_THEMES[saved] || COLOR_THEMES[DEFAULT_COLOR_THEME];
};

// Save theme preference and apply immediately
export const setColorTheme = (themeKey: keyof typeof COLOR_THEMES) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("colorTheme", themeKey);

    // Apply CSS variables immediately
    const theme = COLOR_THEMES[themeKey];
    const root = document.documentElement.style;
    root.setProperty("--theme-primary", theme.primary);
    root.setProperty("--theme-secondary", theme.secondary);
    root.setProperty("--theme-background", theme.background);
    root.setProperty("--theme-background-alt", theme.backgroundAlt);
    root.setProperty("--theme-card", theme.card);
    root.setProperty("--theme-text", theme.text);
    root.setProperty("--color-base-100", theme.backgroundAlt);
    root.setProperty("--color-base-200", theme.background);
    root.setProperty("--color-base-300", theme.card);
    root.setProperty("--color-primary", theme.primary);
    root.setProperty("--color-secondary", theme.secondary);
    root.setProperty("--color-base-content", theme.text);
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
  }
};

// Get all theme options for dropdown
export const getColorThemeOptions = () => {
  return Object.entries(COLOR_THEMES).map(([key, theme]) => ({
    value: key,
    label: theme.name,
  }));
};
