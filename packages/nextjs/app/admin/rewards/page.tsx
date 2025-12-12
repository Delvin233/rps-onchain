"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, Copy, ExternalLink } from "lucide-react";

interface DistributionData {
  seasonId: string;
  seasonName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  distributions: {
    eligible: Array<{
      address: string;
      wins: number;
      totalGames: number;
      winRate: number;
      rank: number;
      rewardAmount: number;
    }>;
    existing: Array<{
      player_address: string;
      reward_amount: number;
      status: string;
      distributed_at?: number;
      tx_hash?: string;
    }>;
    totalPlayers: number;
    totalRewards: number;
    hasExistingDistributions: boolean;
  };
  instructions: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
}

export default function RewardsAdminPage() {
  const [data, setData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [recording, setRecording] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const fetchDistributionData = useCallback(
    async (key?: string) => {
      try {
        const authKey = key || adminKey;
        const response = await fetch("/api/rewards/distribute", {
          headers: { Authorization: `Bearer ${authKey}` },
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch distribution data:", error);
      } finally {
        setLoading(false);
      }
    },
    [adminKey],
  );

  const checkAuthentication = useCallback(
    async (key: string) => {
      try {
        const response = await fetch("/api/rewards/distribute", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (response.ok) {
          setIsAuthenticated(true);
          fetchDistributionData(key);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    },
    [fetchDistributionData],
  );

  const handleLogin = () => {
    localStorage.setItem("adminKey", adminKey);
    checkAuthentication(adminKey);
  };

  const recordDistribution = useCallback(
    async (playerAddress: string, amount: number) => {
      if (!txHash.trim()) {
        alert("Please enter the transaction hash");
        return;
      }

      setRecording(playerAddress);
      try {
        const response = await fetch("/api/rewards/distribute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seasonId: data?.seasonId,
            playerAddress,
            txHash: txHash.trim(),
            amount,
          }),
        });

        const result = await response.json();
        if (result.success) {
          alert("Distribution recorded successfully!");
          setTxHash("");
          setSelectedPlayer(null);
          fetchDistributionData(); // Refresh data
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error("Failed to record distribution:", error);
        alert("Failed to record distribution");
      } finally {
        setRecording(null);
      }
    },
    [txHash, data?.seasonId, fetchDistributionData],
  );

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    alert("Address copied to clipboard!");
  };

  const getDistributionStatus = (address: string) => {
    if (!data) return null;
    return data.distributions.existing.find(d => d.player_address === address);
  };

  useEffect(() => {
    // Check if already authenticated
    const savedKey = localStorage.getItem("adminKey");
    if (savedKey) {
      setAdminKey(savedKey);
      checkAuthentication(savedKey);
    } else {
      setLoading(false);
    }
  }, [checkAuthentication]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Loading distribution data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-card/50 rounded-xl p-6 border border-border">
          <h1 className="text-2xl font-bold mb-4 text-center">Admin Access</h1>
          <p className="text-base-content/60 mb-6 text-center">
            Enter the admin key to access reward distribution controls.
          </p>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              className="input input-bordered w-full"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button onClick={handleLogin} disabled={!adminKey.trim()} className="btn btn-primary w-full">
              Access Admin Panel
            </button>
          </div>
          <p className="text-xs text-base-content/40 mt-4 text-center">Set ADMIN_KEY environment variable in Vercel</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-base-content/60">Failed to load distribution data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reward Distribution Admin</h1>
        <p className="text-base-content/70">
          {data.seasonName} ({new Date(data.period.startDate).toLocaleDateString()} -{" "}
          {new Date(data.period.endDate).toLocaleDateString()})
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card/50 rounded-xl p-4 border border-primary/20">
          <h3 className="font-semibold text-primary">Eligible Players</h3>
          <p className="text-2xl font-bold">{data.distributions.totalPlayers}</p>
        </div>
        <div className="bg-card/50 rounded-xl p-4 border border-secondary/20">
          <h3 className="font-semibold text-secondary">Total Rewards</h3>
          <p className="text-2xl font-bold">{data.distributions.totalRewards} CELO</p>
        </div>
        <div className="bg-card/50 rounded-xl p-4 border border-accent/20">
          <h3 className="font-semibold text-accent">Distributed</h3>
          <p className="text-2xl font-bold">
            {data.distributions.existing.filter(d => d.status === "distributed").length}/
            {data.distributions.totalPlayers}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-info/10 rounded-xl p-6 mb-8 border border-info/30">
        <h3 className="text-lg font-bold mb-4 text-info">Distribution Instructions</h3>
        <ol className="space-y-2 text-sm">
          <li>
            <strong>1.</strong> {data.instructions.step1}
          </li>
          <li>
            <strong>2.</strong> {data.instructions.step2}
          </li>
          <li>
            <strong>3.</strong> {data.instructions.step3}
          </li>
          <li>
            <strong>4.</strong> {data.instructions.step4}
          </li>
        </ol>
      </div>

      {/* Distribution List */}
      <div className="bg-card/50 rounded-xl p-6 border border-border">
        <h3 className="text-xl font-bold mb-6">Reward Recipients</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2">Rank</th>
                <th className="text-left py-3 px-2">Address</th>
                <th className="text-left py-3 px-2">Wins</th>
                <th className="text-left py-3 px-2">Win Rate</th>
                <th className="text-left py-3 px-2">Reward</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.distributions.eligible.map(player => {
                const status = getDistributionStatus(player.address);
                const isDistributed = status?.status === "distributed";

                return (
                  <tr key={player.address} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <span
                        className={`font-bold ${
                          player.rank === 1
                            ? "text-yellow-500"
                            : player.rank === 2
                              ? "text-gray-400"
                              : player.rank === 3
                                ? "text-orange-600"
                                : "text-primary"
                        }`}
                      >
                        #{player.rank}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {player.address.slice(0, 6)}...{player.address.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyAddress(player.address)}
                          className="btn btn-xs btn-ghost"
                          title="Copy address"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-2">{player.wins}</td>
                    <td className="py-3 px-2">{player.winRate}%</td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-secondary">{player.rewardAmount} CELO</span>
                    </td>
                    <td className="py-3 px-2">
                      {isDistributed ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle size={16} />
                          <span className="text-sm">Distributed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-warning">
                          <Clock size={16} />
                          <span className="text-sm">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isDistributed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-base-content/60">{status?.tx_hash?.slice(0, 8)}...</span>
                          {status?.tx_hash && (
                            <a
                              href={`https://celoscan.io/tx/${status.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-xs btn-ghost"
                              title="View transaction"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {selectedPlayer === player.address ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Transaction hash"
                                value={txHash}
                                onChange={e => setTxHash(e.target.value)}
                                className="input input-xs w-32"
                              />
                              <button
                                onClick={() => recordDistribution(player.address, player.rewardAmount)}
                                disabled={recording === player.address || !txHash.trim()}
                                className="btn btn-xs btn-success"
                              >
                                {recording === player.address ? "Recording..." : "Record"}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPlayer(null);
                                  setTxHash("");
                                }}
                                className="btn btn-xs btn-ghost"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedPlayer(player.address)}
                              className="btn btn-xs btn-primary"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data.distributions.eligible.length === 0 && (
          <div className="text-center py-8 text-base-content/60">
            <AlertCircle className="mx-auto mb-2" size={48} />
            <p>No eligible players for this season.</p>
            <p className="text-sm">Players need at least 5 AI games to qualify.</p>
          </div>
        )}
      </div>
    </div>
  );
}
