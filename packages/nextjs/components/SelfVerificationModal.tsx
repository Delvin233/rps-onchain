"use client";

import { useEffect, useState } from "react";
import { SelfQRcodeWrapper, getUniversalLink } from "@selfxyz/qrcode";
import { useSelfProtocol } from "~~/hooks/useSelfProtocol";

interface SelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfVerificationModal = ({ isOpen, onClose }: SelfVerificationModalProps) => {
  const { selfApp, verify, disconnect, isVerified } = useSelfProtocol();
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-base-100/95 backdrop-blur-xl border border-primary/30 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-glow-primary">Prove You&apos;re Human</h3>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-circle">
            ✕
          </button>
        </div>

        {isVerified ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-success text-5xl animate-bounce">✓</div>
            <p className="text-lg font-bold">Verification Successful!</p>
            <p className="text-base-content/70 text-sm">Other players will see you&apos;re verified!</p>
          </div>
        ) : !hasStarted ? (
          <div className="space-y-4">
            <p className="text-base-content/80 text-sm">
              Prove you&apos;re a real human to other players using your government-issued ID. Verified players show a
              shield icon (🛡️) in game rooms.
            </p>
            <button onClick={handleStart} className="btn btn-primary w-full">
              Start Verification
            </button>
          </div>
        ) : !selfApp ? (
          <div className="flex items-center justify-center p-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="block md:hidden">
              <a
                href={getUniversalLink(selfApp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full text-lg"
              >
                Open Self App
              </a>
              <p className="text-base-content/70 text-xs text-center mt-3">
                Tap to verify your identity in the Self app
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="loading loading-dots loading-sm text-warning"></span>
                <p className="text-warning text-xs">Waiting for verification...</p>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={() => {}}
                  onError={error => console.error("QR Error:", error)}
                  size={200}
                />
              </div>
              <div className="text-center mt-4">
                <p className="font-bold">Scan with Self App</p>
                <p className="text-base-content/70 text-xs mt-1">
                  Download the Self app on your phone and scan this QR code
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="loading loading-dots loading-sm text-warning"></span>
                  <p className="text-warning text-xs">Waiting for verification...</p>
                </div>
              </div>
            </div>

            <button onClick={handleClose} className="btn btn-ghost w-full">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
