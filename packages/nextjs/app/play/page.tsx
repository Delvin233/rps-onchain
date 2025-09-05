"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useEnsName } from "wagmi";
import { base, mainnet } from "wagmi/chains";

export default function PlayPage() {
  const { address, isConnected } = useAccount();
  const { data: mainnetEnsName } = useEnsName({ address, chainId: mainnet.id });
  const { data: baseEnsName } = useEnsName({ address, chainId: base.id });
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ensSource, setEnsSource] = useState<"mainnet" | "base" | null>(null);
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

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

  const createRoom = async () => {
    setIsCreating(true);
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const response = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", roomId: newRoomId, address, username: displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Room created successfully:", data);
        setRoomId(newRoomId);
        startPolling(newRoomId);
      } else {
        console.error("Failed to create room:", await response.text());
        alert("Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room");
    }
    setIsCreating(false);
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) return;
    setIsJoining(true);

    try {
      const response = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", roomId: joinRoomId, address, username: displayName }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Joined room successfully:", data);
        window.location.href = `/game/${joinRoomId}`;
      } else {
        const errorText = await response.text();
        console.error("Failed to join room:", errorText);
        alert(`Failed to join room: ${errorText}`);
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Error joining room");
    }
    setIsJoining(false);
  };

  const startPolling = (roomId: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/room?roomId=${roomId}`);
      const data = await response.json();

      if (data.room?.status === "ready") {
        clearInterval(interval);
        window.location.href = `/game/${roomId}`;
      }
    }, 2000);
  };

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
          <div className="space-y-4">
            <h2 className="text-xl text-white">CREATE ROOM</h2>

            {!roomId ? (
              <div className="space-y-3">
                <p className="text-gray-300 text-sm">Create a room and share the Room ID with your opponent</p>
                <button
                  onClick={createRoom}
                  disabled={isCreating}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 text-sm font-bold rounded"
                >
                  {isCreating ? "CREATING..." : "CREATE ROOM"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-white text-sm font-bold mb-2">ROOM CREATED!</p>
                  <p className="text-gray-300 text-xs mb-2">Room ID:</p>
                  <p className="text-white text-lg font-mono bg-gray-600 p-2 rounded">{roomId}</p>
                  <p className="text-gray-300 text-xs mt-2">Share this Room ID with your opponent</p>
                </div>

                <div className="bg-yellow-600 p-3 rounded">
                  <p className="text-white text-sm font-bold">WAITING FOR OPPONENT...</p>
                </div>

                <button
                  onClick={() => setRoomId("")}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
                >
                  CREATE NEW ROOM
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h2 className="text-xl text-white mb-4">JOIN ROOM</h2>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">Enter Room ID to join an existing game</p>
              <input
                type="text"
                value={joinRoomId}
                onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
                className="w-full bg-gray-600 text-white p-2 text-sm rounded font-mono"
                maxLength={6}
              />
              <button
                onClick={joinRoom}
                disabled={isJoining || !joinRoomId.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 text-sm font-bold rounded"
              >
                {isJoining ? "JOINING..." : "JOIN ROOM"}
              </button>
            </div>
          </div>

          <Link href="/">
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded">
              BACK TO MENU
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
