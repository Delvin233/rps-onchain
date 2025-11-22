"use client";

import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useGameEngine } from "~~/engine/GameEngine";
import type { Move } from "~~/engine/types";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";

export default function MultiplayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isMiniApp } = usePlatformDetection();
  const roomId = params.roomId as string;

  // Use game engine
  const { gameData, state, isLoading, submitMove, requestRematch, leaveRoom } = useGameEngine({
    roomId,
    playerAddress: address || "",
    mode: "multiplayer",
  });

  const moves: Move[] = ["rock", "paper", "scissors"];

  // Display names
  const { displayName: player1Name } = useDisplayName(gameData?.player1?.address);
  const { displayName: player2Name } = useDisplayName(gameData?.player2?.address);

  if (!isConnected || !address) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">Please connect your wallet to play</p>
          <button onClick={() => router.push("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Waiting for opponent
  if (state === "waiting") {
    return (
      <div className="p-6 pt-12 pb-24">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <RainbowKitCustomConnectButton />
          </div>
        )}
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Opponent...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center mb-4">
          <p className="text-lg font-mono mb-4">Room Code: {roomId}</p>
          <p className="text-base-content/60">Share this code with your opponent</p>
        </div>
        <button onClick={() => leaveRoom()} className="btn btn-error w-full">
          Cancel Room
        </button>
      </div>
    );
  }

  // Choose move
  if (state === "choosing") {
    return (
      <div className="px-4 py-4 min-h-screen flex flex-col">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <RainbowKitCustomConnectButton />
          </div>
        )}
        <h1
          className="font-bold text-glow-primary"
          style={{ fontSize: "clamp(1.25rem, 4vw, 1.875rem)", marginBottom: "clamp(1rem, 2vh, 1.5rem)" }}
        >
          Choose Your Move
        </h1>

        <div
          className="flex flex-col"
          style={{ gap: "clamp(0.75rem, 2vh, 1.5rem)", marginTop: "clamp(1rem, 2vh, 2rem)" }}
        >
          {moves.map(move => (
            <button
              key={move}
              onClick={() => submitMove(move)}
              disabled={isLoading}
              className="w-full bg-card/50 backdrop-blur border border-border rounded-xl hover:border-primary/50 transition-all duration-200 disabled:opacity-50"
              style={{ padding: "clamp(1rem, 3vh, 2rem)" }}
            >
              <p className="font-semibold capitalize" style={{ fontSize: "clamp(1rem, 3vw, 1.5rem)" }}>
                {move}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Waiting for reveal
  if (state === "submitted" || state === "revealing") {
    return (
      <div className="p-6 pt-12 pb-24">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <RainbowKitCustomConnectButton />
          </div>
        )}
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Waiting for Reveal...</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">
            Your move: <span className="font-bold uppercase">{gameData?.player1?.move}</span>
          </p>
          <p className="text-base-content/60">Waiting for opponent move...</p>
        </div>
      </div>
    );
  }

  // Game finished
  if (state === "finished" && gameData?.result) {
    return (
      <div className="p-6 pt-12 pb-24">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <RainbowKitCustomConnectButton />
          </div>
        )}
        <h1 className="text-2xl font-bold text-glow-primary mb-6">Game Over</h1>
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-xs text-base-content/60 mb-1">{player1Name}</p>
              <p className="text-2xl font-bold capitalize">{gameData.player1.move}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-base-content/60 mb-1">{player2Name}</p>
              <p className="text-2xl font-bold capitalize">{gameData.player2?.move}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p
              className={`text-3xl font-bold ${
                gameData.result === "win" ? "text-success" : gameData.result === "lose" ? "text-error" : "text-warning"
              }`}
            >
              {gameData.result === "win" ? "You Win!" : gameData.result === "lose" ? "You Lose!" : "Tie!"}
            </p>
          </div>

          <div className="space-y-3">
            <button onClick={() => requestRematch()} disabled={isLoading} className="btn btn-primary w-full">
              Play Again
            </button>
            <button onClick={() => leaveRoom()} disabled={isLoading} className="btn btn-error w-full">
              Back to Play
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
