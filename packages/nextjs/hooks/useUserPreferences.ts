import { useEffect } from "react";
import { useAccount } from "wagmi";

export const useUserPreferences = () => {
  const { address } = useAccount();

  // Load preferences from database when user connects
  useEffect(() => {
    if (!address) return;

    const loadPreferences = async () => {
      try {
        const res = await fetch(`/api/user-preferences?address=${address}`);
        const data = await res.json();

        if (data.preferences) {
          const { colorTheme, fontTheme, spacingScale, fontSizeOverride } = data.preferences;

          // Only apply if different from current localStorage
          const currentColor = localStorage.getItem("colorTheme");
          const currentFont = localStorage.getItem("fontTheme");
          const currentSpacing = localStorage.getItem("spacingScale");
          const currentSize = localStorage.getItem("fontSizeOverride");

          let needsReload = false;

          if (colorTheme && colorTheme !== currentColor) {
            localStorage.setItem("colorTheme", colorTheme);
            needsReload = true;
          }

          if (fontTheme && fontTheme !== currentFont) {
            localStorage.setItem("fontTheme", fontTheme);
            needsReload = true;
          }

          if (spacingScale && spacingScale !== currentSpacing) {
            localStorage.setItem("spacingScale", spacingScale);
            needsReload = true;
          }

          if (fontSizeOverride && fontSizeOverride.toString() !== currentSize) {
            localStorage.setItem("fontSizeOverride", fontSizeOverride.toString());
            needsReload = true;
          }

          if (needsReload) {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      }
    };

    loadPreferences();
  }, [address]);

  // Save preferences to database when they change
  const savePreferences = async () => {
    if (!address) return;

    const colorTheme = localStorage.getItem("colorTheme") || "delvin233";
    const fontTheme = localStorage.getItem("fontTheme") || "futuristic";
    const spacingScale = localStorage.getItem("spacingScale") || "comfortable";
    const fontSizeOverride = parseInt(localStorage.getItem("fontSizeOverride") || "100");

    try {
      await fetch("/api/user-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          colorTheme,
          fontTheme,
          spacingScale,
          fontSizeOverride,
        }),
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  return { savePreferences };
};
