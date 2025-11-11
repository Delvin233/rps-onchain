"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowUp, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useAccount } from "wagmi";
import { BalanceDisplay } from "~~/components/BalanceDisplay";
import { MatchRecord, getLocalMatches } from "~~/lib/pinataStorage";

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConnected) {
      const localMatches = getLocalMatches();
      const userMatches = localMatches.filter(
        match => match.players?.creator === address || match.players?.joiner === address || match.player === address,
      );
      setMatches(userMatches);
    }
  }, [address, isConnected]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrolled = containerRef.current.scrollTop;
        setShowScrollTop(scrolled > 800);
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-glow-primary mb-3 animate-glow">Match History</h1>
          </div>
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
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-base-200 p-6 pt-12 pb-24 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-glow-primary">Match History</h1>
        <BalanceDisplay address={address} format="full" />
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content/60 mb-4">No matches found</p>
          <a href="/play" className="text-primary hover:text-primary/80 text-sm">
            Play your first game →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match, index) => {
            const isAiMatch = match.opponent === "AI";

            if (isAiMatch) {
              return (
                <div key={index} className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 h-fit">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">vs AI</p>
                      <p className="text-xs text-base-content/60">
                        {new Date(match.timestamp || Date.now()).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-base-content/60">Free Play</p>
                      <p
                        className={`text-sm font-semibold ${match.result === "win" ? "text-success" : match.result === "tie" ? "text-warning" : "text-error"}`}
                      >
                        {match.result === "win" ? "WIN" : match.result === "tie" ? "TIE" : "LOSS"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-base-200 p-3 rounded-lg text-sm">
                    <span className="font-bold uppercase">{match.playerMove}</span> vs{" "}
                    <span className="font-bold uppercase">{match.opponentMove}</span>
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

              return (
                <div key={index} className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 h-fit">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        vs {(isCreator ? match.players?.joiner : match.players?.creator)?.slice(0, 6)}...
                        {(isCreator ? match.players?.joiner : match.players?.creator)?.slice(-4)}
                      </p>
                      <p className="text-xs text-base-content/60">Room: {match.roomId}</p>
                      <p className="text-xs text-base-content/60">
                        {new Date(games[0]?.timestamp || Date.now()).toLocaleString()}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {games.length} game{games.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-base-content/60">
                        {match.betAmount === "0" ? "Free" : `${match.betAmount} CELO`}
                      </p>
                      {match.txHash && (
                        <a
                          href={`https://celoscan.io/tx/${match.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 justify-end mt-1"
                        >
                          <ExternalLink size={12} /> Tx
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {displayGames.map((game: any, gIndex: number) => {
                      const myMove = isCreator ? game.creatorMove : game.joinerMove;
                      const oppMove = isCreator ? game.joinerMove : game.creatorMove;
                      const result = game.winner === address ? "win" : game.winner === "tie" ? "tie" : "lose";
                      return (
                        <div
                          key={gIndex}
                          className="bg-base-200 p-3 rounded-lg text-sm flex justify-between items-center"
                        >
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
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 bg-primary hover:bg-primary/80 text-primary-content rounded-full p-3 shadow-lg transition-all duration-200 z-50"
          style={{ maxWidth: "448px" }}
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
