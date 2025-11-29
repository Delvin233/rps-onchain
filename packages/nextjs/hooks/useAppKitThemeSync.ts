"use client";

import { useEffect, useState } from "react";

/**
 * Hook to sync AppKit theme with app's custom theme system
 * Updates AppKit CSS variables when app theme changes
 */
export function useAppKitThemeSync() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Sync theme function - updates AppKit CSS variables
    const syncTheme = () => {
      try {
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue("--color-primary").trim() || "#10b981";

        // Update AppKit CSS variables directly
        document.documentElement.style.setProperty("--w3m-color-mix", primaryColor);
        document.documentElement.style.setProperty("--w3m-accent", primaryColor);
      } catch {
        // Ignore errors
      }
    };

    // Initial sync after a short delay to ensure AppKit is loaded
    setTimeout(syncTheme, 1000);

    // Listen for theme changes
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "data-theme"],
    });

    // Listen for storage changes (when user changes theme)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "colorTheme" || e.key === "fontTheme") {
        setTimeout(syncTheme, 100);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [mounted]);
}
