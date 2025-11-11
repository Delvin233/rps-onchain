"use client";

import { usePathname, useRouter } from "next/navigation";
import { History, Home, Play, User } from "lucide-react";
import toast from "react-hot-toast";
import { useOverlay } from "~~/components/overlays/OverlayManager";

export const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openOverlay, activeOverlay } = useOverlay();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/play", icon: Play, label: "Play" },
    { path: "/history", icon: History, label: "History" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || activeOverlay === "home";
    if (path === "/history") return pathname === "/history" || activeOverlay === "history";
    if (path === "/profile") return pathname === "/profile" || activeOverlay === "profile";
    return pathname.startsWith(path);
  };

  const isInGame = pathname.includes("/game/multiplayer/") || pathname === "/play/single";

  const handleNavigation = (path: string) => {
    if (isInGame) {
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
      // Save current play page before leaving
      if (pathname.startsWith("/play") && !path.startsWith("/play")) {
        sessionStorage.setItem("lastPlayPage", pathname);
      }

      // Restore last play page when clicking Play
      if (path === "/play") {
        const lastPlayPage = sessionStorage.getItem("lastPlayPage");
        if (lastPlayPage && lastPlayPage !== "/play") {
          router.push(lastPlayPage);
          return;
        }
      }

      router.push(path);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-lg border-t border-base-300"
      style={{ maxWidth: "448px", margin: "0 auto" }}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => {
                if (!active || isInGame) {
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
