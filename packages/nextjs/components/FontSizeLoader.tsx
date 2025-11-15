"use client";

import { useEffect } from "react";

export const FontSizeLoader = () => {
  useEffect(() => {
    const saved = localStorage.getItem("fontSizeOverride");
    const override = saved ? parseInt(saved) / 100 : 1;

    document.documentElement.style.setProperty("--font-size-override", override.toString());
  }, []);

  return null;
};
