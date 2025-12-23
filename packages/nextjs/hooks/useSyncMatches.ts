"use client";

import { useEffect } from "react";
import { useSafeAccount } from "~~/hooks/useSafeAccount";
import { getMatchRecord } from "~~/lib/pinataStorage";

export const useSyncMatches = () => {
  const { address } = useSafeAccount();

  useEffect(() => {
    if (!address) return;

    const syncMatches = async () => {
      try {
        // Fetch user's IPFS hash from Edge Config
        const response = await fetch(`/api/user-matches?address=${address}`);
        const { ipfsHash } = await response.json();

        if (!ipfsHash) return;

        // Fetch all matches from IPFS
        const userData = await getMatchRecord(ipfsHash);
        if (userData && userData.matches) {
          localStorage.setItem("rps_matches", JSON.stringify(userData.matches));
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error syncing matches:", error);
        }
      }
    };

    syncMatches();
  }, [address]);
};
