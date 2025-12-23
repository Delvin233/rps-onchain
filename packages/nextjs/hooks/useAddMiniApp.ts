import { useCallback, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

// Use the actual return type from the Farcaster SDK
type AddMiniAppResult = Awaited<ReturnType<typeof sdk.actions.addMiniApp>>;

interface UseAddMiniAppReturn {
  addMiniApp: () => Promise<AddMiniAppResult | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to add the Mini App to user's Farcaster client
 * This enables notifications and better integration
 */
export function useAddMiniApp(): UseAddMiniAppReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMiniApp = useCallback(async (): Promise<AddMiniAppResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[useAddMiniApp] Attempting to add mini app...");
      }

      const result = await sdk.actions.addMiniApp();

      if (process.env.NODE_ENV === "development") {
        console.log("[useAddMiniApp] Success:", result);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add Mini App";

      if (process.env.NODE_ENV === "development") {
        console.error("[useAddMiniApp] Error:", err);
      }

      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addMiniApp,
    isLoading,
    error,
  };
}
