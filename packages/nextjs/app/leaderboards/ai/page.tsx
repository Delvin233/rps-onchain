"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { LeaderboardEntry } from "~~/components/LeaderboardEntry";
import { LeaderboardSkeleton } from "~~/components/LeaderboardSkeleton";
import { LoginButton } from "~~/components/LoginButton";
import { RankBadge } from "~~/components/RankBadge";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";

interface LeaderboardEntryData {
  position: number;
  address: string;
  displayName: string;
  wins: number;
  rank: string;
}

interface PlayerRankData {
  address: string;
  displayName: string;
  wins: number;
  rank: string;
  position: number;
  nextRank: {
    name: string;
    winsNeeded: number;
  } | null;
}

export default function AILeaderboardPage() {
  const { address, isConnected, isConnecting } = useConnectedAddress();
  const [entries, setEntries] = useState<LeaderboardEntryData[]>([]);
  const [currentUser, setCurrentUser] = useState<PlayerRankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Fetch leaderboard data
  const fetchLeaderboard = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await fetch(`/api/leaderboard/ai?limit=${limit}&offset=${currentOffset}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setEntries(data.data.entries);
          setOffset(limit);
        } else {
          setEntries(prev => [...prev, ...data.data.entries]);
          setOffset(prev => prev + limit);
        }
        setHasMore(data.data.hasMore);
      } else {
        setError(data.error || "Failed to load leaderboard");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
    }
  };

  // Fetch current user rank
  const fetchUserRank = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/leaderboard/ai/player?address=${address}`);
      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.data);
      }
    } catch (err) {
      console.error("Error fetching user rank:", err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLeaderboard(true), fetchUserRank()]);
      setLoading(false);
    };

    if (isConnected) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLeaderboard(true), fetchUserRank()]);
    setRefreshing(false);
  };

  // Load more handler
  const handleLoadMore = async () => {
    await fetchLeaderboard(false);
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
              Single Player Ranks
            </h1>
            <p className="text-base-content/60">Connect your wallet to view the leaderboard</p>
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
    <div className="min-h-screen bg-base-200 pt-4 lg:pt-0 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold break-words" style={{ color: "var(--color-primary)" }}>
          Single Player Ranks
        </h1>
        <div className="flex items-center gap-2">
          <a href="/ai-ranking-system" className="btn btn-sm btn-outline gap-2" title="Learn how AI rankings work">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">How Rankings Work</span>
          </a>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-sm btn-ghost gap-2"
            aria-label="Refresh leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Current User Card */}
      {currentUser && currentUser.rank !== "Unranked" && (
        <div className="mb-6 p-4 bg-primary/10 border-2 border-primary rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="text-primary" size={32} />
              <div>
                <div className="text-sm text-base-content/70">Your Rank</div>
                <div className="flex items-center gap-2 mt-1">
                  <RankBadge rank={currentUser.rank} size="md" />
                  <span className="text-base-content/70">#{currentUser.position}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-base-content">{currentUser.wins}</div>
              <div className="text-xs text-base-content/60">wins</div>
              {currentUser.nextRank && (
                <div className="text-xs text-base-content/70 mt-1">
                  Next: {currentUser.nextRank.name} ({currentUser.nextRank.winsNeeded} wins)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unranked State */}
      {currentUser && currentUser.rank === "Unranked" && (
        <div className="mb-6 p-6 bg-base-100 rounded-lg border-2 border-base-300 text-center">
          <Trophy className="text-base-content/40 mx-auto mb-3" size={48} />
          <h3 className="text-lg font-semibold mb-2">You&apos;re Unranked</h3>
          <p className="text-base-content/60 mb-4">Win your first AI match to earn your Beginner rank!</p>
          <a href="/ai" className="btn btn-primary btn-sm">
            Play AI Match
          </a>
        </div>
      )}

      {/* Loading State */}
      {loading && <LeaderboardSkeleton count={10} />}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-error mb-4">{error}</p>
          <button onClick={handleRefresh} className="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Leaderboard List */}
      {!loading && !error && (
        <>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="text-base-content/40 mx-auto mb-3" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
              <p className="text-base-content/60 mb-4">Be the first to earn a rank by playing AI matches!</p>
              <a href="/ai" className="btn btn-primary btn-sm">
                Play AI Match
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <LeaderboardEntry
                  key={entry.address}
                  entry={entry}
                  isCurrentUser={entry.address.toLowerCase() === address?.toLowerCase()}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button onClick={handleLoadMore} className="btn btn-primary btn-sm">
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
