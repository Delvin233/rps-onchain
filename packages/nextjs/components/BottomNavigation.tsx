"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { History, Home, Play, Shield, User } from "lucide-react";
import toast from "react-hot-toast";
import { useOverlay } from "~~/components/overlays/OverlayManager";

export const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openOverlay, activeOverlay } = useOverlay();
  const lastPlayTapRef = useRef(0);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/play", icon: Play, label: "Play" },
    { path: "/history", icon: History, label: "History" },
    { path: "/on-chain-matches", icon: Shield, label: "On-Chain" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || activeOverlay === "home";
    if (path === "/history") return pathname === "/history" || activeOverlay === "history";
    if (path === "/profile") return pathname === "/profile" || activeOverlay === "profile";
    if (path === "/on-chain-matches") return pathname === "/on-chain-matches";
    return pathname.startsWith(path);
  };

  // Check if in active paid game (both players joined)
  const isInActivePaidGame =
    pathname.includes("/game/paid/") &&
    typeof window !== "undefined" &&
    sessionStorage.getItem("paidGameActive") === "true";

  // Check if in active AI game by checking sessionStorage
  const isInActiveAIGame =
    pathname === "/play/single" && typeof window !== "undefined" && sessionStorage.getItem("aiGameActive") === "true";

  // Check if in active multiplayer game
  const isInActiveMultiplayerGame = pathname.includes("/game/multiplayer/");

  const handleNavigation = (path: string) => {
    if (isInActivePaidGame || isInActiveAIGame || isInActiveMultiplayerGame) {
      // In game - only History opens as overlay
      if (path === "/history") {
        openOverlay("history");
      } else if (path !== pathname) {
        // Block navigation - must finish match
        toast.error("Please finish your match before navigating away.", {
          duration: 3000,
          position: "top-center",
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #ef4444",
          },
        });
      }
    } else {
      // Save current play subpage before leaving
      if (pathname.startsWith("/play/") && !path.startsWith("/play")) {
        sessionStorage.setItem("lastPlayPage", pathname);
      }

      // Handle Play button with double-tap detection
      if (path === "/play") {
        const now = Date.now();
        const timeSinceLastTap = now - lastPlayTapRef.current;
        const isOnPlaySubpage = pathname.startsWith("/play/");
        const isOnPlayRoot = pathname === "/play";

        // From non-play page: restore last subpage or go to root
        if (!pathname.startsWith("/play")) {
          const lastPlayPage = sessionStorage.getItem("lastPlayPage");
          if (lastPlayPage && lastPlayPage.startsWith("/play/")) {
            router.push(lastPlayPage);
          } else {
            router.push("/play");
          }
          lastPlayTapRef.current = 0;
          return;
        }

        // On play root: do nothing
        if (isOnPlayRoot) {
          return;
        }

        // On subpage: double-tap to return to root
        if (isOnPlaySubpage) {
          if (timeSinceLastTap < 500) {
            // Check if user has active waiting room
            const activeWaitingRoom = sessionStorage.getItem("activeWaitingRoom");
            if (activeWaitingRoom) {
              toast.error("You have a room waiting! Cancel it first or wait for opponent.", {
                duration: 3000,
                style: {
                  background: "#1f2937",
                  color: "#fff",
                  border: "1px solid #ef4444",
                },
              });
              lastPlayTapRef.current = 0;
              return;
            }

            // Double-tap detected
            sessionStorage.removeItem("lastPlayPage");
            sessionStorage.removeItem("paidBetAmount");
            sessionStorage.removeItem("paidRoomCode");
            router.push("/play");
            lastPlayTapRef.current = 0;
            return;
          }
          // First tap: just record time, don't navigate
          lastPlayTapRef.current = now;
          toast("Tap again to return to Play menu", {
            duration: 2000,
            style: {
              background: "#1f2937",
              color: "#fff",
              border: "1px solid #6366f1",
            },
          });
          return;
        }
      }

      router.push(path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-lg border-t border-base-300">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => {
                if (!active || isInActivePaidGame || item.path === "/play") {
                  handleNavigation(item.path);
                }
              }}
              className={`flex flex-col items-center justify-center p-2 min-w-0 touch-target transition-all duration-200 cursor-pointer ${
                active ? "text-primary shadow-glow-primary" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <Icon size={24} className={`mb-1 transition-transform duration-200 ${active && "scale-110"}`} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
