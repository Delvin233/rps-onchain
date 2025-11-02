"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

type GameState = "menu" | "demo";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [gameState, setGameState] = useState<GameState>("menu");

  const startDemo = () => {
    setGameState("demo");
  };

  const backToMenu = () => {
    setGameState("menu");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="card-gaming rounded-2xl p-8 max-w-2xl w-full text-center animate-fade-in-up backdrop-blur-sm">
          <div className="card-gaming rounded-xl p-6 mb-6 text-left">
            <p className="text-white text-sm font-bold mb-3">GAME RULES:</p>
            <div className="space-y-2">
              <p className="text-gray-300 text-xs flex items-center">
                <span className="text-neon-green mr-2">✓</span> Rock beats Scissors
              </p>
              <p className="text-gray-300 text-xs flex items-center">
                <span className="text-neon-green mr-2">✓</span> Scissors beats Paper
              </p>
              <p className="text-gray-300 text-xs flex items-center">
                <span className="text-neon-green mr-2">✓</span> Paper beats Rock
              </p>
              <p className="text-gray-300 text-xs flex items-center">
                <span className="text-neon-orange mr-2"></span> Same moves result in a tie
              </p>
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-6">CONNECT WALLET TO START PLAYING</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="card-gaming rounded-2xl p-8 max-w-2xl w-full text-center animate-fade-in-up">
        {gameState === "menu" && (
          <div className="space-y-6">
            <div className="card-gaming rounded-xl p-6 text-left animate-slide-in-up">
              <p className="text-neon-green text-sm font-bold mb-2 flex items-center">
                <span className="w-2 h-2 bg-neon-green rounded-full mr-2 animate-pulse-soft"></span>
                WALLET CONNECTED
              </p>
              <p className="text-gray-300 text-xs">
                Address: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-3">
              <button
                onClick={startDemo}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 text-sm font-bold rounded-xl shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
              >
                TEST WALLET FEATURES
              </button>
              <Link href="/play">
                <button className="w-full btn-gaming-primary py-4 px-6 text-white text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95">
                  PLAY GAME
                </button>
              </Link>
            </div>
          </div>
        )}

        {gameState === "demo" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="card-gaming rounded-xl p-6 text-left">
              <p className="text-white text-sm font-bold mb-4">WALLET CONNECTION TEST</p>
              <div className="space-y-2">
                <p className="text-gray-300 text-xs flex items-center">
                  <span className="text-neon-green mr-2">✓</span> MetaMask Connected
                </p>
                <p className="text-gray-300 text-xs flex items-center">
                  <span className="text-neon-green mr-2">✓</span> Address Retrieved
                </p>
                <p className="text-gray-300 text-xs flex items-center">
                  <span className="text-neon-green mr-2">✓</span> RainbowKit Integration
                </p>
              </div>
            </div>
            <button
              onClick={backToMenu}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 text-sm font-bold rounded-xl border border-gray-600 transition-all duration-300 hover:scale-105"
            >
              ← BACK TO MENU
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
