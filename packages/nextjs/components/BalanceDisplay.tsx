"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Address, formatEther } from "viem";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

type BalanceDisplayProps = {
  address?: Address;
};

export const BalanceDisplay = ({ address }: BalanceDisplayProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { data: balance, isLoading } = useWatchBalance({ address });

  if (!address || isLoading || balance === null) {
    return null;
  }

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  return (
    <div className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg px-2 py-1 transition-all">
      <Link href="/profile" className="flex items-center gap-1">
        <span className="text-sm font-bold">
          {isHidden ? "****" : formattedBalance.toFixed(2)} {!isHidden && targetNetwork.nativeCurrency.symbol}
        </span>
      </Link>
      <button
        onClick={e => {
          e.preventDefault();
          setIsHidden(!isHidden);
        }}
        className="p-1 hover:bg-primary/20 rounded transition-all"
        type="button"
      >
        {isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
    </div>
  );
};
