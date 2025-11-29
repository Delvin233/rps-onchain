"use client";

import { useEffect, useState } from "react";

/**
 * Hook to sync AppKit theme with app's custom theme system
 * Uses dynamic import to avoid SSR issues with useAppKitTheme
 */
export function useAppKitThemeSync() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    // Dynamically import AppKit theme hook only on client
    let cleanup: (() => void) | undefined;

    const setupThemeSync = async () => {
      try {
        // Wait a bit for AppKit to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Import for type checking only - not used at runtime
        await import("@reown/appkit/react");

        // Sync theme function
        const syncTheme = () => {
          try {
            const rootStyles = getComputedStyle(document.documentElement);
            const primaryColor = rootStyles.getPropertyValue("--color-primary").trim() || "#10b981";

            // Get theme instance
            const themeInstance = (window as any).__appkit_theme__;
            if (themeInstance?.setThemeMode && themeInstance?.setThemeVariables) {
              themeInstance.setThemeMode("dark");
              themeInstance.setThemeVariables({
                "--w3m-color-mix": primaryColor,
                "--w3m-accent": primaryColor,
                "--w3m-border-radius-master": "12px",
              });
            }
          } catch {
            // AppKit not ready yet, ignore
          }
        };

        // Initial sync
        syncTheme();

        // Listen for theme changes
        const observer = new MutationObserver(syncTheme);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["style", "data-theme"],
        });

        // Listen for storage changes
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === "colorTheme" || e.key === "fontTheme") {
            setTimeout(syncTheme, 100);
          }
        };

        window.addEventListener("storage", handleStorageChange);

        cleanup = () => {
          observer.disconnect();
          window.removeEventListener("storage", handleStorageChange);
        };
      } catch {
        // Failed to setup theme sync, silently ignore
      }
    };

    setupThemeSync();

    return () => {
      if (cleanup) cleanup();
    };
  }, [mounted]);
}
