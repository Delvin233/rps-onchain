"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "~~/contexts/AuthContext";

type GameState = "menu" | "demo";

export default function Home() {
  const { address, isAuthenticated, verifySelf } = useAuth();
  const [gameState, setGameState] = useState<GameState>("menu");

  const startDemo = () => {
    setGameState("demo");
  };

  const backToMenu = () => {
    setGameState("menu");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
          <div className="bg-gray-700 p-4 rounded text-left mb-6">
            <p className="text-white text-sm font-bold mb-2">GAME RULES:</p>
            <p className="text-gray-300 text-xs mb-1">Rock beats Scissors</p>
            <p className="text-gray-300 text-xs mb-1">Scissors beats Paper</p>
            <p className="text-gray-300 text-xs mb-1">Paper beats Rock</p>
            <p className="text-gray-300 text-xs">Same moves result in a tie</p>
          </div>
          <p className="text-gray-300 text-sm mb-4">SIGN IN TO PLAY</p>
          <div className="space-y-3 max-w-sm mx-auto">
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div>
                    {(() => {
                      if (!connected) {
                        return (
                          <div className="space-y-3">
                            <button
                              onClick={openConnectModal}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 text-sm font-bold rounded"
                            >
                              Sign In with Wallet
                            </button>
                            <button
                              onClick={verifySelf}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 text-sm font-bold rounded"
                            >
                              Verify Human Identity
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
        {gameState === "menu" && (
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded text-left">
              <p className="text-green-400 text-sm font-bold mb-2">✅ WALLET CONNECTED</p>
              <p className="text-gray-300 text-xs">
                Address: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
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
