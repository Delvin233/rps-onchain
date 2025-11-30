"use client";

import { useEffect, useState } from "react";
import { RxFontSize } from "react-icons/rx";
import { useAuth } from "~~/contexts/AuthContext";

export const FontSizeSlider = () => {
  const { address } = useAuth();
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    if (address) {
      const userKey = address.toLowerCase();
      const saved = localStorage.getItem(`fontSizeOverride_${userKey}`);
      if (saved) {
        setFontSize(parseInt(saved));
      }
    }
  }, [address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!address) return;
    const value = parseInt(e.target.value);
    setFontSize(value);
    const userKey = address.toLowerCase();
    localStorage.setItem(`fontSizeOverride_${userKey}`, value.toString());

    // Apply immediately
    document.documentElement.style.setProperty("--font-size-override", (value / 100).toString());
  };

  const resetToDefault = () => {
    if (!address) return;
    setFontSize(100);
    const userKey = address.toLowerCase();
    localStorage.removeItem(`fontSizeOverride_${userKey}`);
    document.documentElement.style.setProperty("--font-size-override", "1");
  };

  return (
    <div className="bg-card/50 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RxFontSize className="text-primary" size={20} />
          <h3 className="font-semibold">Font Size</h3>
        </div>
        <button onClick={resetToDefault} className="btn btn-xs btn-ghost">
          Reset
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs">A</span>
        <input
          type="range"
          min="80"
          max="200"
          step="10"
          value={fontSize}
          onChange={handleChange}
          className="range range-primary flex-1"
        />
        <span className="text-lg">A</span>
      </div>

      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-base-content/60">Adjust text size independently</p>
        <span className="text-sm font-semibold">{fontSize}%</span>
      </div>
    </div>
  );
};
