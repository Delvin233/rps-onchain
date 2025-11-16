"use client";

import React, { memo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { BalanceDisplay } from "~~/components/BalanceDisplay";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useDisplayName } from "~~/hooks/useDisplayName";
import { useFarcasterAuth } from "~~/hooks/useFarcasterAuth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Play",
    href: "/play",
  },
  {
    label: "History",
    href: "/history",
  },
  {
    label: "On-Chain",
    href: "/on-chain-matches",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

const UsernameDisplay = memo(() => {
  const { address, isConnected, isReconnecting } = useAccount();
  const { displayName, ensType, pfpUrl } = useDisplayName(address);
  const { user: farcasterUser } = useFarcasterAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  const { data: username = "", refetch } = useQuery({
    queryKey: ["username", address],
    queryFn: async () => {
      if (!address) return "";
      const res = await fetch(`/api/username?address=${address}`);
      const data = await res.json();
      return data.username || "";
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });

  const saveUsername = async () => {
    if (!address || !tempUsername.trim()) return;

    const response = await fetch("/api/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, username: tempUsername.trim() }),
    });

    if (response.ok) {
      refetch();
      setIsEditing(false);
    }
  };

  const startEdit = () => {
    setTempUsername(username);
    setIsEditing(true);
  };

  if (!isConnected || isReconnecting) return null;

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={tempUsername}
            onChange={e => setTempUsername(e.target.value)}
            placeholder="Enter username"
            className="bg-base-200 text-base-content p-1 text-sm rounded w-24"
            maxLength={15}
          />
          <button onClick={saveUsername} className="btn btn-xs btn-success">
            ✓
          </button>
          <button onClick={() => setIsEditing(false)} className="btn btn-xs btn-ghost">
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {(pfpUrl || (farcasterUser && farcasterUser.pfp_url)) && (
            <Image
              src={pfpUrl || farcasterUser?.pfp_url || ""}
              alt={displayName}
              width={32}
              height={32}
              className="rounded-full"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMzMzIi8+PC9zdmc+"
              onError={e => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span className="text-sm text-base-content hidden sm:block">
            Welcome <span className="font-bold">{displayName}</span>
            {ensType === "mainnet" && <span className="text-success text-xs ml-1">ENS</span>}
            {ensType === "farcaster" && <span className="text-purple-500 text-xs ml-1">FC</span>}
            {ensType === "basename" && <span className="text-primary text-xs ml-1">BASENAME</span>}
          </span>
          {!ensType && (
            <button onClick={startEdit} className="btn btn-xs btn-ghost">
              ✎
            </button>
          )}
        </div>
      )}
    </div>
  );
});

UsernameDisplay.displayName = "UsernameDisplay";

/**
 * Site header
 */
export const Header = memo(() => {
  const { address, isReconnecting } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex flex-col">
            <span className="font-bold leading-tight text-lg">RPS-ONCHAIN</span>
            <span className="text-xs">Rock Paper Scissors</span>
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-4 flex items-center gap-2">
        {isReconnecting ? (
          <div className="skeleton h-8 w-32 rounded-lg"></div>
        ) : (
          <>
            <BalanceDisplay address={address} />
            <UsernameDisplay />
          </>
        )}
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
});

Header.displayName = "Header";
