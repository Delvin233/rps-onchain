/**
 * Spacing Scale Presets for RPS-OnChain
 * Control card padding, gaps, and overall density
 */

export type SpacingScale = {
  name: string;
  description: string;
  cardPadding: string;
  cardGap: string;
  sectionGap: string;
  innerGap: string;
};

export const SPACING_SCALES: Record<string, SpacingScale> = {
  compact: {
    name: "Compact",
    description: "Tight spacing, more content visible",
    cardPadding: "p-3", // 12px
    cardGap: "space-y-2", // 8px
    sectionGap: "gap-3", // 12px
    innerGap: "gap-2", // 8px
  },
  comfortable: {
    name: "Comfortable",
    description: "Balanced spacing (recommended)",
    cardPadding: "p-4", // 16px
    cardGap: "space-y-3", // 12px
    sectionGap: "gap-4", // 16px
    innerGap: "gap-3", // 12px
  },
  spacious: {
    name: "Spacious",
    description: "Generous spacing, easier to read",
    cardPadding: "p-6", // 24px
    cardGap: "space-y-4", // 16px
    sectionGap: "gap-6", // 24px
    innerGap: "gap-4", // 16px
  },
};

export const DEFAULT_SPACING_SCALE = "comfortable";

export const getSpacingScale = (address?: string | null): SpacingScale => {
  if (typeof window === "undefined") {
    return SPACING_SCALES[DEFAULT_SPACING_SCALE];
  }

  const userKey = address ? address.toLowerCase() : "default";
  const saved = localStorage.getItem(`spacingScale_${userKey}`) as keyof typeof SPACING_SCALES;
  return SPACING_SCALES[saved] || SPACING_SCALES[DEFAULT_SPACING_SCALE];
};

export const setSpacingScale = (scaleKey: keyof typeof SPACING_SCALES, address?: string | null) => {
  if (typeof window !== "undefined") {
    const userKey = address ? address.toLowerCase() : "default";
    localStorage.setItem(`spacingScale_${userKey}`, scaleKey);

    // Apply CSS variables immediately
    const scale = SPACING_SCALES[scaleKey];
    const root = document.documentElement.style;

    // Convert Tailwind classes to CSS values
    const paddingMap: Record<string, string> = { "p-3": "0.75rem", "p-4": "1rem", "p-6": "1.5rem" };
    const gapMap: Record<string, string> = {
      "gap-2": "0.5rem",
      "gap-3": "0.75rem",
      "gap-4": "1rem",
      "gap-6": "1.5rem",
    };

    root.setProperty("--card-padding", paddingMap[scale.cardPadding] || "1rem");
    root.setProperty("--card-gap", gapMap[scale.cardGap.replace("space-y-", "gap-")] || "0.75rem");
    root.setProperty("--section-gap", gapMap[scale.sectionGap] || "1rem");
    root.setProperty("--inner-gap", gapMap[scale.innerGap] || "0.75rem");
  }
};

export const getSpacingOptions = () => {
  return Object.entries(SPACING_SCALES).map(([key, scale]) => ({
    value: key,
    label: scale.name,
    description: scale.description,
  }));
};
