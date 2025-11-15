"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { useAccount } from "wagmi";
import { getActiveTheme, getThemeOptions, setFontTheme } from "~~/styles/fontThemes";

export const FontThemeSelector = () => {
  const { address } = useAccount();
  const [currentTheme, setCurrentTheme] = useState("");
  const themeOptions = getThemeOptions();

  useEffect(() => {
    const theme = getActiveTheme();
    const current = themeOptions.find(opt => theme.name === opt.label);
    if (current) {
      setCurrentTheme(current.value);
    }
  }, [themeOptions]);

  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setFontTheme(newTheme as any);

    // Save to database if user is connected
    if (address) {
      const spacingScale = localStorage.getItem("spacingScale") || "comfortable";
      const fontSizeOverride = parseInt(localStorage.getItem("fontSizeOverride") || "100");

      await fetch("/api/user-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          fontTheme: newTheme,
          spacingScale,
          fontSizeOverride,
        }),
      }).catch(console.error);
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette size={20} className="text-primary" />
        <h3 className="font-semibold">Font Theme</h3>
      </div>
      <select value={currentTheme} onChange={handleThemeChange} className="select select-bordered w-full">
        {themeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-base-content/60 mt-2">Changes will apply after page reload</p>
    </div>
  );
};
