"use client";

import { useEffect } from "react";
import { getSpacingScale } from "~~/styles/spacingThemes";

export const SpacingLoader = () => {
  useEffect(() => {
    const spacing = getSpacingScale();

    const spacingMap: Record<string, string> = {
      "p-3": "0.75rem",
      "p-4": "1rem",
      "p-6": "1.5rem",
      "space-y-2": "0.5rem",
      "space-y-3": "0.75rem",
      "space-y-4": "1rem",
      "gap-2": "0.5rem",
      "gap-3": "0.75rem",
      "gap-4": "1rem",
      "gap-6": "1.5rem",
    };

    const style = document.createElement("style");
    style.id = "spacing-variables";
    style.textContent = `
      :root {
        --card-padding: ${spacingMap[spacing.cardPadding]};
        --card-gap: ${spacingMap[spacing.cardGap]};
        --section-gap: ${spacingMap[spacing.sectionGap]};
        --inner-gap: ${spacingMap[spacing.innerGap]};
      }
    `;

    const existingStyle = document.getElementById("spacing-variables");
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
