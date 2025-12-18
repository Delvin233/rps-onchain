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

    // For onchain verification, we'll check the contract state
    // This will be implemented when we add contract interaction hooks
    if (address && mounted && typeof window !== "undefined") {
      // TODO: Check contract state for verification status
      // For now, we'll rely on the verification flow to update state
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
        scope: "self-workshop",
        endpoint: "0x3e5e80bc7de408f9d63963501179a50b251cbda3",
        logoBase64: `${window.location.origin}/logo.svg`,
        userId: address,
        endpointType: "celo",
        userIdType: "hex",
        disclosures: {
          minimumAge: 18,
          excludedCountries: [],
          ofac: false,
        },
      }).build();

      setSelfApp(app);

      // For onchain verification, the contract will handle the verification
      // We can listen for events or check contract state
      const interval = setInterval(async () => {
        // TODO: Check contract state for verification
        // For now, we'll assume verification happens through the QR code flow
        console.log("Checking verification status...");
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
  }, [address, mounted]);

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
