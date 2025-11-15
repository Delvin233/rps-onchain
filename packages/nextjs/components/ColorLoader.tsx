"use client";

import { useEffect } from "react";
import { getActiveColorTheme } from "~~/styles/colorThemes";

export const ColorLoader = () => {
  useEffect(() => {
    const colorTheme = getActiveColorTheme();

    const style = document.createElement("style");
    style.id = "color-variables";
    style.textContent = `
      :root {
        --theme-primary: ${colorTheme.primary};
        --theme-secondary: ${colorTheme.secondary};
        --theme-accent: ${colorTheme.accent};
        --theme-background: ${colorTheme.background};
        --theme-background-alt: ${colorTheme.backgroundAlt};
        --theme-card: ${colorTheme.card};
        --theme-border: ${colorTheme.border};
        --theme-text: ${colorTheme.text};
        --theme-text-muted: ${colorTheme.textMuted};
        --theme-success: ${colorTheme.success};
        --theme-error: ${colorTheme.error};
        --theme-warning: ${colorTheme.warning};
      }

      /* Override DaisyUI colors */
      [data-theme="dark"] {
        --color-primary: ${colorTheme.primary} !important;
        --color-secondary: ${colorTheme.secondary} !important;
        --color-accent: ${colorTheme.accent} !important;
        --color-base-100: ${colorTheme.backgroundAlt} !important;
        --color-base-200: ${colorTheme.background} !important;
        --color-base-300: ${colorTheme.card} !important;
        --color-base-content: ${colorTheme.text} !important;
        --color-success: ${colorTheme.success} !important;
        --color-error: ${colorTheme.error} !important;
        --color-warning: ${colorTheme.warning} !important;
      }

      /* Apply theme colors */
      body {
        background-color: var(--theme-background) !important;
        color: var(--theme-text) !important;
      }

      .text-primary { color: var(--theme-primary) !important; }
      .text-secondary { color: var(--theme-secondary) !important; }
      .text-accent { color: var(--theme-accent) !important; }
      .text-success { color: var(--theme-success) !important; }
      .text-error { color: var(--theme-error) !important; }
      .text-warning { color: var(--theme-warning) !important; }

      .bg-primary { background-color: var(--theme-primary) !important; }
      .bg-secondary { background-color: var(--theme-secondary) !important; }
      .bg-accent { background-color: var(--theme-accent) !important; }
      .bg-base-100 { background-color: var(--theme-background-alt) !important; }
      .bg-base-200 { background-color: var(--theme-background) !important; }
      .bg-base-300 { background-color: var(--theme-card) !important; }

      .border-primary { border-color: var(--theme-primary) !important; }
      .border-secondary { border-color: var(--theme-secondary) !important; }
      .border-border { border-color: var(--theme-border) !important; }

      .text-glow-primary { 
        text-shadow: 0 0 10px ${colorTheme.primary}80 !important; 
      }
      .shadow-glow-primary { 
        box-shadow: 0 0 20px ${colorTheme.primary}50 !important; 
      }
      .bg-gradient-primary { 
        background: linear-gradient(135deg, ${colorTheme.primary} 0%, ${colorTheme.secondary} 100%) !important; 
      }

      /* Button overrides */
      .btn-primary {
        background-color: var(--theme-primary) !important;
        border-color: var(--theme-primary) !important;
      }
      .btn-secondary {
        background-color: var(--theme-secondary) !important;
        border-color: var(--theme-secondary) !important;
      }
      .btn-accent {
        background-color: var(--theme-accent) !important;
        border-color: var(--theme-accent) !important;
      }

      /* Badge overrides */
      .badge-primary {
        background-color: var(--theme-primary) !important;
        border-color: var(--theme-primary) !important;
      }
    `;

    const existingStyle = document.getElementById("color-variables");
    if (existingStyle?.parentNode) {
      existingStyle.parentNode.removeChild(existingStyle);
    }
    document.head.appendChild(style);

    return () => {
      try {
        if (style?.parentNode) {
          style.parentNode.removeChild(style);
        }
      } catch {
        // Element already removed
      }
    };
  }, []);

  return null;
};
