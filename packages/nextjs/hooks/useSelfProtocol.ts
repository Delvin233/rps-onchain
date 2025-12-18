"use client";

import { useCallback, useEffect, useState } from "react";
import { useRPSContract } from "./useRPSContract";
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
  const { isVerified: contractVerified, verificationData, checkVerificationStatus } = useRPSContract();
  const [selfApp, setSelfApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
      // Preload Self Protocol library for faster verification
      preloadSelfProtocol();
    }
  }, []);

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
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Verification error:", error);
      setIsLoading(false);
      return { success: false, error };
    }
  }, [address, mounted]);

  const disconnect = useCallback(() => {
    setSelfApp(null);
  }, []);

  return {
    isVerified: contractVerified,
    userProof: verificationData,
    selfApp,
    isLoading,
    verify,
    disconnect,
    checkVerificationStatus,
  };
};
