"use client";

import { useEffect, useState } from "react";
import { Ruler } from "lucide-react";
import { getSpacingOptions, getSpacingScale, setSpacingScale } from "~~/styles/spacingThemes";

export const SpacingScaleSelector = () => {
  const [currentScale, setCurrentScale] = useState("");
  const scaleOptions = getSpacingOptions();

  useEffect(() => {
    const scale = getSpacingScale();
    const current = scaleOptions.find(opt => scale.name === opt.label);
    if (current) {
      setCurrentScale(current.value);
    }
  }, [scaleOptions]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScale = e.target.value;
    setCurrentScale(newScale);
    setSpacingScale(newScale as any);
  };

  return (
    <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4">
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
