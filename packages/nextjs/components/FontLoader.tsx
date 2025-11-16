"use client";

import { useEffect } from "react";
import { getActiveTheme } from "~~/styles/fontThemes";

export const FontLoader = () => {
  useEffect(() => {
    const fontTheme = getActiveTheme();
    const root = document.documentElement;
    const sizeMultiplier = fontTheme.fontSizeMultiplier || 1;

    // Set CSS variables directly
    root.style.setProperty("--font-heading", `'${fontTheme.heading}', system-ui, sans-serif`);
    root.style.setProperty("--font-body", `'${fontTheme.body}', system-ui, sans-serif`);
    root.style.setProperty("--font-mono", `'${fontTheme.mono}', monospace`);
    root.style.setProperty("--font-size-multiplier", sizeMultiplier.toString());

    // Load or update font link
    let link = document.getElementById("custom-fonts") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.id = "custom-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = fontTheme.googleFontsUrl;

    // Add static styles once
    if (!document.getElementById("font-theme-styles")) {
      const style = document.createElement("style");
      style.id = "font-theme-styles";
      style.textContent = `
        body { font-family: var(--font-body) !important; font-size: calc(1.0625rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
        h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading) !important; }
        h1 { font-size: calc(2rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
        h2 { font-size: calc(1.5rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
        h3 { font-size: calc(1.25rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
        h4 { font-size: calc(1.125rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
        button { font-family: var(--font-heading) !important; }
        p, span, div, a, label { font-family: var(--font-body) !important; font-size: calc(1.0625rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
        input, textarea, select { font-family: var(--font-body) !important; font-size: calc(1rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
        code, pre, kbd, samp { font-family: var(--font-mono) !important; font-size: calc(0.9375rem * var(--font-size-multiplier) * var(--font-size-override, 1)) !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return null;
};
