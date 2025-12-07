"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Shield, Upload } from "lucide-react";
import { FaLightbulb } from "react-icons/fa6";
import { LoginButton } from "~~/components/LoginButton";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";
import { useIPFSSync } from "~~/hooks/useIPFSSync";
import { MatchRecord, getLocalMatches } from "~~/lib/pinataStorage";

interface OpponentStats {
  opponentAddress: string;
  opponentName: string;
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  lastPlayed: number;
  roomId: string;
}

export default function HistoryPage() {
  const { address, isConnected, isConnecting } = useConnectedAddress();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blockchainMatches, setBlockchainMatches] = useState<Record<string, any>>({});
  const [showOnChainModal, setShowOnChainModal] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { syncToIPFS, isSyncing } = useIPFSSync();
  const [displayCount, setDisplayCount] = useState(50);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchMatches();
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

  // Calculate opponent stats
  const calculateOpponentStats = (matches: MatchRecord[]): Map<string, OpponentStats> => {
    const statsByOpponent = new Map<string, OpponentStats>();

    matches.forEach(match => {
      if (!match.players) return;

      const isCreator = match.players.creator === address;
      const opponentAddress = isCreator ? match.players.joiner : match.players.creator;
      const opponentName = match.playerNames
        ? isCreator
          ? match.playerNames.joiner
          : match.playerNames.creator
        : null;

      const stats = statsByOpponent.get(opponentAddress) || {
        opponentAddress,
        opponentName: opponentName || `${opponentAddress?.slice(0, 6)}...${opponentAddress?.slice(-4)}`,
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        winRate: 0,
        lastPlayed: 0,
        roomId: match.roomId || "",
      };

      const games = match.games || [];
      games.forEach(game => {
        stats.totalGames++;

        const myMove = isCreator ? game.creatorMove : game.joinerMove;
        const oppMove = isCreator ? game.joinerMove : game.creatorMove;

        if (myMove === oppMove) {
          stats.ties++;
        } else if (game.winner === address) {
          stats.wins++;
        } else {
          stats.losses++;
        }

        stats.lastPlayed = Math.max(stats.lastPlayed, game.timestamp || 0);
      });

      stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;

      statsByOpponent.set(opponentAddress, stats);
    });

    return statsByOpponent;
  };

  const opponentStats = calculateOpponentStats(matches);

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
      <div className="flex flex-wrap justify-end items-center gap-3 mb-6">
        <button
          onClick={() => {
            fetchMatches();
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
            {matches.slice(0, displayCount).map((match, index) => {
              const isAiMatch = match.opponent === "AI";

              if (isAiMatch) {
                return (
                  <div key={index} className="rounded-xl p-4 h-fit bg-card/50 border border-border">
                    <div className="mb-3">
                      <p className="font-semibold mb-1">vs AI</p>
                      <p className="text-base-content/60 opacity-80">
                        {new Date(match.timestamp || Date.now()).toLocaleString()}
                      </p>
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

                // Get opponent stats
                const stats = opponentStats.get(opponentAddress || "");

                return (
                  <div key={index} className="bg-card/50 rounded-xl p-4 h-fit border border-border">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold break-words">vs {displayName}</p>
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
                      <p className="text-xs text-base-content/60 opacity-80">Room: {match.roomId}</p>

                      {/* Opponent Stats */}
                      {stats && (
                        <div className="bg-base-200 rounded-lg p-2 mt-2 space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-base-content/60">Total Games:</span>
                            <span className="font-semibold">{stats.totalGames}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-base-content/60">Record:</span>
                            <span className="font-semibold">
                              <span className="text-success">{stats.wins}W</span> /{" "}
                              <span className="text-error">{stats.losses}L</span> /{" "}
                              <span className="text-warning">{stats.ties}T</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-base-content/60">Win Rate:</span>
                            <span
                              className={`font-semibold ${
                                stats.winRate >= 60
                                  ? "text-success"
                                  : stats.winRate <= 40
                                    ? "text-error"
                                    : "text-warning"
                              }`}
                            >
                              {stats.winRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}

                      <p className="text-base-content/60 opacity-80 mt-2 text-xs">
                        Last played: {new Date(games[0]?.timestamp || Date.now()).toLocaleString()}
                      </p>
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
            })}
          </div>
          {displayCount < matches.length && (
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
                Load More ({matches.length - displayCount} remaining)
              </button>
            </div>
          )}
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
