"use client";

import { useState } from "react";

export const useIPFSSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncToIPFS = async (address: string) => {
    if (!address || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync-ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("IPFS sync failed:", error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncToIPFS, isSyncing };
};