"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { History, Home, Play, Shield, User } from "lucide-react";
import toast from "react-hot-toast";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export const DesktopLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/play", icon: Play, label: "Play" },
    { path: "/history", icon: History, label: "History" },
    { path: "/on-chain-matches", icon: Shield, label: "On-Chain" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const isInActiveAIGame =
    pathname === "/play/single" &&
    typeof window !== "undefined" &&
    Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i))
      .filter(key => key?.startsWith("aiGameActive_"))
      .some(key => sessionStorage.getItem(key!) === "true");

  const isInActiveMultiplayerGame = pathname.includes("/game/multiplayer/");

  const handleNavigation = (path: string) => {
    if (isInActiveAIGame || isInActiveMultiplayerGame) {
      if (path !== pathname) {
        toast.error("Please finish your match before navigating away.", {
          duration: 3000,
          position: "top-center",
        });
      }
    } else {
      router.push(path);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Desktop Top Navigation */}
      <nav className="bg-base-100/80 backdrop-blur-lg border-b border-base-300 fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary">RPS-onChain</h1>
              <div className="flex items-center gap-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-base-content/60 hover:text-base-content hover:bg-base-200"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 mt-24">{children}</main>
    </div>
  );
};
