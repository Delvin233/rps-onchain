"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useEnsName } from "wagmi";
import { base, mainnet } from "wagmi/chains";

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { address, isConnected } = useAccount();
  const { data: mainnetEnsName } = useEnsName({ address, chainId: mainnet.id });
  const { data: baseEnsName } = useEnsName({ address, chainId: base.id });
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
  } | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ensSource, setEnsSource] = useState<"mainnet" | "base" | null>(null);
  const [roomId, setRoomId] = useState("");
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [autoResetTriggered, setAutoResetTriggered] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setRoomId(resolvedParams.roomId);
    };
    getParams();
  }, [params]);

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

  const requestPlayAgain = useCallback(async () => {
    if (!address || !roomId) return;

    try {
      const response = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", roomId, address, username: displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      }
    } catch (error) {
      console.error("Error requesting play again:", error);
    }
  }, [address, roomId, username]);

  const acceptPlayAgain = useCallback(async () => {
    if (!address || !roomId) return;

    setSelectedMove(null);

    try {
      const response = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", roomId, address, username: displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      }
    } catch (error) {
      console.error("Error accepting play again:", error);
    }
  }, [address, roomId, username]);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      const response = await fetch(`/api/room?roomId=${roomId}`);
      const data = await response.json();
      console.log("Fetched room data:", data);
      setRoom(data.room);

      // Auto-reset if tie (only once per tie)
      if (data.room?.status === "finished" && data.room?.result?.winner === "tie" && !autoResetTriggered && address) {
        setAutoResetTriggered(true);
        setCountdown(3);

        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              if (address) {
                acceptPlayAgain();
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Reset auto-reset flag and selected move when game resets
      if (data.room?.status === "ready") {
        setAutoResetTriggered(false);
        setSelectedMove(null);
        setCountdown(null);
      }
    };

    fetchRoom();

    // Poll for game updates
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [roomId, address, autoResetTriggered, acceptPlayAgain]);

  const makeMove = async (move: "rock" | "paper" | "scissors") => {
    setSelectedMove(move);

    const response = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", roomId, address, move, username: displayName }),
    });

    if (response.ok) {
      const data = await response.json();
      setRoom(data.room);
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const leaveMatch = async () => {
    const response = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave", roomId, address, username: displayName }),
    });

    if (response.ok) {
      const data = await response.json();
      setRoom(data.room);
    }
  };

  const endMatch = async () => {
    const response = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", roomId, address, username: displayName }),
    });

    if (response.ok) {
      const data = await response.json();
      setRoom(data.room);
    }
  };

  const handleBackToLobby = () => {
    // Check if game is active (not finished or ended)
    const isGameActive = room?.status === "ready" || (room?.status === "finished" && !room.result);

    if (isGameActive) {
      const confirmed = window.confirm("Are you sure you want to leave? This will end the match for both players.");
      if (confirmed) {
        leaveMatch();
        window.location.href = "/play";
      }
    } else {
      window.location.href = "/play";
    }
  };

  // Show loading for room or wallet initialization
  if (!room || !isConnected) {
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
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl text-white hover:text-gray-300">
              RPS-ONCHAIN
            </Link>
            <span className="text-gray-300 text-sm">
              Welcome <span className="font-bold text-white">{displayName}</span>
              {ensSource === "mainnet" && <span className="text-green-400 text-xs ml-1">ENS</span>}
              {ensSource === "base" && <span className="text-blue-400 text-xs ml-1">BASE</span>}
            </span>
          </div>
          <ConnectButton showBalance={false} />
        </div>

        <div className="space-y-6 max-w-md mx-auto">
          {!gameStarted ? (
            <>
              <div className="bg-green-600 p-4 rounded">
                <h2 className="text-white text-xl font-bold mb-2">ROOM READY!</h2>
                <p className="text-white text-sm">Room ID: {roomId}</p>
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
                {room.result?.winner === "tie" && (
                  <p className="text-white text-sm">
                    {countdown ? `Auto-restarting in ${countdown}...` : "Restarting..."}
                  </p>
                )}
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

              {room.result?.winner !== "tie" &&
                (room.playAgainRequest ? (
                  room.playAgainRequest === address ? (
                    <div className="bg-yellow-600 p-3 rounded">
                      <p className="text-white text-sm font-bold">WAITING FOR OPPONENT...</p>
                      <p className="text-white text-xs mt-1">You requested to play again</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-blue-600 p-3 rounded">
                        <p className="text-white text-sm font-bold">OPPONENT WANTS TO PLAY AGAIN</p>
                      </div>
                      <button
                        onClick={acceptPlayAgain}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 text-sm font-bold rounded"
                      >
                        ACCEPT
                      </button>
                      <button
                        onClick={endMatch}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 text-sm font-bold rounded"
                      >
                        DECLINE & END MATCH
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={requestPlayAgain}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 text-sm font-bold rounded"
                    >
                      PLAY AGAIN
                    </button>
                    <button
                      onClick={endMatch}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 text-sm font-bold rounded"
                    >
                      END MATCH
                    </button>
                  </div>
                ))}
            </>
          ) : (
            <>
              <div className="bg-blue-600 p-4 rounded">
                <h2 className="text-white text-xl font-bold mb-2">MAKE YOUR MOVE</h2>
                <p className="text-white text-sm">Choose Rock, Paper, or Scissors</p>
              </div>

              {selectedMove ? (
                <div className="bg-yellow-600 p-4 rounded">
                  <p className="text-white text-sm font-bold">MOVE SELECTED: {selectedMove.toUpperCase()}</p>
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

          <button
            onClick={handleBackToLobby}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
          >
            BACK TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
}
