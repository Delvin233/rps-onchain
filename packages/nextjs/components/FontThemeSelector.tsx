"use client";

import { useEffect, useState } from "react";
import { ImFont } from "react-icons/im";
import { getActiveTheme, getThemeOptions, setFontTheme } from "~~/styles/fontThemes";

export const FontThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState("");
  const themeOptions = getThemeOptions();

  useEffect(() => {
    const address = typeof window !== "undefined" ? (window as any).__currentUserAddress : null;
    const theme = getActiveTheme(address);
    const current = themeOptions.find(opt => theme.name === opt.label);
    if (current) {
      setCurrentTheme(current.value);
    }
  }, [themeOptions]);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setCurrentTheme(newTheme);
    const address = typeof window !== "undefined" ? (window as any).__currentUserAddress : null;
    setFontTheme(newTheme as any, address);
  };

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ImFont className="text-primary" size={20} />
        <h3 className="font-semibold">Font Theme</h3>
      </div>
      <select value={currentTheme} onChange={handleThemeChange} className="select select-bordered w-full">
        {themeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-base-content/60 mt-2">Click Save Preferences to apply changes</p>
    </div>
  );
};
