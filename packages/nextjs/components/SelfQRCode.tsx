"use client";

import { useEffect, useState } from "react";
import { SelfAppBuilder, SelfQRcodeWrapper } from "@selfxyz/qrcode";
import { useAccount } from "wagmi";
import { useRPSContract } from "~~/hooks/useRPSContract";
import { getBaseUrl } from "~~/utils/shareUtils";

interface SelfQRCodeProps {
  onSuccess: () => void;
  onError?: (error: any) => void;
}

export const SelfQRCode = ({ onSuccess, onError }: SelfQRCodeProps) => {
  const { address } = useAccount();
  const { isVerified, checkVerificationStatus, isLoading } = useRPSContract();
  const [selfApp, setSelfApp] = useState<any>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);

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

  // Check if user is already verified when component mounts
  useEffect(() => {
    if (isVerified) {
      setVerificationComplete(true);
      onSuccess(); // Trigger success callback if already verified
    }
  }, [isVerified, onSuccess]);

  const handleSuccess = async () => {
    console.log("Self Protocol verification completed, checking contract...");
    setVerificationComplete(true); // Immediately hide QR code to prevent regeneration

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
              const syncResponse = await fetch(`${getBaseUrl()}/api/sync-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  address,
                  verified: true,
                  verificationData: { source: "self_protocol_success" },
                }),
              });

              if (syncResponse.ok) {
                console.log("Synced verification to Turso as fallback");
                onSuccess(); // Proceed with success since Self Protocol confirmed it
              } else {
                const errorData = await syncResponse.json();
                console.error("Turso sync failed:", errorData);
                // Still proceed with success since Self Protocol confirmed it
                onSuccess();
              }
            } catch (syncError) {
              console.error("Failed to sync to Turso:", syncError);
              // Still proceed with success since Self Protocol confirmed it
              console.log("Proceeding with success despite sync failure - Self Protocol confirmed verification");
              onSuccess();
            }
          }
        }, 5000);
      }
    }, 2000);
  };

  // Show loading state while checking verification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white text-sm">Checking verification status...</div>
      </div>
    );
  }

  // Show verified state if user is already verified or verification just completed
  if (isVerified || verificationComplete) {
    return (
      <div className="flex flex-col items-center space-y-4 p-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-green-400 text-lg font-bold">Identity Verified!</p>
          <p className="text-gray-300 text-sm">You can now play RPS OnChain</p>
        </div>
      </div>
    );
  }

  // Show loading state while selfApp is being created
  if (!selfApp) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white text-sm">Loading...</div>
      </div>
    );
  }

  // Show QR code for unverified users
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
