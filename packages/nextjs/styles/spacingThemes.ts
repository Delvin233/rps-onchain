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

export const getSpacingScale = (): SpacingScale => {
  if (typeof window === "undefined") {
    return SPACING_SCALES[DEFAULT_SPACING_SCALE];
  }

  const saved = localStorage.getItem("spacingScale") as keyof typeof SPACING_SCALES;
  return SPACING_SCALES[saved] || SPACING_SCALES[DEFAULT_SPACING_SCALE];
};

export const setSpacingScale = (scaleKey: keyof typeof SPACING_SCALES) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("spacingScale", scaleKey);
    window.location.reload();
  }
};

export const getSpacingOptions = () => {
  return Object.entries(SPACING_SCALES).map(([key, scale]) => ({
    value: key,
    label: scale.name,
    description: scale.description,
  }));
};
