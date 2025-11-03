"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useAuth } from "~~/contexts/AuthContext";
import { useGameData, useRPSContract } from "~~/hooks/useRPSContract";
import { MatchRecord, storeMatchLocally, storeMatchRecord } from "~~/lib/pinataStorage";
import { generateNonce, hashMove, moveToNumber, numberToMove } from "~~/utils/gameUtils";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { address, isAuthenticated } = useAuth();
  const { commitMove, revealPlayerMove, claimPrize } = useRPSContract();
  const [pendingMove, setPendingMove] = useState<{ move: string; nonce: bigint } | null>(null);
  const [gamePhase, setGamePhase] = useState<"commit" | "reveal" | "finished">("commit");
  const [room, setRoom] = useState<{
    id: string;
    creator: string;
    creatorUsername: string;
    joiner?: string;
    joinerUsername?: string;
    status: "waiting" | "ready" | "playing" | "finished" | "ended";
    moves?: { creator?: string; joiner?: string };
    result?: { winner: string; creatorMove: string; joinerMove: string };
    playAgainRequest?: string;
    betAmount: string;
    totalPot: string;
  } | null>(null);

  const [roomId, setRoomId] = useState("");
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setRoomId(resolvedParams.roomId);
    };
    getParams();
  }, [params]);

  const { gameData, refetch } = useGameData(roomId || "");

  useEffect(() => {
    if (!roomId || !gameData) return;

    // Convert contract data to room format
    const contractRoom = {
      id: roomId,
      creator: gameData.player1,
      creatorUsername: gameData.player1.slice(0, 6) + "...",
      joiner: gameData.player2 !== "0x0000000000000000000000000000000000000000" ? gameData.player2 : undefined,
      joinerUsername:
        gameData.player2 !== "0x0000000000000000000000000000000000000000"
          ? gameData.player2.slice(0, 6) + "..."
          : undefined,
      status:
        gameData.state === 0
          ? "waiting"
          : gameData.state === 1
            ? "ready"
            : gameData.state === 2
              ? "playing"
              : ("finished" as any),
      betAmount: formatEther(gameData.betAmount),
      totalPot: formatEther(gameData.betAmount * 2n),
      result:
        gameData.state === 4
          ? {
              winner:
                gameData.winner === "0x0000000000000000000000000000000000000000"
                  ? "tie"
                  : gameData.winner === gameData.player1
                    ? "creator"
                    : "joiner",
              creatorMove: numberToMove(gameData.revealedMove1),
              joinerMove: numberToMove(gameData.revealedMove2),
            }
          : undefined,
    };

    // Update game phase based on contract state
    if (gameData.state === 1) setGamePhase("commit");
    else if (gameData.state === 2) setGamePhase("reveal");
    else if (gameData.state === 4) {
      setGamePhase("finished");

      // Store match record to IPFS when game finishes
      if (contractRoom.result && !localStorage.getItem(`match-stored-${roomId}`)) {
        const matchRecord: MatchRecord = {
          roomId,
          players: {
            creator: contractRoom.creator,
            joiner: contractRoom.joiner || "",
          },
          moves: {
            creatorMove: contractRoom.result.creatorMove,
            joinerMove: contractRoom.result.joinerMove,
          },
          result: {
            winner:
              contractRoom.result.winner === "tie"
                ? "tie"
                : contractRoom.result.winner === "creator"
                  ? contractRoom.creator
                  : contractRoom.joiner || "",
            timestamp: Date.now(),
          },
          betAmount: contractRoom.betAmount,
        };

        // Store to Pinata and locally
        storeMatchRecord(matchRecord).then(result => {
          if (result) {
            matchRecord.ipfsHash = result.ipfsHash;
            matchRecord.provider = result.provider;
            storeMatchLocally(matchRecord);
            console.log(`Match stored via ${result.provider}: https://ipfs.io/ipfs/${result.ipfsHash}`);
          }
        });
        localStorage.setItem(`match-stored-${roomId}`, "true");
      }
    }

    setRoom(contractRoom);
    console.log("Contract game data:", gameData, "Converted room:", contractRoom);

    // Poll for updates
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, gameData, refetch]);

  const makeMove = async (move: "rock" | "paper" | "scissors") => {
    if (!address) return;

    if (gamePhase === "commit") {
      setSelectedMove(move);
      const nonce = generateNonce();
      const moveNum = moveToNumber(move);
      const hashedMove = hashMove(moveNum, nonce, address);

      setPendingMove({ move, nonce });

      const result = await commitMove(roomId, hashedMove as `0x${string}`);
      if (!result.success) {
        alert("Failed to submit move");
        setSelectedMove(null);
        setPendingMove(null);
      }
    } else if (gamePhase === "reveal" && pendingMove) {
      const moveNum = moveToNumber(pendingMove.move);
      const result = await revealPlayerMove(roomId, moveNum, pendingMove.nonce);
      if (!result.success) {
        alert("Failed to reveal move");
      }
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const handleBackToLobby = () => {
    // Check if game is active (not finished or ended)
    const isGameActive = room?.status === "ready" || (room?.status === "finished" && !room.result);

    if (isGameActive) {
      const confirmed = window.confirm("Are you sure you want to leave? This will end the match for both players.");
      if (confirmed) {
        window.location.href = "/play";
      }
    } else {
      window.location.href = "/play";
    }
  };

  // Show loading for room or wallet initialization
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
          <h1 className="text-2xl mb-4 text-white">RPS-ONCHAIN</h1>
          <p className="text-gray-300 text-sm mb-6">SIGN IN TO PLAY</p>
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
                              Sign In
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

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
          <h1 className="text-2xl mb-4 text-white">RPS-ONCHAIN</h1>
          <p className="text-gray-300 text-sm">
            {!room && roomId
              ? `Loading room ${roomId}...`
              : !room
                ? "Loading..."
                : !isAuthenticated
                  ? "Connecting wallet..."
                  : "Initializing game..."}
          </p>
          {!room && roomId && <p className="text-gray-300 text-xs mt-2">If this persists, the room may not exist</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="card-gaming max-w-2xl w-full text-center animate-scale-in">
        <div className="space-y-6 max-w-md mx-auto">
          {room?.status === "waiting" ? (
            <>
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-lg shadow-neon-orange animate-pulse-soft">
                <h2 className="text-white text-2xl font-bold mb-2 animate-bounce-subtle"> WAITING FOR PLAYER</h2>
                <p className="text-white text-sm">Room ID: {roomId}</p>
                <p className="text-white text-xs mt-1">Bet Required: {room.betAmount} CELO</p>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm p-5 rounded-lg border border-purple-500/30 text-left">
                <h3 className="text-purple-400 text-sm font-bold mb-3 uppercase tracking-wider">Players:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Creator:</span>
                    <span className="text-white text-sm font-bold">{room.creatorUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Joiner:</span>
                    <span className="text-white text-sm font-bold">Waiting...</span>
                  </div>
                </div>
              </div>
            </>
          ) : !gameStarted && room?.status === "ready" ? (
            <>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-lg shadow-neon-green animate-pulse-soft">
                <h2 className="text-white text-2xl font-bold mb-2 animate-bounce-subtle">✅ ROOM READY!</h2>
                <p className="text-white text-sm">Room ID: {roomId}</p>
                <p className="text-white text-xs mt-1">
                  Bet: {room.betAmount} CELO • Total Pot: {room.totalPot} CELO
                </p>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm p-5 rounded-lg border border-purple-500/30 text-left">
                <h3 className="text-purple-400 text-sm font-bold mb-3 uppercase tracking-wider">Players:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Creator:</span>
                    <span className="text-white text-sm font-bold">{room.creatorUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Joiner:</span>
                    <span className="text-white text-sm font-bold">{room.joinerUsername}</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-600/20 border border-orange-500 p-4 rounded-lg mb-4">
                <p className="text-orange-300 text-xs">
                  ⚠️ Once started, you must complete the game. Leaving will forfeit your bet.
                </p>
              </div>
              <button onClick={startGame} className="btn-gaming-primary w-full py-4 text-lg">
                START GAME
              </button>
            </>
          ) : room?.status === "ended" ? (
            <>
              <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-lg shadow-neon-orange">
                <h2 className="text-white text-2xl font-bold mb-2">❌ MATCH ENDED</h2>
                <p className="text-white text-sm">Your opponent left the match</p>
              </div>

              <div className="bg-gray-700 p-4 rounded text-center">
                <p className="text-gray-300 text-sm">Thanks for playing!</p>
                <p className="text-gray-300 text-xs mt-1">Room ID: {roomId}</p>
              </div>
            </>
          ) : room?.status === "finished" ? (
            <>
              <div
                className={`p-6 rounded-lg shadow-glow animate-scale-in ${
                  room.result?.winner === "tie"
                    ? "bg-gradient-to-r from-yellow-600 to-orange-600 shadow-neon-orange"
                    : (room.result?.winner === "creator" && address === room.creator) ||
                        (room.result?.winner === "joiner" && address === room.joiner)
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 shadow-neon-green"
                      : "bg-gradient-to-r from-red-600 to-pink-600 shadow-neon-orange"
                }`}
              >
                <h2 className="text-white text-3xl font-bold mb-2 animate-bounce-subtle">
                  {room.result?.winner === "tie"
                    ? "TIE!"
                    : (room.result?.winner === "creator" && address === room.creator) ||
                        (room.result?.winner === "joiner" && address === room.joiner)
                      ? "YOU WIN!"
                      : "YOU LOSE!"}
                </h2>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm p-5 rounded-lg border border-purple-500/30">
                <h3 className="text-purple-400 text-sm font-bold mb-3 uppercase tracking-wider">Moves:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">{room.creatorUsername}:</span>
                    <span className="text-white text-sm font-bold uppercase">{room.result?.creatorMove}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">{room.joinerUsername}:</span>
                    <span className="text-white text-sm font-bold uppercase">{room.result?.joinerMove}</span>
                  </div>
                </div>
              </div>

              {((room.result?.winner === "creator" && address === room.creator && gameData?.player1Paid) ||
                (room.result?.winner === "joiner" && address === room.joiner && gameData?.player2Paid) ||
                (room.result?.winner === "tie" &&
                  ((address === room.creator && gameData?.player1Paid) ||
                    (address === room.joiner && gameData?.player2Paid)))) && (
                <button
                  onClick={() => claimPrize(roomId)}
                  className="btn-gaming-primary w-full py-4 text-lg animate-pulse-soft"
                >
                  {room.result?.winner === "tie"
                    ? `💰 CLAIM REFUND (${room.betAmount} CELO)`
                    : `🏆 CLAIM WINNINGS (${room.totalPot} CELO)`}
                </button>
              )}
            </>
          ) : gamePhase === "reveal" ? (
            <>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-lg shadow-neon-purple animate-pulse-soft">
                <h2 className="text-white text-2xl font-bold mb-2 animate-bounce-subtle">🎭 REVEAL YOUR MOVE</h2>
                <p className="text-white text-sm">Click to reveal your committed move</p>
                <p className="text-white text-xs mt-1">Prize Pool: {room.totalPot} CELO</p>
              </div>

              {pendingMove ? (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-5 rounded-lg shadow-neon-orange">
                    <p className="text-white text-lg font-bold">YOUR MOVE: {pendingMove.move.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => makeMove(pendingMove.move as "rock" | "paper" | "scissors")}
                    className="btn-gaming-primary w-full py-4 text-lg"
                  >
                    ✨ REVEAL MOVE
                  </button>
                </div>
              ) : (
                <div className="bg-red-600 p-4 rounded">
                  <p className="text-white text-sm">No pending move found</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-lg shadow-neon-blue animate-pulse-soft">
                <h2 className="text-white text-2xl font-bold mb-2 animate-bounce-subtle">🎯 COMMIT YOUR MOVE</h2>
                <p className="text-white text-sm">Choose Rock, Paper, or Scissors</p>
                <p className="text-white text-xs mt-1">Prize Pool: {room.totalPot} CELO</p>
              </div>

              {selectedMove ? (
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-5 rounded-lg shadow-neon-orange animate-pulse-soft">
                  <p className="text-white text-lg font-bold">✅ MOVE COMMITTED: {selectedMove.toUpperCase()}</p>
                  <p className="text-white text-sm mt-2 animate-bounce-subtle"> Waiting for opponent...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {["rock", "paper", "scissors"].map((move, idx) => (
                    <button
                      key={move}
                      onClick={() => makeMove(move as "rock" | "paper" | "scissors")}
                      className="btn-gaming-primary w-full py-4 text-lg uppercase"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {move === "rock" ? "✊" : move === "paper" ? "✋" : "✌️"} {move}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {room?.status === "waiting" && (
            <button
              onClick={handleBackToLobby}
              className="w-full bg-gray-700/50 hover:bg-gray-600 border border-gray-500 text-white py-3 px-4 text-sm rounded-lg transition-all"
            >
              ← BACK TO LOBBY
            </button>
          )}

          {room?.status === "ended" && (
            <div className="space-y-2">
              <button
                onClick={handleBackToLobby}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
              >
                BACK TO LOBBY
              </button>
              <Link
                href="/history"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 text-sm rounded text-center"
              >
                VIEW MATCH HISTORY
              </Link>
            </div>
          )}

          {room?.status === "finished" &&
            !(
              (room.result?.winner === "creator" && address === room.creator && gameData?.player1Paid) ||
              (room.result?.winner === "joiner" && address === room.joiner && gameData?.player2Paid) ||
              (room.result?.winner === "tie" &&
                ((address === room.creator && gameData?.player1Paid) ||
                  (address === room.joiner && gameData?.player2Paid)))
            ) && (
              <div className="space-y-2">
                <button
                  onClick={handleBackToLobby}
                  className="w-full bg-gray-700/50 hover:bg-gray-600 border border-gray-500 text-white py-3 px-4 text-sm rounded-lg transition-all"
                >
                  ← BACK TO LOBBY
                </button>
                <Link
                  href="/history"
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 text-sm rounded-lg text-center shadow-neon-purple transition-all"
                >
                  📜 VIEW MATCH HISTORY
                </Link>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
