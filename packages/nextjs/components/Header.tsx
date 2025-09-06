"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useAccount, useEnsName } from "wagmi";
import { base, mainnet } from "wagmi/chains";

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
    label: "Debug",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
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

const UsernameDisplay = () => {
  const { address, isConnected } = useAccount();
  const { data: mainnetEnsName } = useEnsName({ address, chainId: mainnet.id });
  const { data: baseEnsName } = useEnsName({ address, chainId: base.id });
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (address) {
      fetch(`/api/username?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUsername(data.username);
          }
        });
    }
  }, [address]);

  useEffect(() => {
    if (mainnetEnsName) {
      setDisplayName(mainnetEnsName);
    } else if (baseEnsName) {
      setDisplayName(baseEnsName);
    } else if (username) {
      setDisplayName(username);
    } else {
      setDisplayName("User");
    }
  }, [mainnetEnsName, baseEnsName, username]);

  const saveUsername = async () => {
    if (!address || !tempUsername.trim()) return;

    const response = await fetch("/api/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, username: tempUsername.trim() }),
    });

    if (response.ok) {
      setUsername(tempUsername.trim());
      setIsEditing(false);
    }
  };

  const startEdit = () => {
    setTempUsername(username);
    setIsEditing(true);
  };

  if (!isConnected) return null;

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
          <button
            onClick={saveUsername}
            className="btn btn-xs btn-success"
          >
            ✓
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="btn btn-xs btn-ghost"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-sm text-base-content hidden sm:block">
            Welcome <span className="font-bold">{displayName}</span>
            {mainnetEnsName && <span className="text-success text-xs ml-1">ENS</span>}
            {baseEnsName && !mainnetEnsName && <span className="text-info text-xs ml-1">BASE</span>}
          </span>
          {!mainnetEnsName && !baseEnsName && (
            <button
              onClick={startEdit}
              className="btn btn-xs btn-ghost"
            >
              ✎
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Site header
 */
export const Header = () => {
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
      <div className="navbar-end grow mr-4 flex items-center gap-4">
        <UsernameDisplay />
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
