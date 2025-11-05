"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSelfProtocol } from "~~/hooks/useSelfProtocol";

interface SelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfVerificationModal = ({ isOpen, onClose }: SelfVerificationModalProps) => {
  const { qrCode, isLoading, verify, disconnect, isVerified } = useSelfProtocol();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = async () => {
    setHasStarted(true);
    await verify();
  };

  const handleClose = () => {
    disconnect();
    setHasStarted(false);
    onClose();
  };

  // Auto-close modal when verification is successful
  useEffect(() => {
    if (isVerified) {
      setTimeout(() => {
        disconnect();
        setHasStarted(false);
        onClose();
      }, 2000);
    }
  }, [isVerified, disconnect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-bold">Verify Human Identity</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {isVerified ? (
          <div className="text-center space-y-4">
            <div className="text-green-400 text-4xl">✓</div>
            <p className="text-white text-sm font-bold">Verification Successful!</p>
            <p className="text-gray-300 text-xs">You can now bet up to 1000 CELO (was 20 CELO)</p>
          </div>
        ) : !hasStarted ? (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Verify you&apos;re a real human using your government-issued ID (passport, etc.) to unlock higher betting
              limits.
            </p>
            <button
              onClick={handleStart}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 text-sm font-bold rounded"
            >
              Start Verification
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-white text-sm">Generating QR Code...</div>
          </div>
        ) : qrCode ? (
          <div className="space-y-4">
            {/* Mobile: Direct link button */}
            <div className="block md:hidden">
              <a
                href={qrCode}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-4 text-center font-bold rounded-lg shadow-neon-purple"
              >
                🔐 Open Self App
              </a>
              <p className="text-gray-300 text-xs text-center mt-3">Tap to verify your identity in the Self app</p>
              <p className="text-yellow-400 text-xs text-center mt-2">Waiting for verification...</p>
            </div>

            {/* Desktop: QR Code */}
            <div className="hidden md:block">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-bold">Scan with Self App</p>
                <p className="text-gray-300 text-xs">Download the Self app on your phone and scan this QR code</p>
                <p className="text-yellow-400 text-xs mt-2">Waiting for verification...</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-red-400 text-sm">Failed to generate QR code</p>
            <button
              onClick={handleClose}
              className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
