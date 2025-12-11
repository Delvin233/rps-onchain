"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ChevronDown, ChevronUp, ExternalLink, Eye, RefreshCw, Shield, Upload } from "lucide-react";
import { FaLightbulb } from "react-icons/fa6";
import { DetailedMatchView } from "~~/components/DetailedMatchView";
import { LoginButton } from "~~/components/LoginButton";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";
import { useIPFSSync } from "~~/hooks/useIPFSSync";
import { MatchRecord, getLocalMatches } from "~~/lib/pinataStorage";
import { AIMatch } from "~~/types/aiMatch";

export default function HistoryPage() {
  const { address, isConnected, isConnecting } = useConnectedAddress();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [aiMatches, setAiMatches] = useState<any[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [expandedAIMatches, setExpandedAIMatches] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blockchainMatches, setBlockchainMatches] = useState<Record<string, any>>({});
  const [showOnChainModal, setShowOnChainModal] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { syncToIPFS, isSyncing } = useIPFSSync();
  const [displayCount, setDisplayCount] = useState(50);
  const [showHint, setShowHint] = useState(true);
  const [showAIMatches, setShowAIMatches] = useState(false);
  const [matchTypeFilter, setMatchTypeFilter] = useState<"all" | "multiplayer" | "ai">("all");
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<AIMatch | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchMatches();
      fetchAIMatches();
      fetchBlockchainProofs();
      // Check if user has seen the hint before
      const hasSeenHint = localStorage.getItem("opponent_intel_hint_seen");
      if (hasSeenHint) {
        setShowHint(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem("opponent_intel_hint_seen", "true");
  };

  const fetchBlockchainProofs = async () => {
    try {
      const response = await fetch(`/api/store-blockchain-proof?address=${address}`);
      const data = await response.json();
      setBlockchainMatches(data.proofs || {});
    } catch (error) {
      console.error("Error fetching blockchain proofs:", error);
    }
  };

  const fetchOnChainData = async (roomId: string, chainId: string) => {
    try {
      const response = await fetch(`/api/blockchain-match?roomId=${roomId}&chainId=${chainId}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching on-chain data:", error);
      return null;
    }
  };

  const fetchAIMatches = async () => {
    try {
      const response = await fetch(`/api/ai-match/history?playerId=${address}&limit=100`);
      if (response.ok) {
        const { matches: aiMatchHistory } = await response.json();
        setAiMatches(aiMatchHistory || []);
      } else {
        console.error("Failed to fetch AI matches:", response.statusText);
        setAiMatches([]);
      }
    } catch (error) {
      console.error("Error fetching AI matches:", error);
      setAiMatches([]);
    }
  };

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      // 1. Get LocalStorage matches (instant)
      const localMatches = getLocalMatches();

      // 2. Fetch from Redis + IPFS (via API)
      const response = await fetch(`/api/history?address=${address}`);
      const { matches: serverMatches } = await response.json();

      // 3. Merge all sources and deduplicate
      const allMatches = [...localMatches, ...serverMatches];
      const uniqueMatches = Array.from(
        new Map(
          allMatches.map(m => {
            // Create unique key based on match type
            let key: string;
            if (m.opponent === "AI") {
              // AI match: timestamp + player + moves (if available)
              key = `ai-${m.timestamp}-${m.player}-${m.playerMove || "none"}-${m.opponentMove || "none"}`;
            } else if (m.roomId && m.games) {
              // Multiplayer with games array: roomId + game count
              key = `room-${m.roomId}-${m.games.length}`;
            } else {
              // Single multiplayer game: roomId + timestamp + moves
              const ts = typeof m.result === "object" ? m.result.timestamp : m.timestamp || Date.now();
              const moves = m.moves ? `${m.moves.creatorMove}-${m.moves.joinerMove}` : "";
              key = `match-${m.roomId}-${ts}-${moves}`;
            }
            return [key, m];
          }),
        ).values(),
      );

      // 4. Filter user matches and sort
      const userMatches = uniqueMatches
        .filter(
          match => match.players?.creator === address || match.players?.joiner === address || match.player === address,
        )
        .sort((a, b) => {
          const getTime = (match: any) => {
            const ts =
              typeof match.result === "object"
                ? match.result.timestamp
                : match.timestamp || match.games?.[0]?.timestamp || 0;
            return typeof ts === "string" ? new Date(ts).getTime() : ts;
          };
          return getTime(b) - getTime(a);
        });

      setMatches(userMatches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      // Fallback to localStorage only
      const localMatches = getLocalMatches();
      const userMatches = localMatches.filter(
        match => match.players?.creator === address || match.players?.joiner === address || match.player === address,
      );
      setMatches(userMatches);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrolled = containerRef.current.scrollTop;
        setShowScrollTop(scrolled > 150);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show loading while wagmi is still connecting/hydrating
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 animate-glow" style={{ color: "var(--color-primary)" }}>
              Opponent Intel
            </h1>
          </div>
          {isMiniPay ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <LoginButton />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-base-200 pt-4 lg:pt-0 pb-16 lg:pb-0 overflow-y-auto">
      <h1
        className="text-lg sm:text-xl md:text-2xl font-bold mb-4 break-words"
        style={{ color: "var(--color-primary)" }}
      >
        Opponent Intel
      </h1>

      {/* Strategic Hint */}
      {showHint && matches.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4 flex items-start gap-3">
          <FaLightbulb className="text-primary flex-shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <p className="text-sm text-base-content">Study your opponent&apos;s patterns to predict their next move!</p>
          </div>
          <button onClick={dismissHint} className="btn btn-xs btn-ghost flex-shrink-0">
            Got it
          </button>
        </div>
      )}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/80">Show:</span>
              <select
                value={matchTypeFilter}
                onChange={e => setMatchTypeFilter(e.target.value as "all" | "multiplayer" | "ai")}
                className="select select-sm select-bordered"
              >
                <option value="all">All Matches</option>
                <option value="multiplayer">Multiplayer Only</option>
                <option value="ai">AI Matches Only</option>
              </select>
            </div>

            {/* Match Type Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-base-content/60">Types:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary rounded-sm"></div>
                <span className="badge badge-primary badge-xs">🤖 AI MATCH</span>
                <span className="text-base-content/60">Best of 3</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-warning rounded-sm"></div>
                <span className="badge badge-warning badge-xs">🤖 AI MATCH</span>
                <span className="text-base-content/60">Legacy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-secondary rounded-sm"></div>
                <span className="badge badge-secondary badge-xs">👥 MULTIPLAYER</span>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAIMatches}
              onChange={e => setShowAIMatches(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary"
            />
            <span className="text-sm text-base-content/80">Include legacy AI matches</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchMatches();
              fetchAIMatches();
              fetchBlockchainProofs();
            }}
            className="btn btn-sm btn-ghost"
          >
            <RefreshCw size={18} />
          </button>
          <button onClick={() => syncToIPFS(address!)} disabled={isSyncing} className="btn btn-sm btn-outline">
            {isSyncing ? <span className="loading loading-spinner loading-sm"></span> : <Upload size={16} />}
            Sync IPFS
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 mt-4">Loading match history...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content/60 mb-4">No matches found</p>
          <Link href="/play" className="text-primary hover:text-primary/80">
            Play your first game →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              // Combine and filter matches based on type filter
              let allMatchesToShow: any[] = [];

              if (matchTypeFilter === "all" || matchTypeFilter === "multiplayer") {
                const multiplayerMatches = matches.filter(match => {
                  const isAiMatch = match.opponent === "AI";
                  return showAIMatches || !isAiMatch;
                });
                allMatchesToShow = [...allMatchesToShow, ...multiplayerMatches];
              }

              if (matchTypeFilter === "all" || matchTypeFilter === "ai") {
                // Add new AI matches with proper formatting
                const formattedAIMatches = aiMatches.map(aiMatch => ({
                  ...aiMatch,
                  matchType: "ai-best-of-three",
                  timestamp: new Date(aiMatch.completedAt || aiMatch.startedAt).getTime(),
                }));
                allMatchesToShow = [...allMatchesToShow, ...formattedAIMatches];
              }

              // Sort by timestamp (newest first)
              allMatchesToShow.sort((a, b) => {
                const getTime = (match: any) => {
                  if (match.matchType === "ai-best-of-three") {
                    return new Date(match.completedAt || match.startedAt).getTime();
                  }
                  const ts =
                    typeof match.result === "object"
                      ? match.result.timestamp
                      : match.timestamp || match.games?.[0]?.timestamp || 0;
                  return typeof ts === "string" ? new Date(ts).getTime() : ts;
                };
                return getTime(b) - getTime(a);
              });

              return allMatchesToShow.slice(0, displayCount).map((match, index) => {
                // New AI best-of-three matches
                if (match.matchType === "ai-best-of-three") {
                  const isExpanded = expandedAIMatches.has(match.id);
                  const matchDuration = match.completedAt
                    ? Math.round(
                        (new Date(match.completedAt).getTime() - new Date(match.startedAt).getTime()) / 1000 / 60,
                      )
                    : null;

                  return (
                    <div
                      key={`ai-${match.id}`}
                      className="rounded-xl p-4 h-fit bg-card/50 border border-border border-l-4 border-l-primary"
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary badge-sm font-semibold">🤖 AI MATCH</span>
                            <span className="badge badge-info badge-sm">Best of 3</span>
                          </div>
                          <span className="badge badge-primary badge-sm font-bold">
                            {match.playerScore}-{match.aiScore}
                          </span>
                        </div>
                        <div className="text-base-content/60 opacity-80 text-sm space-y-1">
                          <p>{new Date(match.completedAt || match.startedAt).toLocaleString()}</p>
                          <div className="flex items-center gap-3 text-xs">
                            {matchDuration && <span>⏱️ Duration: {matchDuration}m</span>}
                            <span>🎯 {match.rounds.length}/3 rounds</span>
                            <span
                              className={`font-semibold ${
                                match.winner === "player"
                                  ? "text-success"
                                  : match.winner === "ai"
                                    ? "text-error"
                                    : "text-warning"
                              }`}
                            >
                              {match.winner === "player"
                                ? "✅ Victory"
                                : match.winner === "ai"
                                  ? "❌ Defeat"
                                  : "🤝 Tie"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Match Summary */}
                      <div className="bg-base-200 p-3 rounded-lg mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            {match.rounds.length} round{match.rounds.length !== 1 ? "s" : ""} played
                          </span>
                          <span
                            className={`font-semibold ${
                              match.winner === "player"
                                ? "text-success"
                                : match.winner === "ai"
                                  ? "text-error"
                                  : "text-warning"
                            }`}
                          >
                            [{match.winner === "player" ? "WON" : match.winner === "ai" ? "LOST" : "TIE"}]
                          </span>
                        </div>
                      </div>

                      {/* Round Details */}
                      {match.rounds.length > 0 && (
                        <div className="space-y-2">
                          {(isExpanded ? match.rounds : match.rounds.slice(0, 2)).map((round: any, rIndex: number) => (
                            <div key={rIndex} className="bg-base-100 p-2 rounded text-sm">
                              <div className="flex justify-between items-center">
                                <span>
                                  Round {round.roundNumber}:{" "}
                                  <span className="font-bold uppercase">{round.playerMove}</span> vs{" "}
                                  <span className="font-bold uppercase">{round.aiMove}</span>
                                </span>
                                <span
                                  className={`text-xs font-semibold ${
                                    round.result.winner === "player"
                                      ? "text-success"
                                      : round.result.winner === "ai"
                                        ? "text-error"
                                        : "text-warning"
                                  }`}
                                >
                                  {round.result.winner === "player" ? "W" : round.result.winner === "ai" ? "L" : "T"}
                                </span>
                              </div>
                            </div>
                          ))}

                          <div className="flex gap-2">
                            {match.rounds.length > 2 && (
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedAIMatches);
                                  if (isExpanded) {
                                    newExpanded.delete(match.id);
                                  } else {
                                    newExpanded.add(match.id);
                                  }
                                  setExpandedAIMatches(newExpanded);
                                }}
                                className="btn btn-sm btn-ghost flex-1"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {isExpanded
                                  ? "Show Less"
                                  : `Show ${match.rounds.length - 2} More Round${match.rounds.length - 2 !== 1 ? "s" : ""}`}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedMatchForDetails(match)}
                              className="btn btn-sm btn-primary gap-1"
                            >
                              <Eye size={14} />
                              Details
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Legacy AI matches
                const isAiMatch = match.opponent === "AI";
                if (isAiMatch) {
                  return (
                    <div
                      key={index}
                      className="rounded-xl p-4 h-fit bg-card/50 border border-border border-l-4 border-l-warning"
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-warning badge-sm font-semibold">🤖 AI MATCH</span>
                            <span className="badge badge-ghost badge-sm">Legacy • Single Round</span>
                          </div>
                        </div>
                        <div className="text-base-content/60 opacity-80 text-sm space-y-1">
                          <p>{new Date(match.timestamp || Date.now()).toLocaleString()}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span>🎯 Single round</span>
                            <span
                              className={`font-semibold ${
                                match.result === "win"
                                  ? "text-success"
                                  : match.result === "tie"
                                    ? "text-warning"
                                    : "text-error"
                              }`}
                            >
                              {match.result === "win" ? "✅ Victory" : match.result === "tie" ? "🤝 Tie" : "❌ Defeat"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-base-200 p-3 rounded-lg flex justify-between items-center">
                        <span>
                          {match.playerMove && match.opponentMove ? (
                            <>
                              <span className="font-bold uppercase">{match.playerMove}</span> vs{" "}
                              <span className="font-bold uppercase">{match.opponentMove}</span>
                            </>
                          ) : (
                            <span className="text-base-content/60">Move data unavailable</span>
                          )}
                        </span>
                        <span
                          className={`font-semibold ${match.result === "win" ? "text-success" : match.result === "tie" ? "text-warning" : "text-error"}`}
                        >
                          [{match.result === "win" ? "WIN" : match.result === "tie" ? "TIE" : "LOSS"}]
                        </span>
                      </div>
                      {match.ipfsHash && (
                        <a
                          href={`https://ipfs.io/ipfs/${match.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-ghost w-full mt-3"
                        >
                          <ExternalLink size={14} /> View on IPFS
                        </a>
                      )}
                    </div>
                  );
                }

                // Multiplayer match (new format with games array OR old format)
                if (match.players) {
                  const isCreator = address === match.players?.creator;
                  const opponentAddress = isCreator ? match.players?.joiner : match.players?.creator;
                  const opponentName = match.playerNames
                    ? isCreator
                      ? match.playerNames.joiner
                      : match.playerNames.creator
                    : null;
                  const displayName = opponentName || `${opponentAddress?.slice(0, 6)}...${opponentAddress?.slice(-4)}`;
                  const games = match.games || [
                    {
                      creatorMove: match.moves?.creatorMove || "",
                      joinerMove: match.moves?.joinerMove || "",
                      winner: typeof match.result === "object" ? match.result.winner : "",
                      timestamp: typeof match.result === "object" ? match.result.timestamp : Date.now(),
                      ipfsHash: match.ipfsHash,
                    },
                  ];
                  const isExpanded = expandedRooms.has(match.roomId || "");
                  const showExpand = games.length > 5;
                  const displayGames = showExpand && !isExpanded ? games.slice(0, 5) : games;
                  const hasBlockchainProof = blockchainMatches[match.roomId || ""];

                  return (
                    <div
                      key={index}
                      className="bg-card/50 rounded-xl p-4 h-fit border border-border border-l-4 border-l-secondary"
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="badge badge-secondary badge-sm font-semibold">👥 MULTIPLAYER</span>
                            <span className="font-semibold break-words">vs {displayName}</span>
                            <span className="text-xs text-base-content/60">Room: {match.roomId}</span>
                          </div>
                          {hasBlockchainProof && (
                            <button
                              onClick={() => setShowOnChainModal(match.roomId || null)}
                              className="tooltip tooltip-top"
                              data-tip="Verified on blockchain"
                            >
                              <Shield className="text-success" size={18} />
                            </button>
                          )}
                        </div>
                        <div className="text-base-content/60 opacity-80 text-sm space-y-1">
                          <p>{new Date(games[0]?.timestamp || Date.now()).toLocaleString()}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span>
                              🎯 {games.length} game{games.length > 1 ? "s" : ""}
                            </span>
                            {hasBlockchainProof && (
                              <span className="text-success font-semibold">🔗 On-chain verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {displayGames.map((game: any, gIndex: number) => {
                          const myMove = isCreator ? game.creatorMove : game.joinerMove;
                          const oppMove = isCreator ? game.joinerMove : game.creatorMove;
                          const isTie = myMove === oppMove;
                          const result = isTie ? "tie" : game.winner === address ? "win" : "lose";
                          return (
                            <div key={gIndex} className="bg-base-200 p-3 rounded-lg flex justify-between items-center">
                              <span>
                                <span className="font-bold uppercase">{myMove}</span> vs{" "}
                                <span className="font-bold uppercase">{oppMove}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-semibold ${result === "win" ? "text-success" : result === "tie" ? "text-warning" : "text-error"}`}
                                >
                                  [{result.toUpperCase()}]
                                </span>
                                {game.ipfsHash && (
                                  <a
                                    href={`https://ipfs.io/ipfs/${game.ipfsHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {showExpand && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedRooms);
                            if (isExpanded) {
                              newExpanded.delete(match.roomId || "");
                            } else {
                              newExpanded.add(match.roomId || "");
                            }
                            setExpandedRooms(newExpanded);
                          }}
                          className="btn btn-sm btn-ghost w-full mt-3"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {isExpanded ? "Show Less" : `Show ${games.length - 5} More`}
                        </button>
                      )}
                    </div>
                  );
                }

                return null;
              });
            })()}
          </div>
          {(() => {
            // Calculate total matches based on filter
            let totalMatches = 0;
            if (matchTypeFilter === "all") {
              const legacyAIMatches = matches.filter(match => match.opponent === "AI");
              const multiplayerMatches = matches.filter(match => match.opponent !== "AI");
              totalMatches =
                (showAIMatches ? legacyAIMatches.length : 0) + multiplayerMatches.length + aiMatches.length;
            } else if (matchTypeFilter === "multiplayer") {
              const legacyAIMatches = matches.filter(match => match.opponent === "AI");
              const multiplayerMatches = matches.filter(match => match.opponent !== "AI");
              totalMatches = (showAIMatches ? legacyAIMatches.length : 0) + multiplayerMatches.length;
            } else if (matchTypeFilter === "ai") {
              totalMatches = aiMatches.length;
            }

            return (
              displayCount < totalMatches && (
                <div className="text-center" style={{ marginTop: "calc(1.5rem * var(--spacing-scale, 1))" }}>
                  <button
                    onClick={() => setDisplayCount(prev => prev + 50)}
                    className="btn btn-outline"
                    style={{
                      borderColor: "var(--color-primary)",
                      color: "var(--color-primary)",
                      fontSize: "calc(1rem * var(--font-size-override, 1))",
                      padding: "calc(0.75rem * var(--spacing-scale, 1)) calc(1.5rem * var(--spacing-scale, 1))",
                    }}
                  >
                    Load More ({totalMatches - displayCount} remaining)
                  </button>
                </div>
              )
            );
          })()}
        </>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 bg-primary hover:bg-primary/80 text-primary-content rounded-full p-4 shadow-lg shadow-primary/50 transition-all duration-200 animate-bounce z-50"
        >
          <ArrowUp size={24} />
        </button>
      )}

      {showOnChainModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="text-success" size={24} />
              On-Chain Verified Match
            </h3>
            <OnChainMatchModal
              roomId={showOnChainModal}
              chainId={blockchainMatches[showOnChainModal]?.chainId}
              txHash={blockchainMatches[showOnChainModal]?.txHash}
              onClose={() => setShowOnChainModal(null)}
              fetchOnChainData={fetchOnChainData}
            />
          </div>
        </div>
      )}

      {/* Detailed Match View Modal */}
      <DetailedMatchView
        match={selectedMatchForDetails}
        onClose={() => setSelectedMatchForDetails(null)}
        isVisible={!!selectedMatchForDetails}
      />
    </div>
  );
}

function OnChainMatchModal({
  roomId,
  chainId,
  txHash,
  onClose,
  fetchOnChainData,
}: {
  roomId: string;
  chainId: string;
  txHash: string;
  onClose: () => void;
  fetchOnChainData: (roomId: string, chainId: string) => Promise<any>;
}) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerNames, setPlayerNames] = useState<{ player1?: string; player2?: string }>({});

  useEffect(() => {
    const load = async () => {
      const result = await fetchOnChainData(roomId, chainId);
      if (result) {
        setData(result);
        // Resolve names
        const [name1, name2] = await Promise.all([
          fetch(`/api/resolve-name?address=${result.players.player1}`).then(r => r.json()),
          fetch(`/api/resolve-name?address=${result.players.player2}`).then(r => r.json()),
        ]);
        setPlayerNames({ player1: name1.name, player2: name2.name });
      }
      setIsLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, chainId]);

  const explorerUrl = chainId === "42220" ? `https://celoscan.io/tx/${txHash}` : `https://basescan.org/tx/${txHash}`;

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="bg-base-200 p-4 rounded-lg">
            <p className="mb-2">
              <span className="font-semibold">Room ID:</span> {roomId}
            </p>
            <p className="mb-2 break-words">
              <span className="font-semibold">Player 1:</span>{" "}
              {playerNames.player1 || `${data.players.player1.slice(0, 8)}...${data.players.player1.slice(-4)}`}
            </p>
            <p className="break-words">
              <span className="font-semibold">Player 2:</span>{" "}
              {playerNames.player2 || `${data.players.player2.slice(0, 8)}...${data.players.player2.slice(-4)}`}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Matches:</h4>
            {data.matches.map((m: any, idx: number) => {
              const winnerName =
                m.winner === data.players.player1
                  ? playerNames.player1 || `${data.players.player1.slice(0, 6)}...`
                  : m.winner === data.players.player2
                    ? playerNames.player2 || `${data.players.player2.slice(0, 6)}...`
                    : "Tie";
              return (
                <div key={idx} className="bg-base-200 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>
                      <span className="font-bold uppercase">{m.player1Move}</span> vs{" "}
                      <span className="font-bold uppercase">{m.player2Move}</span>
                    </span>
                    <span className="font-semibold text-success">{winnerName}</span>
                  </div>
                  <p className="text-base-content/60 opacity-80 mt-1">
                    {new Date(m.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
            <ExternalLink size={16} /> View on Block Explorer
          </a>
        </div>
      ) : (
        <p className="text-center text-base-content/60">Failed to load on-chain data</p>
      )}
      <div className="modal-action">
        <button onClick={onClose} className="btn">
          Close
        </button>
      </div>
    </div>
  );
}
