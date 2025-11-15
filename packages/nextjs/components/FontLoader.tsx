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
    style.textContent = `
      :root {
        --font-heading: '${fontTheme.heading}', system-ui, sans-serif;
        --font-body: '${fontTheme.body}', system-ui, sans-serif;
        --font-mono: '${fontTheme.mono}', monospace;
      }
      body {
        font-family: var(--font-body);
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
};
