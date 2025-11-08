"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ExternalLink } from "lucide-react";
import { MatchRecord, getLocalMatches } from "~~/lib/pinataStorage";

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    if (isConnected) {
      const localMatches = getLocalMatches();
      const userMatches = localMatches.filter(
        match => match.players?.creator === address || match.players?.joiner === address || match.player === address,
      );
      setMatches(userMatches);
    }
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-6 py-20">
        <div className="text-center">
          <p className="text-base-content/60 mb-6">Connect wallet to view history</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 pb-24">
      <h1 className="text-2xl font-bold text-glow-primary mb-6">Match History</h1>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content/60 mb-4">No matches found</p>
          <a href="/play" className="text-primary hover:text-primary/80 text-sm">
            Play your first game →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => {
            const isAiMatch = match.opponent === 'AI';
            const timestamp = isAiMatch ? match.timestamp : (typeof match.result === 'object' ? match.result.timestamp : Date.now());
            const winner = typeof match.result === 'object' ? match.result.winner : match.result;
            return (
            <div key={index} className="bg-card/50 backdrop-blur border border-border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">{isAiMatch ? 'vs AI' : `Room: ${match.roomId}`}</p>
                  <p className="text-xs text-base-content/60">{new Date(timestamp || Date.now()).toLocaleString()}</p>
                </div>
                {!isAiMatch && match.betAmount && (
                <div className="text-right">
                  <p className="font-bold">{match.betAmount} CELO</p>
                  <p
                    className={`text-sm font-semibold ${
                      winner === address
                        ? "text-success"
                        : winner === "tie"
                          ? "text-warning"
                          : "text-error"
                    }`}
                  >
                    {winner === address
                      ? `+${(parseFloat(match.betAmount) * 2).toFixed(3)}`
                      : winner === "tie"
                        ? `±${match.betAmount}`
                        : `-${match.betAmount}`}
                  </p>
                </div>
                )}
                {isAiMatch && (
                <div className="text-right">
                  <p className="text-sm text-base-content/60">Free Play</p>
                  <p
                    className={`text-sm font-semibold ${
                      match.result === "win"
                        ? "text-success"
                        : match.result === "tie"
                          ? "text-warning"
                          : "text-error"
                    }`}
                  >
                    {match.result === "win" ? "WIN" : match.result === "tie" ? "TIE" : "LOSS"}
                  </p>
                </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="text-base-content/60 text-xs mb-1">Your Move</p>
                  <p className="font-bold uppercase">
                    {isAiMatch ? match.playerMove : (address === match.players?.creator ? match.moves?.creatorMove : match.moves?.joinerMove)}
                  </p>
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="text-base-content/60 text-xs mb-1">Opponent</p>
                  <p className="font-bold uppercase">
                    {isAiMatch ? match.opponentMove : (address === match.players?.creator ? match.moves?.joinerMove : match.moves?.creatorMove)}
                  </p>
                </div>
              </div>

              {match.ipfsHash && (
                <a
                  href={`https://ipfs.io/ipfs/${match.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-ghost w-full"
                >
                  <ExternalLink size={14} />
                  View on IPFS
                </a>
              )}
            </div>
          );})}
        </div>
      )}
    </div>
  );
}
