"use client";

import { useState } from "react";
import { useSelfProtocol } from "~~/hooks/useSelfProtocol";

export const SelfProtocolTest = () => {
  const { isVerified, userProof, verify, disconnect } = useSelfProtocol();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await verify();
      if (result.success) {
        console.log("Self Protocol verified:", result);
      } else {
        console.error("Self Protocol verification failed:", result.error);
      }
    } catch (error) {
      console.error("Verification error:", error);
    }
    setIsVerifying(false);
  };

  return (
    <div className="p-4 border border-gray-600 rounded-lg bg-gray-800">
      <h3 className="text-white text-lg font-bold mb-4">Self Protocol Test</h3>

      {!isVerified ? (
        <div className="space-y-3">
          <p className="text-gray-300 text-sm">Test Self Protocol identity verification</p>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 px-4 text-sm font-bold rounded"
          >
            {isVerifying ? "Verifying..." : "Verify Human Identity"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-600 p-3 rounded">
            <p className="text-white text-sm font-bold">✅ Verified Human!</p>
            <p className="text-white text-xs">Proof: {userProof ? "Available" : "None"}</p>
          </div>
          <button
            onClick={disconnect}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 text-sm font-bold rounded"
          >
            Clear Verification
          </button>
        </div>
      )}
    </div>
  );
};
