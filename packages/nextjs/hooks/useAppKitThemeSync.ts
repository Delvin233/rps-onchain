import { useEffect } from "react";
import { useAppKitTheme } from "@reown/appkit/react";

/**
 * Hook to sync AppKit theme with app's custom theme system
 */
export function useAppKitThemeSync() {
  const { setThemeMode, setThemeVariables } = useAppKitTheme();

  useEffect(() => {
    // Sync theme on mount and when theme changes
    const syncTheme = () => {
      if (typeof window === "undefined") return;

      const rootStyles = getComputedStyle(document.documentElement);
      const primaryColor = rootStyles.getPropertyValue("--color-primary").trim() || "#10b981";

      // Update AppKit theme
      setThemeMode("dark");
      setThemeVariables({
        "--w3m-color-mix": primaryColor,
        "--w3m-accent": primaryColor,
        "--w3m-border-radius-master": "12px",
      });
    };

    // Initial sync
    syncTheme();

    // Listen for theme changes
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Listen for storage changes (when user changes theme)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "colorTheme" || e.key === "fontTheme") {
        setTimeout(syncTheme, 100); // Small delay to let CSS variables update
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [setThemeMode, setThemeVariables]);
}
