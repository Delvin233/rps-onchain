"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { MatchRecord, getLocalMatches } from "~~/lib/filecoinStorage";

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
          <h1 className="text-2xl mb-4 text-white">RPS-ONCHAIN</h1>
          <p className="text-gray-300 text-sm mb-6">CONNECT WALLET TO VIEW HISTORY</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl text-white font-bold">Match History</h1>
        </div>

        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl text-white mb-6">Your Match History</h2>

          {matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">No matches found</p>
              <Link href="/play" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                Play your first game →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-bold">Room: {match.roomId}</p>
                      <p className="text-gray-300 text-sm">{new Date(match.result.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{match.betAmount} ETH</p>
                      <p
                        className={`text-sm font-bold ${
                          match.result.winner === address
                            ? "text-green-400"
                            : match.result.winner === "tie"
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {match.result.winner === address 
                          ? `+${(parseFloat(match.betAmount) * 2).toFixed(3)} ETH` 
                          : match.result.winner === "tie" 
                            ? `±${match.betAmount} ETH`
                            : `-${match.betAmount} ETH`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Your Move:</p>
                      <p className="text-white font-bold uppercase">
                        {address === match.players.creator ? match.moves.creatorMove : match.moves.joinerMove}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Opponent Move:</p>
                      <p className="text-white font-bold uppercase">
                        {address === match.players.creator ? match.moves.joinerMove : match.moves.creatorMove}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-600 flex justify-between items-center">
                    <p className="text-gray-400 text-xs">
                      {match.provider === "filecoin" ? "Stored on Filecoin Calibration Testnet" : 
                       match.provider === "pinata" ? "Stored via Pinata IPFS" : 
                       "Demo Storage"} • Decentralized record
                    </p>
                    {match.ipfsHash && (
                      <a
                        href={`https://ipfs.io/ipfs/${match.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-bold"
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

        <div className="mt-6 text-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded"
          >
            ← Back
          </button>
          <Link href="/play" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded">
            Play New Game
          </Link>
        </div>
      </div>
    </div>
  );
}
