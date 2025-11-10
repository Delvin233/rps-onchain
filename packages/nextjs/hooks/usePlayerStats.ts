"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { getLocalMatches } from "~~/lib/pinataStorage";

export const usePlayerStats = (address: string | undefined) => {
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    winRate: 0,
    totalWagered: 0,
  });

  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchStats = async () => {
      try {
        const chainId = targetNetwork.id as keyof typeof deployedContracts;
        const contract = deployedContracts[chainId]?.RPSOnline;
        if (!contract) {
          // Fallback to localStorage if contract not found
          const matches = getLocalMatches();
          const userMatches = matches.filter(
            match =>
              match.players?.creator === address || match.players?.joiner === address || match.player === address,
          );
          const wins = userMatches.filter(match =>
            typeof match.result === "object" ? match.result.winner === address : match.result === "win",
          ).length;
          const ties = userMatches.filter(match =>
            typeof match.result === "object" ? match.result.winner === "tie" : match.result === "tie",
          ).length;
          const losses = userMatches.length - wins - ties;
          const winRate = userMatches.length > 0 ? Math.round((wins / userMatches.length) * 100) : 0;
          const totalWagered = userMatches.reduce((sum, match) => sum + parseFloat(match.betAmount || "0"), 0);
          setStats({ totalGames: userMatches.length, wins, losses, ties, winRate, totalWagered });
          return;
        }

        // Fetch GameJoined events (only count games that were actually played)
        const joinedEvents = await publicClient.getLogs({
          address: contract.address as `0x${string}`,
          event: contract.abi.find((item: any) => item.name === "GameJoined") as any,
          args: { joiner: address },
          fromBlock: 0n,
        });

        const createdEvents = await publicClient.getLogs({
          address: contract.address as `0x${string}`,
          event: contract.abi.find((item: any) => item.name === "GameJoined") as any,
          fromBlock: 0n,
        });

        // Filter created events where user was creator
        const userCreatedGames = createdEvents.filter((event: any) => {
          const roomId = event.args.roomId;
          return createdEvents.some((e: any) => e.args.roomId === roomId);
        });

        // Get all finished games
        const finishedEvents = await publicClient.getLogs({
          address: contract.address as `0x${string}`,
          event: contract.abi.find((item: any) => item.name === "GameFinished") as any,
          fromBlock: 0n,
        });

        const userFinishedGames = finishedEvents.filter((event: any) => {
          const roomId = (event as any).args?.roomId;
          return (
            joinedEvents.some((e: any) => (e as any).args?.roomId === roomId) ||
            userCreatedGames.some((e: any) => (e as any).args?.roomId === roomId)
          );
        });

        let wins = 0;
        let ties = 0;
        let totalWagered = 0n;

        for (const event of userFinishedGames) {
          const winner = (event as any).args?.winner;
          if (winner === address) wins++;
          else if (winner === "0x0000000000000000000000000000000000000000") ties++;
        }

        // Calculate total wagered from joined events
        for (const event of joinedEvents) {
          totalWagered += (event as any).args?.betAmount || 0n;
        }

        // Add bets from games user created and someone joined
        for (const event of userCreatedGames) {
          const roomId = (event as any).args?.roomId;
          if (finishedEvents.some((e: any) => (e as any).args?.roomId === roomId)) {
            totalWagered += (event as any).args?.betAmount || 0n;
          }
        }

        const totalGames = userFinishedGames.length;
        const losses = totalGames - wins - ties;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        setStats({
          totalGames,
          wins,
          losses,
          ties,
          winRate,
          totalWagered: parseFloat(formatEther(totalWagered)),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Fallback to localStorage
        const matches = getLocalMatches();
        const userMatches = matches.filter(
          match => match.players?.creator === address || match.players?.joiner === address || match.player === address,
        );
        const wins = userMatches.filter(match =>
          typeof match.result === "object" ? match.result.winner === address : match.result === "win",
        ).length;
        const ties = userMatches.filter(match =>
          typeof match.result === "object" ? match.result.winner === "tie" : match.result === "tie",
        ).length;
        const losses = userMatches.length - wins - ties;
        const winRate = userMatches.length > 0 ? Math.round((wins / userMatches.length) * 100) : 0;
        const totalWagered = userMatches.reduce((sum, match) => sum + parseFloat(match.betAmount || "0"), 0);
        setStats({ totalGames: userMatches.length, wins, losses, ties, winRate, totalWagered });
      }
    };

    fetchStats();
  }, [address, publicClient, targetNetwork]);

  return stats;
};
