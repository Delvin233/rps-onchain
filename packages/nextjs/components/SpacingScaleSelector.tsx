"use client";

import { useEffect, useState } from "react";
import { Ruler } from "lucide-react";
import { useAuth } from "~~/contexts/AuthContext";
import { getSpacingOptions, getSpacingScale, setSpacingScale } from "~~/styles/spacingThemes";

export const SpacingScaleSelector = () => {
  const { address } = useAuth();
  const [currentScale, setCurrentScale] = useState("");
  const scaleOptions = getSpacingOptions();

  useEffect(() => {
    if (address) {
      const scale = getSpacingScale(address);
      const current = scaleOptions.find(opt => scale.name === opt.label);
      if (current) {
        setCurrentScale(current.value);
      }
    }
  }, [scaleOptions, address]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!address) return;
    const newScale = e.target.value;
    setCurrentScale(newScale);
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
