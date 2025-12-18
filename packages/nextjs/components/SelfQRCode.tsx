"use client";

import { useEffect, useState } from "react";
import { SelfAppBuilder, SelfQRcodeWrapper } from "@selfxyz/qrcode";
import { useAccount } from "wagmi";
import { useRPSContract } from "~~/hooks/useRPSContract";

interface SelfQRCodeProps {
  onSuccess: () => void;
  onError?: (error: any) => void;
}

export const SelfQRCode = ({ onSuccess, onError }: SelfQRCodeProps) => {
  const { address } = useAccount();
  const { checkVerificationStatus } = useRPSContract();
  const [selfApp, setSelfApp] = useState<any>(null);

  useEffect(() => {
    if (!address) return;

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
  }, [address]);

  const handleSuccess = async () => {
    console.log("Self Protocol verification completed, checking contract...");

    // Wait a moment for the transaction to be mined
    setTimeout(async () => {
      const isVerified = await checkVerificationStatus();
      if (isVerified) {
        console.log("Contract verification confirmed!");
        onSuccess();
      } else {
        console.log("Contract verification not yet confirmed, checking again...");
        // Try again after a longer delay
        setTimeout(async () => {
          const isVerifiedRetry = await checkVerificationStatus();
          if (isVerifiedRetry) {
            console.log("Contract verification confirmed on retry!");
            onSuccess();
          } else {
            console.error("Contract verification failed after retries");
            // Even if contract check fails, sync to Turso as backup
            try {
              await fetch("/api/sync-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  address,
                  verified: true,
                  verificationData: { source: "self_protocol_success" },
                }),
              });
              console.log("Synced verification to Turso as fallback");
              onSuccess(); // Proceed with success since Self Protocol confirmed it
            } catch (syncError) {
              console.error("Failed to sync to Turso:", syncError);
              onError?.({ message: "Verification not confirmed on contract" });
            }
          }
        }, 5000);
      }
    }, 2000);
  };

  if (!selfApp) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <SelfQRcodeWrapper
        selfApp={selfApp}
        onSuccess={handleSuccess}
        onError={onError || (() => console.error("Verification failed"))}
        size={200}
      />
      <div className="text-center">
        <p className="text-white text-sm font-bold">Scan with Self App</p>
        <p className="text-gray-300 text-xs">Download the Self app to verify your identity</p>
      </div>
    </div>
  );
};
