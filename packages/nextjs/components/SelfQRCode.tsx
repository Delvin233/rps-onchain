"use client";

import { useEffect, useState } from "react";
import { SelfAppBuilder, SelfQRcodeWrapper } from "@selfxyz/qrcode";
import { useAccount } from "wagmi";

interface SelfQRCodeProps {
  onSuccess: () => void;
  onError?: (error: any) => void;
}

export const SelfQRCode = ({ onSuccess, onError }: SelfQRCodeProps) => {
  const { address } = useAccount();
  const [selfApp, setSelfApp] = useState<any>(null);

  useEffect(() => {
    if (!address) return;

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
  }, [address]);

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
        onSuccess={onSuccess}
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
