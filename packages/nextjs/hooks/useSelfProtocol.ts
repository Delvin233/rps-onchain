"use client";

import { useCallback, useEffect, useState } from "react";
import { SelfAppBuilder } from "@selfxyz/qrcode";
import { useAccount } from "wagmi";

export const useSelfProtocol = () => {
  const { address } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [userProof, setUserProof] = useState<any>(null);
  const [selfApp, setSelfApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address) {
      fetch(`/api/check-verification?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.verified) {
            setIsVerified(true);
            setUserProof(data.proof);
          }
        })
        .catch(err => console.error("Error checking verification:", err));
    }
  }, [address]);

  const verify = useCallback(async () => {
    if (!address) return { success: false, error: "No wallet address" };

    setIsLoading(true);

    try {
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

      const pollInterval = setInterval(async () => {
        const res = await fetch(`/api/check-verification?address=${address}`);
        const data = await res.json();

        if (data.verified) {
          setIsVerified(true);
          setUserProof(data.proof);
          setIsLoading(false);
          clearInterval(pollInterval);
          window.location.reload();
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setIsLoading(false);
      }, 120000);

      return { success: true };
    } catch (error) {
      console.error("Verification error:", error);
      setIsLoading(false);
      return { success: false, error };
    }
  }, [address]);

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
