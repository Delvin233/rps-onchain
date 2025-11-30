/**
 * Font Theme Presets for RPS-OnChain
 * Switch between different font combinations by changing ACTIVE_FONT_THEME
 */

export type FontTheme = {
  name: string;
  heading: string;
  body: string;
  mono: string;
  googleFontsUrl: string;
  fontSizeMultiplier?: number; // Optional: increase font size for pixelated fonts
};

export const FONT_THEMES: Record<string, FontTheme> = {
  // Theme 1: Futuristic Gaming
  futuristic: {
    name: "Futuristic Gaming",
    heading: "Orbitron",
    body: "Rajdhani",
    mono: "JetBrains Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
    fontSizeMultiplier: 1.2,
  },

  // Theme 2: Modern Web3
  modernWeb3: {
    name: "Modern Web3",
    heading: "Sora",
    body: "DM Sans",
    mono: "JetBrains Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
    fontSizeMultiplier: 1.2,
  },

  // Theme 3: Retro Arcade
  retroArcade: {
    name: "Retro Arcade",
    heading: "Silkscreen",
    body: "VT323",
    mono: "Courier Prime",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&family=Courier+Prime:wght@400;700&display=swap",
    fontSizeMultiplier: 1.2,
  },

  // Theme 4: Clean & Modern
  cleanModern: {
    name: "Clean & Modern",
    heading: "Plus Jakarta Sans",
    body: "Inter",
    mono: "Fira Code",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600;700&display=swap",
    fontSizeMultiplier: 1.2,
  },

  // Theme 5: Tech Forward
  techForward: {
    name: "Tech Forward",
    heading: "Syne",
    body: "Manrope",
    mono: "Source Code Pro",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600;700&display=swap",
    fontSizeMultiplier: 1.2,
  },

  // Theme 6: Cyberpunk
  cyberpunk: {
    name: "Cyberpunk",
    heading: "Teko",
    body: "Electrolize",
    mono: "Azeret Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Teko:wght@300;400;500;600;700&family=Electrolize&family=Azeret+Mono:wght@400;500;600;700&display=swap",
    fontSizeMultiplier: 1.2,
  },

  // Theme 7: Minimal Pro
  minimalPro: {
    name: "Minimal Pro",
    heading: "Outfit",
    body: "Work Sans",
    mono: "IBM Plex Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Work+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap",
    fontSizeMultiplier: 1.2,
  },

  // Theme 8: Neon Gaming
  neonGaming: {
    name: "Neon Gaming",
    heading: "Bungee",
    body: "Kanit",
    mono: "Roboto Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Bungee&family=Kanit:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap",
    fontSizeMultiplier: 1.2,
  },
};

// 🎨 DEFAULT THEME
export const DEFAULT_FONT_THEME: keyof typeof FONT_THEMES = "futuristic";

// Get current user address from localStorage (set by wallet connection)
const getCurrentUserKey = (): string => {
  if (typeof window === "undefined") return "";
  // Try to get the connected address from various sources
  const address = localStorage.getItem("currentUserAddress") || "default";
  return address.toLowerCase();
};

// Get theme from localStorage or use default
export const getActiveTheme = (): FontTheme => {
  if (typeof window === "undefined") {
    return FONT_THEMES[DEFAULT_FONT_THEME];
  }

  const userKey = getCurrentUserKey();
  const saved = localStorage.getItem(`fontTheme_${userKey}`) as keyof typeof FONT_THEMES;
  return FONT_THEMES[saved] || FONT_THEMES[DEFAULT_FONT_THEME];
};

// Save theme preference and apply immediately
export const setFontTheme = (themeKey: keyof typeof FONT_THEMES) => {
  if (typeof window !== "undefined") {
    const userKey = getCurrentUserKey();
    localStorage.setItem(`fontTheme_${userKey}`, themeKey);

    // Apply CSS variables immediately
    const theme = FONT_THEMES[themeKey];
    const root = document.documentElement.style;
    root.setProperty("--font-heading", `'${theme.heading}', system-ui, sans-serif`);
    root.setProperty("--font-body", `'${theme.body}', system-ui, sans-serif`);
    root.setProperty("--font-mono", `'${theme.mono}', monospace`);
    root.setProperty("--font-size-multiplier", (theme.fontSizeMultiplier || 1).toString());
    document.body.style.fontFamily = `'${theme.body}', system-ui, sans-serif`;

    // Load font if not already loaded
    if (!document.querySelector(`link[href="${theme.googleFontsUrl}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = theme.googleFontsUrl;
      document.head.appendChild(link);
    }
  }
};

// Get all theme options for dropdown
export const getThemeOptions = () => {
  return Object.entries(FONT_THEMES).map(([key, theme]) => ({
    value: key,
    label: theme.name,
  }));
};
