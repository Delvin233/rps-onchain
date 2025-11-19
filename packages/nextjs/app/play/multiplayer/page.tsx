"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Plus, Shield, Users } from "lucide-react";
import toast from "react-hot-toast";
import { celo } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";

export default function MultiplayerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const { isMiniApp } = usePlatformDetection();

  const { switchChain } = useSwitchChain();

  const {
    displayName: creatorName,
    hasEns: creatorHasEns,
    ensType: creatorEnsType,
  } = useDisplayName(roomInfo?.creator);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("clear") === "1") {
      setRoomCode("");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (roomCode.length === 6) {
      checkRoomInfo();
    } else {
      setRoomInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const checkRoomInfo = async () => {
    setCheckingRoom(true);
    try {
      const response = await fetch(`/api/room/info?roomId=${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.creator) {
          const verifyRes = await fetch(`/api/check-verification?address=${data.creator}`);
          const verifyData = await verifyRes.json();
          setRoomInfo({ ...data, creatorVerified: verifyData.verified });
        } else {
          setRoomInfo(data);
        }
      } else {
        setRoomInfo(null);
      }
    } catch {
      setRoomInfo(null);
    } finally {
      setCheckingRoom(false);
    }
  };

  const { writeContractAsync: createGameContract } = useScaffoldWriteContract({ contractName: "RPSOnline" });

  const createRoom = async () => {
    if (!address || isCreating) return;

    setIsCreating(true);
    setShowCreateConfirm(false);
    try {
      const response = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: address,
          betAmount: "0",
          isFree: true,
          chainId,
        }),
      });

      const data = await response.json();
      if (data.roomId) {
        await createGameContract({
          functionName: "createGame",
          args: [data.roomId],
        });
        router.push(`/game/multiplayer/${data.roomId}?mode=free`);
      }
    } catch (error: any) {
      console.error("Error creating room:", error);
      if (error.message?.includes("User rejected") || error.message?.includes("User denied")) {
        toast.error("Room creation was cancelled", {
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-error)",
          },
        });
      } else {
        toast.error("Failed to create room", {
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-error)",
          },
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const { writeContractAsync: joinGameContract } = useScaffoldWriteContract({ contractName: "RPSOnline" });

  const joinRoom = async () => {
    if (!address || !roomCode || roomCode.length !== 6 || isJoining) return;

    setIsJoining(true);
    setShowJoinConfirm(false);
    try {
      // Refresh room info to ensure it's still valid
      await checkRoomInfo();
      if (!roomInfo) {
        throw new Error("Room no longer exists");
      }

      // Sign blockchain transaction FIRST
      await joinGameContract({
        functionName: "joinGame",
        args: [roomCode],
      });

      // THEN update Redis after blockchain confirms
      const verifyRes = await fetch(`/api/check-verification?address=${address}`);
      const verifyData = await verifyRes.json();

      const response = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomCode, joiner: address, joinerVerified: verifyData.verified }),
      });

      if (!response.ok) {
        throw new Error("Failed to update room state");
      }

      const data = await response.json();
      if (data.success) {
        router.push(`/game/multiplayer/${roomCode}?mode=free`);
      } else if (data.error === "Room is full") {
        toast.error("Room is full");
      } else {
        throw new Error(data.error || "Failed to join room");
      }
    } catch (error: any) {
      console.error("Error joining room:", error);
      if (error.message?.includes("User rejected") || error.message?.includes("User denied")) {
        toast.error("Room join was cancelled", {
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-error)",
          },
        });
      } else if (error.message?.includes("Room does not exist")) {
        toast.error("Room not found. Please check the code or switch networks.", {
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-error)",
          },
        });
      } else {
        toast.error("Failed to join room", {
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-error)",
          },
        });
      }
    } finally {
      setIsJoining(false);
    }
  };

  const isMiniPayCheck = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-primary mb-3 animate-glow">Multiplayer</h1>
            <p className="text-base-content/70">Connect Wallet to Play</p>
          </div>
          {isMiniPayCheck ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="w-full">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="w-full bg-gradient-primary hover:scale-105 transform transition-all duration-200 text-lg font-semibold shadow-glow-primary rounded-xl py-4 px-6"
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6 pt-12 pb-24">
      <div className="flex items-start mb-4 gap-2">
        <button onClick={() => router.back()} className="btn btn-sm btn-ghost flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-glow-primary break-words flex-1 min-w-0">
          Multiplayer
        </h1>
      </div>
      {!isMiniApp && (
        <div className="flex justify-end mb-6 lg:hidden">
          <RainbowKitCustomConnectButton />
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-card/50 backdrop-blur border border-primary/20 rounded-xl p-6">
          <h2 className="flex items-center space-x-2 text-lg font-semibold mb-4">
            <Plus size={20} />
            <span>Create Room</span>
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateConfirm(true)}
              disabled={isCreating || !address}
              className="btn btn-primary w-full"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur border border-secondary/20 rounded-xl p-6">
          <h2 className="flex items-center space-x-2 text-lg font-semibold mb-4">
            <Users size={20} />
            <span>Join Room</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-base-content/60 block mb-1">Room Code</label>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                className="input input-bordered w-full text-center text-lg font-mono"
                placeholder="XXXXXX"
                maxLength={6}
              />
              {checkingRoom && <p className="text-xs text-base-content/60 mt-2">Checking room...</p>}
              {roomInfo && roomInfo.chainId && roomInfo.chainId !== chainId && (
                <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm text-warning mb-2">
                    Room is on {roomInfo.chainId === celo.id ? "Celo" : "Base"}
                  </p>
                  <button
                    onClick={() => switchChain({ chainId: roomInfo.chainId })}
                    disabled={isJoining || isCreating}
                    className="btn btn-sm btn-warning w-full"
                  >
                    Switch Network
                  </button>
                </div>
              )}
              {roomInfo && (
                <div className="mt-3 p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-base-content/80">
                      Creator: {creatorName}
                      {creatorHasEns && (
                        <span
                          className={`ml-1 text-xs ${
                            creatorEnsType === "mainnet"
                              ? "text-success"
                              : creatorEnsType === "basename"
                                ? "text-primary"
                                : creatorEnsType === "farcaster"
                                  ? "text-purple-500"
                                  : "text-info"
                          }`}
                        >
                          {creatorEnsType === "mainnet"
                            ? "ENS"
                            : creatorEnsType === "basename"
                              ? "BASENAME"
                              : creatorEnsType === "farcaster"
                                ? "FC"
                                : "BASE"}
                        </span>
                      )}
                    </p>
                    {roomInfo.creator && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(roomInfo.creator);
                          toast.success("Address copied!");
                        }}
                        className="btn btn-xs btn-ghost"
                      >
                        📋
                      </button>
                    )}
                  </div>
                  {roomInfo.creatorVerified && (
                    <div className="flex items-center gap-1 text-success text-sm">
                      <Shield size={14} />
                      <span>Verified Human</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowJoinConfirm(true)}
              disabled={
                isJoining ||
                !address ||
                roomCode.length !== 6 ||
                (roomInfo && roomInfo.chainId && roomInfo.chainId !== chainId)
              }
              className="btn btn-secondary w-full"
            >
              {isJoining ? "Joining..." : "Join Game"}
            </button>
          </div>
        </div>
      </div>

      {showCreateConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 border border-primary/30 rounded-xl p-6 max-w-md w-full shadow-glow-primary">
            <h3 className="text-xl font-bold mb-4 text-primary">Confirm Room Creation</h3>
            <p className="text-base-content/80 mb-6">
              You will be asked to sign a transaction to create your game room on-chain. This is free and only requires
              gas fees.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateConfirm(false)} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={createRoom} className="btn btn-primary flex-1">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinConfirm && roomInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 border border-secondary/30 rounded-xl p-6 max-w-md w-full shadow-glow-secondary">
            <h3 className="text-xl font-bold mb-4 text-secondary">Confirm Room Join</h3>
            <div className="mb-4 p-3 bg-base-200 rounded-lg">
              <p className="text-sm text-base-content/60 mb-1">Room Creator</p>
              <div className="flex items-center justify-between mb-2">
                <p className="text-base-content text-base font-semibold">
                  {creatorName}
                  {creatorHasEns && (
                    <span
                      className={`ml-2 text-xs ${
                        creatorEnsType === "mainnet"
                          ? "text-success"
                          : creatorEnsType === "basename"
                            ? "text-primary"
                            : creatorEnsType === "farcaster"
                              ? "text-purple-500"
                              : "text-info"
                      }`}
                    >
                      {creatorEnsType === "mainnet"
                        ? "ENS"
                        : creatorEnsType === "basename"
                          ? "BASENAME"
                          : creatorEnsType === "farcaster"
                            ? "FC"
                            : "BASE"}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomInfo.creator);
                    toast.success("Address copied!");
                  }}
                  className="btn btn-xs btn-ghost"
                >
                  📋
                </button>
              </div>
              {roomInfo.creatorVerified && (
                <div className="flex items-center gap-2 text-success">
                  <Shield size={16} />
                  <span className="text-sm font-semibold">Verified Human</span>
                </div>
              )}
            </div>
            <p className="text-base-content/80 mb-6 text-sm">
              You will be asked to sign a transaction to join this room. This is free and only requires gas fees.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowJoinConfirm(false)} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={joinRoom} className="btn btn-secondary flex-1">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
