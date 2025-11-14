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
  },

  // Theme 2: Modern Web3
  modernWeb3: {
    name: "Modern Web3",
    heading: "Space Grotesk",
    body: "Inter",
    mono: "JetBrains Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
  },

  // Theme 3: Retro Arcade
  retroArcade: {
    name: "Retro Arcade",
    heading: "Press Start 2P",
    body: "Rajdhani",
    mono: "Courier Prime",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@300;400;500;600;700&family=Courier+Prime:wght@400;700&display=swap",
  },

  // Theme 4: Clean & Modern
  cleanModern: {
    name: "Clean & Modern",
    heading: "Exo 2",
    body: "Poppins",
    mono: "Fira Code",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600;700&display=swap",
  },

  // Theme 5: Tech Forward
  techForward: {
    name: "Tech Forward",
    heading: "Chakra Petch",
    body: "Inter",
    mono: "Source Code Pro",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600;700&display=swap",
  },

  // Theme 6: Cyberpunk
  cyberpunk: {
    name: "Cyberpunk",
    heading: "Audiowide",
    body: "Exo 2",
    mono: "Share Tech Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Audiowide&family=Exo+2:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap",
  },

  // Theme 7: Minimal Pro
  minimalPro: {
    name: "Minimal Pro",
    heading: "Montserrat",
    body: "Inter",
    mono: "IBM Plex Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap",
  },

  // Theme 8: Neon Gaming
  neonGaming: {
    name: "Neon Gaming",
    heading: "Russo One",
    body: "Saira",
    mono: "Roboto Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Russo+One&family=Saira:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap",
  },
};

// 🎨 CHANGE THIS TO SWITCH THEMES
export const ACTIVE_FONT_THEME: keyof typeof FONT_THEMES = "techForward";

export const getActiveTheme = () => FONT_THEMES[ACTIVE_FONT_THEME];
