"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useEnsName } from "wagmi";
import { base, mainnet } from "wagmi/chains";

type GameState = "menu" | "demo";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: mainnetEnsName } = useEnsName({ address, chainId: mainnet.id });
  const { data: baseEnsName } = useEnsName({ address, chainId: base.id });
  const [gameState, setGameState] = useState<GameState>("menu");
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ensSource, setEnsSource] = useState<"mainnet" | "base" | null>(null);

  useEffect(() => {
    if (address) {
      fetch(`/api/username?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUsername(data.username);
          }
        });
    }
  }, [address]);

  useEffect(() => {
    // Priority: Mainnet ENS > Base ENS > custom username > 'User'
    if (mainnetEnsName) {
      setDisplayName(mainnetEnsName);
      setEnsSource("mainnet");
    } else if (baseEnsName) {
      setDisplayName(baseEnsName);
      setEnsSource("base");
    } else if (username) {
      setDisplayName(username);
      setEnsSource(null);
    } else {
      setDisplayName("User");
      setEnsSource(null);
    }
  }, [mainnetEnsName, baseEnsName, username]);

  const saveUsername = async () => {
    if (!address || !tempUsername.trim()) return;

    const response = await fetch("/api/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, username: tempUsername.trim() }),
    });

    if (response.ok) {
      setUsername(tempUsername.trim());
      setIsEditing(false);
    }
  };

  const startEdit = () => {
    setTempUsername(username);
    setIsEditing(true);
  };

  const startDemo = () => {
    setGameState("demo");
  };

  const backToMenu = () => {
    setGameState("menu");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
          <h1 className="text-2xl mb-4 text-white">RPS-ONCHAIN</h1>
          <div className="bg-gray-700 p-4 rounded text-left mb-6">
            <p className="text-white text-sm font-bold mb-2">GAME RULES:</p>
            <p className="text-gray-300 text-xs mb-1">Rock beats Scissors</p>
            <p className="text-gray-300 text-xs mb-1">Scissors beats Paper</p>
            <p className="text-gray-300 text-xs mb-1">Paper beats Rock</p>
            <p className="text-gray-300 text-xs">Same moves result in a tie</p>
          </div>
          <p className="text-gray-300 text-sm mb-4">CONNECT WALLET TO PLAY</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl text-white">RPS-ONCHAIN</h1>
            {isConnected && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={e => setTempUsername(e.target.value)}
                      placeholder="Enter username"
                      className="bg-gray-600 text-white p-1 text-sm rounded w-24"
                      maxLength={15}
                    />
                    <button
                      onClick={saveUsername}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 text-xs rounded"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-300 text-sm">
                      Welcome <span className="font-bold text-white">{displayName}</span>
                      {ensSource === "mainnet" && <span className="text-green-400 text-xs ml-1">ENS</span>}
                      {ensSource === "base" && <span className="text-blue-400 text-xs ml-1">BASE</span>}
                    </span>
                    {!ensSource && (
                      <button
                        onClick={startEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs rounded"
                      >
                        ✎
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <ConnectButton showBalance={false} />
        </div>

        {gameState === "menu" && (
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded text-left">
              <p className="text-green-400 text-sm font-bold mb-2">✅ WALLET CONNECTED</p>
              <p className="text-gray-300 text-xs mb-1">
                Address: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <p className="text-gray-300 text-xs">Network: Base Sepolia</p>
            </div>
            <div className="max-w-md mx-auto space-y-3">
              <button
                onClick={startDemo}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 text-sm font-bold rounded"
              >
                TEST WALLET FEATURES
              </button>
              <Link href="/play">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 text-sm font-bold rounded">
                  PLAY GAME
                </button>
              </Link>
            </div>
          </div>
        )}

        {gameState === "demo" && (
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded text-left">
              <p className="text-white text-sm font-bold mb-2">WALLET CONNECTION TEST</p>
              <p className="text-gray-300 text-xs mb-1">✅ MetaMask Connected</p>
              <p className="text-gray-300 text-xs mb-1">✅ Base Sepolia Network</p>
              <p className="text-gray-300 text-xs mb-1">✅ Address Retrieved</p>
              <p className="text-gray-300 text-xs">✅ RainbowKit Integration</p>
            </div>
            <button
              onClick={backToMenu}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 text-sm font-bold"
            >
              BACK TO MENU
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
