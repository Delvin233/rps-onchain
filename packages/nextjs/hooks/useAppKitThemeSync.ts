import { useEffect } from "react";

/**
 * Hook to sync AppKit theme with app's custom theme system
 * This is a no-op hook that doesn't use useAppKitTheme to avoid SSR issues
 * Theme is set in appkitConfig.tsx during createAppKit initialization
 */
export function useAppKitThemeSync() {
  useEffect(() => {
    // Theme sync is now handled in appkitConfig.tsx during initialization
    // This hook is kept for backward compatibility but does nothing
  }, []);
}
