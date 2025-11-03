"use client";

import { useCallback, useEffect, useState } from "react";
import { getUniversalLink } from "@selfxyz/core";
import { useAccount } from "wagmi";

export const useSelfProtocol = () => {
  const { address } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [userProof, setUserProof] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  // Load verification from Vercel KV
  useEffect(() => {
    if (address) {
      fetch(`/api/self-callback?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.verified) {
            setIsVerified(true);
            setUserProof(data.proof);
          }
        })
        .catch(err => console.error("Error loading verification:", err));
    }
  }, [address]);

  const verify = useCallback(async () => {
    try {
      setIsLoading(true);

      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      // Generate Self Protocol universal link for identity verification
      const universalLink = getUniversalLink({
        callback: `${window.location.origin}/api/self-callback?sessionId=${newSessionId}`,
      } as any);

      setQrCode(universalLink);

      return { success: true, qrCode: universalLink };
    } catch (error) {
      console.error("Self Protocol verification failed:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll for verification status
  useEffect(() => {
    if (!sessionId || isVerified) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/self-callback?sessionId=${sessionId}`);
        const data = await response.json();

        if (data.verified) {
          setIsVerified(true);
          setUserProof(data.proof);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [sessionId, isVerified]);

  const disconnect = useCallback(() => {
    setIsVerified(false);
    setUserProof(null);
    setQrCode("");
    setSessionId("");
  }, []);

  return {
    isVerified,
    userProof,
    qrCode,
    isLoading,
    verify,
    disconnect,
  };
};
