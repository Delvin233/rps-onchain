"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useGameData, useRPSContract } from "~~/hooks/useRPSContract";
import { MatchRecord, storeMatchLocally, storeMatchRecord } from "~~/lib/filecoinStorage";
import { generateNonce, hashMove, moveToNumber, numberToMove } from "~~/utils/gameUtils";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { address, isConnected } = useAccount();
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

      // Store match record to Filecoin when game finishes
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
            timestamp: new Date().toLocaleString(),
          },
          betAmount: contractRoom.betAmount,
        };

        // Store to Filecoin and locally
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
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
          <h1 className="text-2xl mb-4 text-white">RPS-ONCHAIN</h1>
          <p className="text-gray-300 text-sm mb-6">CONNECT WALLET TO PLAY</p>
          <div className="flex justify-center">
            <ConnectButton />
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
                : !isConnected
                  ? "Connecting wallet..."
                  : "Initializing game..."}
          </p>
          {!room && roomId && <p className="text-gray-300 text-xs mt-2">If this persists, the room may not exist</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl w-full text-center">
        <div className="space-y-6 max-w-md mx-auto">
          {room?.status === "waiting" ? (
            <>
              <div className="bg-yellow-600 p-4 rounded">
                <h2 className="text-white text-xl font-bold mb-2">WAITING FOR PLAYER</h2>
                <p className="text-white text-sm">Room ID: {roomId}</p>
                <p className="text-white text-xs mt-1">Bet Required: {room.betAmount} ETH</p>
              </div>

              <div className="bg-gray-700 p-4 rounded text-left">
                <h3 className="text-white text-sm font-bold mb-3">PLAYERS:</h3>
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
              <div className="bg-green-600 p-4 rounded">
                <h2 className="text-white text-xl font-bold mb-2">ROOM READY!</h2>
                <p className="text-white text-sm">Room ID: {roomId}</p>
                <p className="text-white text-xs mt-1">
                  Bet: {room.betAmount} ETH • Total Pot: {room.totalPot} ETH
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded text-left">
                <h3 className="text-white text-sm font-bold mb-3">PLAYERS:</h3>
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

              <div className="bg-orange-600 p-3 rounded mb-4">
                <p className="text-white text-xs">
                  ⚠️ Once started, you must complete the game. Leaving will forfeit your bet.
                </p>
              </div>
              <button
                onClick={startGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 text-sm font-bold rounded"
              >
                START GAME
              </button>
            </>
          ) : room?.status === "ended" ? (
            <>
              <div className="bg-red-600 p-4 rounded">
                <h2 className="text-white text-xl font-bold mb-2">MATCH ENDED</h2>
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
                className={`p-4 rounded ${
                  room.result?.winner === "tie"
                    ? "bg-yellow-600"
                    : (room.result?.winner === "creator" && address === room.creator) ||
                        (room.result?.winner === "joiner" && address === room.joiner)
                      ? "bg-green-600"
                      : "bg-red-600"
                }`}
              >
                <h2 className="text-white text-xl font-bold mb-2">
                  {room.result?.winner === "tie"
                    ? "TIE!"
                    : (room.result?.winner === "creator" && address === room.creator) ||
                        (room.result?.winner === "joiner" && address === room.joiner)
                      ? "YOU WIN!"
                      : "YOU LOSE!"}
                </h2>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-white text-sm font-bold mb-3">MOVES:</h3>
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 text-sm font-bold rounded"
                >
                  {room.result?.winner === "tie"
                    ? `CLAIM REFUND (${room.betAmount} ETH)`
                    : `CLAIM WINNINGS (${room.totalPot} ETH)`}
                </button>
              )}
            </>
          ) : gamePhase === "reveal" ? (
            <>
              <div className="bg-purple-600 p-4 rounded">
                <h2 className="text-white text-xl font-bold mb-2">REVEAL YOUR MOVE</h2>
                <p className="text-white text-sm">Click to reveal your committed move</p>
                <p className="text-white text-xs mt-1">Prize Pool: {room.totalPot} ETH</p>
              </div>

              {pendingMove ? (
                <div className="space-y-3">
                  <div className="bg-yellow-600 p-4 rounded">
                    <p className="text-white text-sm font-bold">YOUR MOVE: {pendingMove.move.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => makeMove(pendingMove.move as "rock" | "paper" | "scissors")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 text-lg font-bold rounded"
                  >
                    REVEAL MOVE
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
              <div className="bg-blue-600 p-4 rounded">
                <h2 className="text-white text-xl font-bold mb-2">COMMIT YOUR MOVE</h2>
                <p className="text-white text-sm">Choose Rock, Paper, or Scissors</p>
                <p className="text-white text-xs mt-1">Prize Pool: {room.totalPot} ETH</p>
              </div>

              {selectedMove ? (
                <div className="bg-yellow-600 p-4 rounded">
                  <p className="text-white text-sm font-bold">MOVE COMMITTED: {selectedMove.toUpperCase()}</p>
                  <p className="text-white text-xs mt-1">Waiting for opponent...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {["rock", "paper", "scissors"].map(move => (
                    <button
                      key={move}
                      onClick={() => makeMove(move as "rock" | "paper" | "scissors")}
                      className="w-full bg-gray-600 hover:bg-gray-500 text-white py-4 px-6 text-lg font-bold rounded uppercase"
                    >
                      {move}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {(room?.status === "waiting" || room?.status === "finished" || room?.status === "ended") && (
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
        </div>
      </div>
    </div>
  );
}
