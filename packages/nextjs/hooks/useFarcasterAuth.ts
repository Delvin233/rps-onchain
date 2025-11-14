import { useCallback, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { useFarcaster } from "~~/contexts/FarcasterContext";

export const useFarcasterAuth = () => {
  const { context } = useFarcaster();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!context) {
        throw new Error("Not in Farcaster mini app");
      }

      const { token } = await sdk.quickAuth.getToken();
      if (!token) {
        throw new Error("Sign in failed");
      }

      const res = await fetch("/api/farcaster/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fid: context.user.fid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Sign in failed");
      }

      const data = await res.json();
      setIsSignedIn(true);
      setUser(data.user);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  return { signIn: handleSignIn, isSignedIn, isLoading, error, user };
};
