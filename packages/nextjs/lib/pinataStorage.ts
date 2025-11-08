// IPFS storage for match records via Pinata
export interface MatchRecord {
  roomId?: string;
  players?: {
    creator: string;
    joiner: string;
  };
  moves?: {
    creatorMove: string;
    joinerMove: string;
  };
  result?: {
    winner: string;
    timestamp: number;
  } | string;
  betAmount?: string;
  txHash?: string;
  ipfsHash?: string;
  provider?: string;
  // AI match fields
  player?: string;
  opponent?: string;
  playerMove?: string;
  opponentMove?: string;
  timestamp?: number;
}

// Store match record to IPFS via Pinata
export async function storeMatchRecord(matchData: MatchRecord): Promise<{ ipfsHash: string; provider: string } | null> {
  try {
    const response = await fetch("/api/store-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matchData),
    });

    const result = await response.json();
    if (result.ipfsHash) {
      return {
        ipfsHash: result.ipfsHash,
        provider: result.provider || "unknown",
      };
    }
    return null;
  } catch (error) {
    console.error("Error storing match to IPFS:", error);
    return null;
  }
}

// Retrieve match record from IPFS
export async function getMatchRecord(ipfsHash: string): Promise<MatchRecord | null> {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return await response.json();
  } catch (error) {
    console.error("Error retrieving match from IPFS:", error);
    return null;
  }
}

// Store match history locally as backup
export function storeMatchLocally(matchData: MatchRecord) {
  const matches = getLocalMatches();
  matches.unshift(matchData);
  localStorage.setItem("rps-matches", JSON.stringify(matches.slice(0, 50))); // Keep last 50
}

export function getLocalMatches(): MatchRecord[] {
  try {
    return JSON.parse(localStorage.getItem("rps-matches") || "[]");
  } catch {
    return [];
  }
}
