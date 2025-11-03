"use client";

import { useEffect, useState } from "react";

// import { QRCodeSVG } from "@selfxyz/qrcode"; // Placeholder - actual import depends on Self Protocol SDK

interface SelfQRCodeProps {
  onConnect: (result: any) => void;
  appId?: string;
  appName?: string;
}

export const SelfQRCode = ({ appId = "rps-onchain", appName = "RPS OnChain" }: SelfQRCodeProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Generate QR code data for Self Protocol
        console.log(`QR code for ${appId} - ${appName}`);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        setIsLoading(false);
      }
    };

    generateQR();
  }, [appId, appName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white text-sm">Generating QR Code...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg">
        <div className="w-[200px] h-[200px] bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">QR Code Placeholder</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white text-sm font-bold">Scan with Self App</p>
        <p className="text-gray-300 text-xs">Or use Self Protocol wallet</p>
      </div>
    </div>
  );
};
