"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { MatchRecord, getLocalMatches } from "~~/lib/pinataStorage";

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    if (isConnected) {
      const localMatches = getLocalMatches();
      // Filter matches where user participated
      const userMatches = localMatches.filter(
        match => match.players.creator === address || match.players.joiner === address,
      );
      setMatches(userMatches);
    }
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="card-gaming rounded-2xl p-8 max-w-2xl w-full text-center animate-fade-in-up">
          <h1 className="text-3xl mb-4 font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
            RPS-ONCHAIN
          </h1>
          <p className="text-gray-300 text-sm mb-6">CONNECT WALLET TO VIEW HISTORY</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple bg-clip-text text-transparent">
            Match History
          </h1>
        </div>

        <div className="card-gaming rounded-2xl p-6 animate-slide-in-up">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent mb-6">
            Your Match History
          </h2>

          {matches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-300 mb-4">No matches found</p>
              <Link
                href="/play"
                className="text-neon-blue hover:text-neon-purple text-sm transition-colors duration-300 inline-block"
              >
                Play your first game →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div key={index} className="card-gaming rounded-xl p-5 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-bold flex items-center">
                        <span className="text-neon-blue mr-2">🎯</span> Room: {match.roomId}
                      </p>
                      <p className="text-gray-300 text-sm">{new Date(match.result.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{match.betAmount} CELO</p>
                      <p
                        className={`text-sm font-bold ${
                          match.result.winner === address
                            ? "text-neon-green"
                            : match.result.winner === "tie"
                              ? "text-neon-orange"
                              : "text-red-400"
                        }`}
                      >
                        {match.result.winner === address
                          ? `✓ +${(parseFloat(match.betAmount) * 2).toFixed(3)} CELO`
                          : match.result.winner === "tie"
                            ? `⚡ ±${match.betAmount} CELO`
                            : `✗ -${match.betAmount} CELO`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="card-gaming p-3 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">Your Move:</p>
                      <p className="text-white font-bold uppercase text-lg">
                        {address === match.players.creator ? match.moves.creatorMove : match.moves.joinerMove}
                      </p>
                    </div>
                    <div className="card-gaming p-3 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">Opponent Move:</p>
                      <p className="text-white font-bold uppercase text-lg">
                        {address === match.players.creator ? match.moves.joinerMove : match.moves.creatorMove}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <p className="text-gray-400 text-xs flex items-center">
                      <span className="text-neon-purple mr-1">📦</span> Stored on IPFS via Pinata
                    </p>
                    {match.ipfsHash && (
                      <a
                        href={`https://ipfs.io/ipfs/${match.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gaming-primary px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 hover:scale-105"
                      >
                        VIEW ON IPFS
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4 animate-fade-in-up">
          <button
            onClick={() => window.history.back()}
            className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-xl border border-gray-600 font-bold transition-all duration-300 hover:scale-105"
          >
            ← Back
          </button>
          <Link href="/play">
            <button className="btn-gaming-primary py-3 px-8 rounded-xl font-bold transition-all duration-300 hover:scale-105">
              Play New Game
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
