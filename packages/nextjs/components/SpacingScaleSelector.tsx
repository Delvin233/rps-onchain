"use client";

import { useEffect, useState } from "react";
import { Ruler } from "lucide-react";
import { getSpacingOptions, getSpacingScale, setSpacingScale } from "~~/styles/spacingThemes";

export const SpacingScaleSelector = () => {
  const [currentScale, setCurrentScale] = useState("");
  const scaleOptions = getSpacingOptions();

  useEffect(() => {
    const address = typeof window !== "undefined" ? (window as any).__currentUserAddress : null;
    const scale = getSpacingScale(address);
    const current = scaleOptions.find(opt => scale.name === opt.label);
    if (current) {
      setCurrentScale(current.value);
    }
  }, [scaleOptions]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScale = e.target.value;
    setCurrentScale(newScale);
    const address = typeof window !== "undefined" ? (window as any).__currentUserAddress : null;
    setSpacingScale(newScale as any, address);
  };

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ruler size={20} className="text-primary" />
        <h3 className="font-semibold">Spacing Scale</h3>
      </div>
      <select value={currentScale} onChange={handleScaleChange} className="select select-bordered w-full">
        {scaleOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label} - {option.description}
          </option>
        ))}
      </select>
      <p className="text-xs text-base-content/60 mt-2">Click Save Preferences to apply changes</p>
    </div>
  );
};
