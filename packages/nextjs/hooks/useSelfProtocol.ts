"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

// Preload Self Protocol library
let SelfAppBuilderPromise: Promise<any> | null = null;
const preloadSelfProtocol = () => {
  if (!SelfAppBuilderPromise && typeof window !== "undefined") {
    SelfAppBuilderPromise = import("@selfxyz/qrcode").then(module => module.SelfAppBuilder);
  }
  return SelfAppBuilderPromise;
};

export const useSelfProtocol = () => {
  const { address } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [userProof, setUserProof] = useState<any>(null);
  const [selfApp, setSelfApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [pollTimeout, setPollTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
      // Preload Self Protocol library for faster verification
      preloadSelfProtocol();
    }
  }, []);

  useEffect(() => {
    // Reset state when address changes
    setIsVerified(false);
    setUserProof(null);

    if (address && mounted && typeof window !== "undefined") {
      fetch(`/api/check-verification?address=${address}`, {
        cache: "no-store", // Don't use browser cache
        headers: {
          "Cache-Control": "no-cache",
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.verified) {
            setIsVerified(true);
            setUserProof(data.proof);
          }
        })
        .catch(err => console.error("Error checking verification:", err));
    }
  }, [address, mounted]);

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [pollInterval, pollTimeout]);

  const verify = useCallback(async () => {
    if (!address || !mounted || typeof window === "undefined") return { success: false, error: "Not ready" };

    setIsLoading(true);

    try {
      const SelfAppBuilder = await preloadSelfProtocol();
      const app = new SelfAppBuilder({
        version: 2,
        appName: "RPS OnChain",
        scope: "rps-onchain",
        endpoint: `${window.location.origin}/api/verify`,
        logoBase64: `${window.location.origin}/logo.svg`,
        userId: address,
        endpointType: "https",
        userIdType: "hex",
        disclosures: {
          minimumAge: 18,
          excludedCountries: [],
        },
      }).build();

      setSelfApp(app);

      const interval = setInterval(async () => {
        const res = await fetch(`/api/check-verification?address=${address}`);
        const data = await res.json();

        if (data.verified) {
          setIsVerified(true);
          setUserProof(data.proof);
          setIsLoading(false);
          clearInterval(interval);
          if (pollTimeout) clearTimeout(pollTimeout);
          window.location.reload();
        }
      }, 3000);
      setPollInterval(interval);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsLoading(false);
      }, 120000);
      setPollTimeout(timeout);

      return { success: true };
    } catch (error) {
      console.error("Verification error:", error);
      setIsLoading(false);
      return { success: false, error };
    }
  }, [address, mounted, pollTimeout]);

  const disconnect = useCallback(() => {
    setIsVerified(false);
    setUserProof(null);
    setSelfApp(null);
  }, []);

  return {
    isVerified,
    userProof,
    selfApp,
    isLoading,
    verify,
    disconnect,
  };
};
