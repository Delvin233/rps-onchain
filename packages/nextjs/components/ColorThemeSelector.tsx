"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { getActiveColorTheme, getColorThemeOptions, setColorTheme } from "~~/styles/colorThemes";

export const ColorThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState("");
  const themeOptions = getColorThemeOptions();

  useEffect(() => {
    // Get address from window if available (set by auth system)
    const address = typeof window !== "undefined" ? (window as any).__currentUserAddress : null;
    const theme = getActiveColorTheme(address);
    const current = themeOptions.find(opt => theme.name === opt.label);
    if (current) {
      setCurrentTheme(current.value);
    }
  }, [themeOptions]);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setCurrentTheme(newTheme);
    const address = typeof window !== "undefined" ? (window as any).__currentUserAddress : null;
    setColorTheme(newTheme as any, address);
  };

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette size={20} className="text-primary" />
        <h3 className="font-semibold">Color Theme</h3>
      </div>
      <select value={currentTheme} onChange={handleThemeChange} className="select select-bordered w-full">
        {themeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-base-content/60 opacity-80 mt-2">Click Save Preferences to apply changes</p>
    </div>
  );
};
