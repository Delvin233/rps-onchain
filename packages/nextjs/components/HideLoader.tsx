"use client";

import { useEffect } from "react";

export function HideLoader() {
  useEffect(() => {
    // Hide loading skeleton once React has hydrated
    const loader = document.getElementById("app-loading");
    if (loader) {
      loader.classList.add("loaded");
      // Remove from DOM after transition
      setTimeout(() => {
        loader.remove();
      }, 300);
    }
  }, []);

  return null;
}
