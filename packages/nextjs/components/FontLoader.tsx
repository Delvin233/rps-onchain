"use client";

import { useEffect } from "react";
import { getActiveTheme } from "~~/styles/fontThemes";

export const FontLoader = () => {
  useEffect(() => {
    const fontTheme = getActiveTheme();

    // Create and inject font link
    const existingLink = document.getElementById("custom-fonts");
    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement("link");
    link.id = "custom-fonts";
    link.rel = "stylesheet";
    link.href = fontTheme.googleFontsUrl;
    document.head.appendChild(link);

    // Create and inject CSS variables
    const existingStyle = document.getElementById("font-variables");
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = "font-variables";
    const sizeMultiplier = fontTheme.fontSizeMultiplier || 1;
    style.textContent = `
      :root {
        --font-heading: '${fontTheme.heading}', system-ui, sans-serif;
        --font-body: '${fontTheme.body}', system-ui, sans-serif;
        --font-mono: '${fontTheme.mono}', monospace;
        --font-size-multiplier: ${sizeMultiplier};
      }
      body {
        font-family: var(--font-body) !important;
        font-size: calc(1rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading) !important;
      }
      h1 { font-size: calc(2.5rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
      h2 { font-size: calc(1.875rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
      h3 { font-size: calc(1.5rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
      h4 { font-size: calc(1.25rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
      button {
        font-family: var(--font-heading) !important;
      }
      p, span, div, a, label {
        font-family: var(--font-body) !important;
      }
      input, textarea, select {
        font-family: var(--font-body) !important;
      }
      code, pre, kbd, samp {
        font-family: var(--font-mono) !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
};
