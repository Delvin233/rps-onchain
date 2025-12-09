"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useChainId } from "wagmi";
import { LoginButton } from "~~/components/LoginButton";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { usePlatformDetection } from "~~/hooks/usePlatformDetection";
import { usePlayerStats } from "~~/hooks/usePlayerStats";
import { getDivviReferralTag, submitDivviReferral } from "~~/utils/divviUtils";

type Move = "rock" | "paper" | "scissors";
type GameStatus = "waiting" | "ready" | "playing" | "revealing" | "finished";

export default function MultiplayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useConnectedAddress();
  const chainId = useChainId();
  const { isMiniApp } = usePlatformDetection();
  const { refetch: refetchStats } = usePlayerStats(address);

  const roomId = params.roomId as string;
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [betAmount, setBetAmount] = useState("0");
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "tie" | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentRequestedRematch, setOpponentRequestedRematch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMatchPublished, setIsMatchPublished] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  const [creatorAddress, setCreatorAddress] = useState<string>("");
  const [joinerAddress, setJoinerAddress] = useState<string>("");
  const [creatorPlatform, setCreatorPlatform] = useState<string | null>(null);
  const [joinerPlatform, setJoinerPlatform] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  const { displayName: creatorName } = useDisplayName(creatorAddress || undefined);
  const { displayName: joinerName } = useDisplayName(joinerAddress || undefined);

  const toastShownRef = useRef(false);
  const leftToastShownRef = useRef(false);

  const moves: Move[] = ["rock", "paper", "scissors"];
  const { writeContractAsync: publishMatchContract } = useScaffoldWriteContract({ contractName: "RPSOnline" });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameStatus !== "finished") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (gameStatus !== "finished") {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
        setPendingNavigation("/play/multiplayer");
        setShowExitConfirm(true);
      }
    };

    if (gameStatus !== "finished") {
      window.history.pushState(null, "", window.location.href);
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [gameStatus]);

  const handleNavigation = (path: string) => {
    if (gameStatus !== "finished") {
      setPendingNavigation(path);
      setShowExitConfirm(true);
    } else {
      router.push(path);
    }
  };

  const confirmExit = async () => {
    if (address) {
      await fetch("/api/room/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: address, action: "leave" }),
      });
    }
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  useEffect(() => {
    if (!address) {
      if (gameStatus !== "finished" && gameStatus !== "waiting") {
        toast.error("Wallet disconnected during game");
        setTimeout(() => router.push("/"), 2000);
      }
      return;
    }
    fetchRoomInfo();

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(pollGameStatus, 1500);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!isMiniApp) stopPolling();
      } else {
        setErrorCount(0);
        pollGameStatus();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, address]);

  useEffect(() => {
    if (
      (gameStatus === "ready" || gameStatus === "playing") &&
      (result || rematchRequested || opponentRequestedRematch)
    ) {
      setSelectedMove(null);
      setOpponentMove(null);
      setResult(null);
      setRematchRequested(false);
      setOpponentRequestedRematch(false);
      toastShownRef.current = false;
    }
  }, [gameStatus, result, rematchRequested, opponentRequestedRematch]);

  const fetchRoomInfo = async () => {
    try {
      const response = await fetch(`/api/room/info?roomId=${roomId}`);
      const data = await response.json();
      setBetAmount(data.betAmount);
      setGameStatus(data.status);
      setIsFreeMode(data.isFree || false);
      setCreatorAddress(data.creator || "");
      setJoinerAddress(data.joiner || "");
      setCreatorPlatform(data.creatorPlatform || null);
      setJoinerPlatform(data.joinerPlatform || null);

      // Show joiner verification status to creator
      if (
        data.joiner &&
        data.joinerVerified &&
        data.creator === address &&
        !sessionStorage.getItem(`joiner_verified_${roomId}`)
      ) {
        sessionStorage.setItem(`joiner_verified_${roomId}`, "true");
        toast.custom(
          (t: { id: string }) => (
            <div
              onClick={() => toast.dismiss(t.id)}
              className="bg-base-100 border border-success/50 rounded-lg p-4 shadow-lg cursor-pointer"
            >
              <p className="text-success font-semibold mb-1 flex items-center gap-2">
                <span>🛡️</span> Opponent is Verified
              </p>
              <p className="text-sm text-base-content/60">Your opponent is a verified human</p>
            </div>
          ),
          { duration: 4000 },
        );
      }

      // Show creator verification status to joiner
      if (
        data.creator &&
        data.creatorVerified &&
        data.joiner === address &&
        !sessionStorage.getItem(`creator_verified_${roomId}`)
      ) {
        sessionStorage.setItem(`creator_verified_${roomId}`, "true");
        toast.custom(
          (t: { id: string }) => (
            <div
              onClick={() => toast.dismiss(t.id)}
              className="bg-base-100 border border-success/50 rounded-lg p-4 shadow-lg cursor-pointer"
            >
              <p className="text-success font-semibold mb-1 flex items-center gap-2">
                <span>🛡️</span> Room Creator is Verified
              </p>
              <p className="text-sm text-base-content/60">The room creator is a verified human</p>
            </div>
          ),
          { duration: 4000 },
        );
      }
    } catch (error) {
      console.error("Error fetching room:", error);
    }
  };

  const pollGameStatus = async () => {
    try {
      const response = await fetch(`/api/room/status?roomId=${roomId}&player=${address}`);
      if (!response.ok) {
        if (response.status === 404) {
          setErrorCount(prev => prev + 20);
          return;
        }
        console.error(`Room status API returned ${response.status}`);
        setErrorCount(prev => prev + 1);
        return;
      }
      setErrorCount(0);
      const data = await response.json();
      setGameStatus(data.status);

      if (data.status === "finished") {
        const isCreator = data.creator === address;
        setCreatorAddress(data.creator);
        setJoinerAddress(data.joiner);
        setOpponentMove(isCreator ? data.joinerMove : data.creatorMove);
        const myResult = isCreator ? data.creatorResult : data.joinerResult;
        setResult(myResult);
        setIsSaving(true);

        // Save to localStorage - add game to room's match history
        const matchKey = `${data.roomId}_${data.creatorMove}_${data.joinerMove}`;
        const opponentAddress = isCreator ? data.joiner : data.creator;
        const opponentResult = myResult === "win" ? "lose" : myResult === "lose" ? "win" : "tie";

        // Stats are updated server-side in submit-move API
        refetchStats();

        if (data.ipfsHash && !sessionStorage.getItem(`match_saved_${matchKey}`)) {
          const matches = JSON.parse(localStorage.getItem("rps_matches") || "[]");
          const roomIndex = matches.findIndex((m: any) => m.roomId === data.roomId);

          const gameResult = {
            creatorMove: data.creatorMove,
            joinerMove: data.joinerMove,
            winner:
              myResult === "win" ? address : myResult === "lose" ? (isCreator ? data.joiner : data.creator) : "tie",
            timestamp: new Date().toISOString(),
            ipfsHash: data.ipfsHash,
          };

          if (roomIndex >= 0) {
            if (!matches[roomIndex].games) matches[roomIndex].games = [];
            matches[roomIndex].games.push(gameResult);
            if (data.playerNames) matches[roomIndex].playerNames = data.playerNames;
          } else {
            matches.push({
              roomId: data.roomId,
              players: { creator: data.creator, joiner: data.joiner },
              playerNames: data.playerNames,
              betAmount: data.betAmount || "0",
              games: [gameResult],
            });
          }

          localStorage.setItem("rps_matches", JSON.stringify(matches));
          sessionStorage.setItem(`match_saved_${matchKey}`, "true");

          // Save to Redis history for BOTH players
          await Promise.all([
            fetch("/api/history-fast", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address,
                match: {
                  opponent: opponentAddress,
                  player: address,
                  playerMove: isCreator ? data.creatorMove : data.joinerMove,
                  opponentMove: isCreator ? data.joinerMove : data.creatorMove,
                  result: myResult,
                  timestamp: new Date().toISOString(),
                },
              }),
            }),
            fetch("/api/history-fast", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address: opponentAddress,
                match: {
                  opponent: address,
                  player: opponentAddress,
                  playerMove: isCreator ? data.joinerMove : data.creatorMove,
                  opponentMove: isCreator ? data.creatorMove : data.joinerMove,
                  result: opponentResult,
                  timestamp: new Date().toISOString(),
                },
              }),
            }),
          ]);
        }
        setIsSaving(false);
        setGameData(data);
        setOpponentLeft(!!data.playerLeft && data.playerLeft !== address);

        // Check if this specific match is published (without timestamp)
        const currentMatchKey = `${data.roomId}_${data.creatorMove}_${data.joinerMove}`;
        const published = sessionStorage.getItem(`published_${currentMatchKey}`) === "true";
        setIsMatchPublished(published);
      }

      if (data.rematchRequested && data.rematchRequested !== address) {
        if (!opponentRequestedRematch && !toastShownRef.current) {
          setOpponentRequestedRematch(true);
          toastShownRef.current = true;
          toast.custom(
            (t: { id: string }) => (
              <div
                onClick={() => toast.dismiss(t.id)}
                className="bg-base-100 border border-success/50 rounded-lg p-4 shadow-lg cursor-pointer"
              >
                <p className="text-success font-semibold mb-2">Opponent wants to play again!</p>
                <div className="w-full bg-base-300 rounded-full h-1 overflow-hidden">
                  <div className="bg-success h-full animate-pulse" style={{ width: "100%" }}></div>
                </div>
              </div>
            ),
            { duration: 5000 },
          );
        }
      }

      if (data.playerLeft && data.playerLeft !== address && !leftToastShownRef.current) {
        leftToastShownRef.current = true;
        toast.custom(
          (t: { id: string }) => (
            <div
              onClick={() => toast.dismiss(t.id)}
              className="bg-base-100 border border-error/50 rounded-lg p-4 shadow-lg cursor-pointer"
            >
              <p className="text-error font-semibold mb-2">Opponent left the game</p>
              <p className="text-sm text-base-content/60">You can still publish the match if finished</p>
              <div className="w-full bg-base-300 rounded-full h-1 overflow-hidden">
                <div className="bg-error h-full animate-pulse" style={{ width: "100%" }}></div>
              </div>
            </div>
          ),
          { duration: 4000 },
        );
        // Only auto-navigate if game isn't finished
        if (data.status !== "finished") {
          setTimeout(() => handleNavigation("/play/multiplayer"), 3000);
        }
      }
    } catch (error) {
      console.error("Error polling status:", error);
      setErrorCount(prev => prev + 1);
    }
  };

  const submitMove = async (move: Move) => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/room/submit-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          player: address,
          move,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedMove(move);
        setGameStatus("revealing");
      }
    } catch (error) {
      console.error("Error submitting move:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRoom = async () => {
    try {
      await fetch("/api/room/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, creator: address }),
      });
      toast.success("Room cancelled");
      router.push("/play/multiplayer");
    } catch (error) {
      console.error("Error cancelling room:", error);
      toast.error("Failed to cancel room");
    }
  };

  const requestRematch = async () => {
    if (opponentRequestedRematch) {
      await acceptRematch();
      return;
    }
    try {
      await fetch("/api/room/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: address, action: "request" }),
      });
      setRematchRequested(true);
      toast.success("Rematch requested!", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #10b981",
        },
      });
    } catch (error) {
      console.error("Error requesting rematch:", error);
    }
  };

  const acceptRematch = async () => {
    try {
      await fetch("/api/room/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: address, action: "accept" }),
      });
      setSelectedMove(null);
      setOpponentMove(null);
      setResult(null);
      setRematchRequested(false);
      setOpponentRequestedRematch(false);
      toastShownRef.current = false;
      leftToastShownRef.current = false;
      toast.success("Rematch accepted!", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #10b981",
        },
      });
    } catch (error) {
      console.error("Error accepting rematch:", error);
    }
  };

  const leaveRoom = async () => {
    try {
      await fetch("/api/room/rematch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, player: address, action: "leave" }),
      });
      router.push("/play/multiplayer");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const publishMatch = async () => {
    if (!gameData || !address) {
      console.log("Missing gameData or address:", { gameData: !!gameData, address: !!address });
      return;
    }
    setIsPublishing(true);
    try {
      const isCreator = gameData.creator === address;
      const myResult = isCreator ? gameData.creatorResult : gameData.joinerResult;
      const winner =
        myResult === "win"
          ? address
          : myResult === "lose"
            ? isCreator
              ? gameData.joiner
              : gameData.creator
            : "0x0000000000000000000000000000000000000000";

      const matchKey = `${roomId}_${gameData.creatorMove}_${gameData.joinerMove}_${Date.now()}`;
      const baseMatchKey = `${roomId}_${gameData.creatorMove}_${gameData.joinerMove}`;

      // Generate Divvi referral tag
      const referralTag = await getDivviReferralTag(address);

      const tx = await publishMatchContract({
        functionName: "publishMatch",
        args: [roomId, winner, gameData.creatorMove, gameData.joinerMove],
        dataSuffix: referralTag ? referralTag : undefined,
      });

      // Submit referral to Divvi
      if (tx && referralTag && chainId) {
        await submitDivviReferral(tx, chainId);
      }

      // Store tx hash to match history with unique match key
      if (tx && chainId) {
        await fetch("/api/store-blockchain-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            matchKey,
            txHash: tx,
            chainId: chainId.toString(),
          }),
        });
        sessionStorage.setItem(`published_${baseMatchKey}`, "true");
        setIsMatchPublished(true);
      }

      toast.success("Match saved permanently! Anyone can verify this result.");
      setShowPublishModal(false);
    } catch (error: any) {
      console.error("Error publishing match:", error);
      if (error.message?.includes("User rejected") || error.message?.includes("User denied")) {
        toast.error("Publish match was cancelled", {
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-error)",
          },
        });
      } else {
        toast.error("Failed to publish match", {
          style: {
            background: "var(--color-base-100)",
            color: "var(--color-base-content)",
            border: "1px solid var(--color-error)",
          },
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="p-6 pt-12 pb-24 flex items-center justify-center min-h-screen">
        <div className="bg-card/50 border border-border rounded-xl p-8 text-center max-w-md w-full">
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </div>
      </div>
    );
  }

  if (errorCount > 10) {
    return (
      <div className="p-6 pt-12 pb-24">
        <div className="bg-card/50 border border-border rounded-xl p-6 text-center">
          <p className="text-lg text-error mb-4">Room connection lost</p>
          <p className="text-sm text-base-content/60 mb-6">
            The room may have expired or the server connection was interrupted.
          </p>
          <button onClick={() => router.push("/play/multiplayer")} className="btn btn-primary w-full">
            Back to Play
          </button>
        </div>
      </div>
    );
  }

  if (gameStatus === "waiting") {
    return (
      <div className="p-6 pt-12 pb-24">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <LoginButton size="sm" />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">Waiting for Opponent...</h1>
        <div className="bg-card/50 border border-border rounded-xl p-6 text-center mb-4">
          <p className="text-lg font-mono mb-4">Room Code: {roomId}</p>
          <p className="text-base-content/60">Share this code with your opponent</p>
        </div>
        <button onClick={cancelRoom} className="btn btn-error w-full">
          Cancel Room
        </button>
      </div>
    );
  }

  if ((gameStatus === "ready" || gameStatus === "playing") && !selectedMove) {
    return (
      <div className="px-4 py-4 min-h-screen flex flex-col">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <LoginButton size="sm" />
          </div>
        )}
        <h1
          className="font-bold"
          style={{
            fontSize: "calc(clamp(1.25rem, 4vw, 1.875rem) * var(--font-size-override, 1))",
            marginBottom: "clamp(1rem, 2vh, 1.5rem)",
          }}
        >
          Choose Your Move
        </h1>
        {!isFreeMode && (
          <p
            className="text-center text-base-content/60"
            style={{
              fontSize: "calc(clamp(0.875rem, 2.5vw, 1rem) * var(--font-size-override, 1))",
              marginBottom: "clamp(1rem, 2vh, 1.5rem)",
            }}
          >
            Bet: {betAmount} CELO
          </p>
        )}

        <div
          className="flex flex-col"
          style={{ gap: "clamp(0.75rem, 2vh, 1.5rem)", marginTop: "clamp(1rem, 2vh, 2rem)" }}
        >
          {moves.map(move => (
            <button
              key={move}
              onClick={() => submitMove(move)}
              disabled={isSubmitting}
              className="w-full bg-card/50 border border-border rounded-xl hover:border-primary/50 transition-all duration-200 disabled:opacity-50"
              style={{ padding: "clamp(1rem, 3vh, 2rem)" }}
            >
              <p
                className="font-semibold capitalize"
                style={{ fontSize: "calc(clamp(1rem, 3vw, 1.5rem) * var(--font-size-override, 1))" }}
              >
                {move}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameStatus === "revealing" || (selectedMove && !result)) {
    return (
      <div className="p-6 pt-12 pb-24">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <LoginButton size="sm" />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">Waiting for Reveal...</h1>
        <div className="bg-card/50 border border-border rounded-xl p-6 text-center">
          <p className="text-lg mb-4">
            Your move: <span className="font-bold uppercase">{selectedMove}</span>
          </p>
          <p className="text-base-content/60">Waiting for opponent move...</p>
        </div>
      </div>
    );
  }

  if (gameStatus === "finished" && result) {
    const isCreator = creatorAddress === address;
    const myName = isCreator ? creatorName : joinerName;
    const opponentName = isCreator ? joinerName : creatorName;
    const opponentPlatform = isCreator ? joinerPlatform : creatorPlatform;
    const hasResolvedName = !opponentName.includes("0x") || !opponentName.includes("...");

    return (
      <div className="p-6 pt-12 pb-24">
        {!isMiniApp && (
          <div className="flex justify-end mb-4 lg:hidden">
            <LoginButton size="sm" />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">Game Over</h1>
        <div className="bg-card/50 border border-border rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-xs text-base-content/60 mb-1">{myName}</p>
              <p className="text-2xl font-bold capitalize">{selectedMove}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-base-content/60 mb-1 flex items-center justify-center gap-1">
                {opponentName}
                {!hasResolvedName && opponentPlatform && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                      opponentPlatform === "minipay" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                    }`}
                  >
                    {opponentPlatform === "minipay" ? "MINIPAY" : "BASE-APP"}
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold capitalize">{opponentMove}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p
              className={`text-3xl font-bold ${
                result === "win" ? "text-success" : result === "lose" ? "text-error" : "text-warning"
              }`}
            >
              {result === "win" ? "You Win!" : result === "lose" ? "You Lose!" : "Tie!"}
            </p>
            {opponentLeft && (
              <p className="text-sm text-error mt-2 flex items-center justify-center gap-2">
                <span>⚠️</span>
                Opponent disconnected
              </p>
            )}
            {isSaving && (
              <p className="text-sm text-primary mt-2 flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                Saving to history...
              </p>
            )}
          </div>

          {isFreeMode && (
            <div className="space-y-3">
              {opponentRequestedRematch && !opponentLeft ? (
                <>
                  <button onClick={acceptRematch} disabled={isSaving} className="btn btn-success w-full">
                    Accept Rematch
                  </button>
                  <button
                    onClick={() => {
                      console.log("Publish button clicked, gameData:", gameData);
                      setShowPublishModal(true);
                    }}
                    disabled={isSaving || isMatchPublished}
                    className="btn btn-outline w-full"
                  >
                    {isMatchPublished ? "Match Published" : "Publish Latest Match"}
                  </button>
                  <button onClick={leaveRoom} disabled={isSaving} className="btn btn-error w-full">
                    Leave Room
                  </button>
                </>
              ) : (
                <>
                  {!opponentLeft && (
                    <button
                      onClick={requestRematch}
                      disabled={rematchRequested || isSaving}
                      className="btn btn-primary w-full"
                    >
                      {rematchRequested ? "Waiting for opponent..." : "Play Again"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      console.log("Publish button clicked, gameData:", gameData);
                      setShowPublishModal(true);
                    }}
                    disabled={isSaving || isMatchPublished}
                    className="btn btn-outline w-full"
                  >
                    {isMatchPublished ? "Match Published" : "Publish Latest Match"}
                  </button>
                  <button onClick={leaveRoom} disabled={isSaving} className="btn btn-error w-full">
                    Back to Play
                  </button>
                </>
              )}
            </div>
          )}

          {!isFreeMode && (
            <button onClick={() => handleNavigation("/play")} disabled={isSaving} className="btn btn-primary w-full">
              Back to Play
            </button>
          )}
        </div>

        {showPublishModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 border border-primary/30 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-primary">Save Match Forever?</h3>
              <p className="text-base-content/80 mb-6">
                You will be asked to confirm saving this match result permanently. This only requires a small network
                fee (less than $0.01) and will record the result where anyone can verify it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="btn btn-ghost flex-1"
                  disabled={isPublishing}
                >
                  Cancel
                </button>
                <button onClick={publishMatch} className="btn btn-primary flex-1" disabled={isPublishing}>
                  {isPublishing ? "Publishing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 border border-primary/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-primary">Save Match Forever?</h3>
            <p className="text-base-content/80 mb-6">
              You will be asked to confirm saving this match result permanently. This only requires a small network fee
              (less than $0.01) and will record the result where anyone can verify it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="btn btn-ghost flex-1"
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button onClick={publishMatch} className="btn btn-primary flex-1" disabled={isPublishing}>
                {isPublishing ? "Publishing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 border border-warning/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-warning">Leave Game?</h3>
            <p className="text-base-content/80 mb-6">
              You have an active game. Leaving will forfeit the match. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="btn btn-ghost flex-1">
                Stay
              </button>
              <button onClick={confirmExit} className="btn btn-warning flex-1">
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
