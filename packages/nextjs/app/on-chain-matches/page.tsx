"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Filter, Shield, X } from "lucide-react";
import { base, celo } from "viem/chains";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

interface OnChainMatch {
  roomId: string;
  chainId: number;
  chainName: string;
  player1: string;
  player2: string;
  player1Name?: string;
  player2Name?: string;
  txHash?: string;
  matches: Array<{
    winner: string;
    player1Move: string;
    player2Move: string;
    timestamp: number;
  }>;
}

export default function OnChainMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<OnChainMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<OnChainMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    chain: "all",
  });
  const celoClient = usePublicClient({ chainId: celo.id });
  const baseClient = usePublicClient({ chainId: base.id });

  useEffect(() => {
    fetchAllMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllMatches = async () => {
    setIsLoading(true);
    const allMatches: OnChainMatch[] = [];

    // Fetch published room IDs from database
    const dbResponse = await fetch("/api/store-blockchain-proof");
    const dbData = await dbResponse.json();
    const publishedRooms = new Map<string, { roomId: string; chainId: number; txHash: string }>();

    dbData.proofs?.forEach((proof: any) => {
      const key = `${proof.room_id}_${proof.chain_id}`;
      if (!publishedRooms.has(key)) {
        publishedRooms.set(key, {
          roomId: proof.room_id,
          chainId: proof.chain_id,
          txHash: proof.tx_hash,
        });
      }
    });

    // Fetch from both chains
    for (const [chainId, chainName, client] of [
      [42220, "Celo", celoClient],
      [8453, "Base", baseClient],
    ] as const) {
      try {
        const contract = deployedContracts[chainId].RPSOnline;
        const roomsForChain = Array.from(publishedRooms.values()).filter(r => r.chainId === chainId);

        for (const { roomId, txHash } of roomsForChain) {
          const [matchHistory, roomStats] = await Promise.all([
            client?.readContract({
              address: contract.address,
              abi: contract.abi,
              functionName: "getMatchHistory",
              args: [roomId],
            }),
            client?.readContract({
              address: contract.address,
              abi: contract.abi,
              functionName: "getRoomStats",
              args: [roomId],
            }),
          ]);

          if (!matchHistory || !roomStats || (matchHistory as any[]).length === 0) continue;

          const [, player1, player2] = roomStats as [bigint, string, string];

          {
            // Resolve names
            const [name1Res, name2Res] = await Promise.all([
              fetch(`/api/resolve-name?address=${player1}`).then(r => r.json()),
              fetch(`/api/resolve-name?address=${player2}`).then(r => r.json()),
            ]);

            allMatches.push({
              roomId: roomId as string,
              chainId,
              chainName,
              player1: player1 as string,
              player2: player2 as string,
              player1Name: name1Res.name,
              player2Name: name2Res.name,
              txHash,
              matches: (matchHistory as any[]).map(m => ({
                winner: m.winner,
                player1Move: m.player1Move,
                player2Move: m.player2Move,
                timestamp: Number(m.timestamp),
              })),
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching ${chainName} matches:`, error);
        // Continue to next chain
      }
    }

    // Sort by latest match timestamp
    allMatches.sort((a, b) => {
      const aTime = Math.max(...a.matches.map(m => m.timestamp));
      const bTime = Math.max(...b.matches.map(m => m.timestamp));
      return bTime - aTime;
    });

    setMatches(allMatches);
    setFilteredMatches(allMatches);
    setIsLoading(false);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, matches]);

  const applyFilters = () => {
    let filtered = [...matches];

    // Search filter (roomId, address, ENS/Basename)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.roomId.toLowerCase().includes(search) ||
          m.player1.toLowerCase().includes(search) ||
          m.player2.toLowerCase().includes(search) ||
          m.player1Name?.toLowerCase().includes(search) ||
          m.player2Name?.toLowerCase().includes(search) ||
          m.txHash?.toLowerCase().includes(search),
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromTime = new Date(filters.dateFrom).getTime() / 1000;
      filtered = filtered.filter(m => Math.max(...m.matches.map(match => match.timestamp)) >= fromTime);
    }
    if (filters.dateTo) {
      const toTime = new Date(filters.dateTo).getTime() / 1000 + 86400; // End of day
      filtered = filtered.filter(m => Math.min(...m.matches.map(match => match.timestamp)) <= toTime);
    }

    // Chain filter
    if (filters.chain !== "all") {
      filtered = filtered.filter(m => m.chainName.toLowerCase() === filters.chain);
    }

    setFilteredMatches(filtered);
  };

  const clearFilters = () => {
    setFilters({ search: "", dateFrom: "", dateTo: "", chain: "all" });
  };

  const getExplorerUrl = (chainId: number) => {
    const baseUrl = chainId === 42220 ? "https://celoscan.io" : "https://basescan.org";
    return `${baseUrl}/address/${deployedContracts[chainId as 42220 | 8453].RPSOnline.address}`;
  };

  return (
    <div className="min-h-screen bg-base-200 p-6 pt-12 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
            <ArrowLeft size={20} />
          </button>
          <Shield className="text-primary" size={32} />
          <h1 className="text-3xl font-bold text-glow-primary">On-Chain Verified Matches</h1>
        </div>
        <p className="text-base-content/60 mb-6">
          All matches published to the blockchain are permanently verified and publicly viewable.
        </p>

        {/* Filters */}
        <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-primary" />
            <h2 className="font-semibold">Filters</h2>
            {(filters.search || filters.dateFrom || filters.dateTo || filters.chain !== "all") && (
              <button onClick={clearFilters} className="btn btn-xs btn-ghost ml-auto">
                <X size={14} /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search room, address, ENS, tx hash..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="input input-bordered input-sm w-full"
            />
            <input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input input-bordered input-sm w-full"
            />
            <input
              type="date"
              placeholder="To date"
              value={filters.dateTo}
              onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
              className="input input-bordered input-sm w-full"
            />
            <select
              value={filters.chain}
              onChange={e => setFilters({ ...filters, chain: e.target.value })}
              className="select select-bordered select-sm w-full"
            >
              <option value="all">All Chains</option>
              <option value="celo">Celo</option>
              <option value="base">Base</option>
            </select>
          </div>
          <p className="text-xs text-base-content/60 mt-3">
            Showing {filteredMatches.length} of {matches.length} matches
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/60 mt-4">Loading on-chain matches...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base-content/60">
              {matches.length === 0 ? "No on-chain matches found yet." : "No matches match your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, idx) => (
              <div key={idx} className="bg-card/50 backdrop-blur border border-border rounded-xl p-4">
                <div className="flex flex-col gap-3 mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="badge badge-primary badge-sm flex-shrink-0">{match.chainName}</span>
                      <span className="text-xs text-base-content/60 truncate">Room: {match.roomId}</span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {match.txHash && (
                        <a
                          href={`${match.chainId === 42220 ? "https://celoscan.io" : "https://basescan.org"}/tx/${match.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-primary"
                        >
                          <ExternalLink size={12} /> TX
                        </a>
                      )}
                      <a
                        href={getExplorerUrl(match.chainId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-outline"
                      >
                        <ExternalLink size={12} /> Contract
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-base-200 p-2 rounded-lg">
                      <p className="text-xs text-base-content/60 mb-1">Player 1</p>
                      <p className="text-sm font-semibold truncate">
                        {match.player1Name || `${match.player1.slice(0, 8)}...${match.player1.slice(-4)}`}
                      </p>
                    </div>
                    <div className="bg-base-200 p-2 rounded-lg">
                      <p className="text-xs text-base-content/60 mb-1">Player 2</p>
                      <p className="text-sm font-semibold truncate">
                        {match.player2Name || `${match.player2.slice(0, 8)}...${match.player2.slice(-4)}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {match.matches.map((m, mIdx) => {
                    const winnerName =
                      m.winner === match.player1
                        ? match.player1Name || `${match.player1.slice(0, 6)}...`
                        : m.winner === match.player2
                          ? match.player2Name || `${match.player2.slice(0, 6)}...`
                          : "Tie";

                    return (
                      <div key={mIdx} className="bg-base-200 p-3 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold uppercase text-sm">{m.player1Move}</span>
                            <span className="text-base-content/60">vs</span>
                            <span className="font-bold uppercase text-sm">{m.player2Move}</span>
                          </div>
                          <span className="font-semibold text-success text-sm truncate">Winner: {winnerName}</span>
                        </div>
                        <p className="text-xs text-base-content/60 mt-2">
                          {new Date(m.timestamp * 1000).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
