"use client";

import { useEffect, useState } from "react";
import { RiTvLine } from "react-icons/ri";

export const CRTToggle = () => {
  const [crtEnabled, setCrtEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("crtEffect");
    setCrtEnabled(saved === "true");
  }, []);

  const toggleCRT = () => {
    const newValue = !crtEnabled;
    setCrtEnabled(newValue);
    localStorage.setItem("crtEffect", String(newValue));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <RiTvLine className="text-primary" size={24} />
          <label className="font-semibold">CRT Monitor Effect</label>
        </div>
        <input type="checkbox" checked={crtEnabled} onChange={toggleCRT} className="toggle toggle-primary" />
      </div>
      <p className="text-xs text-base-content/60">Retro CRT screen with scanlines, curvature & phosphor glow</p>
    </div>
  );
};
