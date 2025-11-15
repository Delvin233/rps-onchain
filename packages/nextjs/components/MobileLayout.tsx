"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigation } from "./BottomNavigation";
import { OverlayContainer } from "./overlays/OverlayManager";
import HistoryPage from "~~/app/history/page";

const mainRoutes = ["/", "/play", "/history", "/profile"];

export const MobileLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isInActiveAIGame =
    pathname === "/play/single" &&
    typeof window !== "undefined" &&
    Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i))
      .filter(key => key?.startsWith("aiGameActive_"))
      .some(key => sessionStorage.getItem(key!) === "true");
  const isInActiveMultiplayerGame = pathname.includes("/game/multiplayer/");
  const isInPlaySubpage = pathname.startsWith("/play/") && pathname !== "/play";

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 80;

      if (Math.abs(swipeDistance) < minSwipeDistance) return;

      // Block all swipes during active games
      if (isInActiveAIGame || isInActiveMultiplayerGame) {
        return;
      }

      // Block swipes on play subpages - must use double-tap Play button
      if (isInPlaySubpage) {
        return;
      }

      const currentIndex = mainRoutes.indexOf(pathname);
      if (currentIndex === -1) return;

      if (swipeDistance > 0 && currentIndex < mainRoutes.length - 1) {
        router.push(mainRoutes[currentIndex + 1]);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        router.push(mainRoutes[currentIndex - 1]);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [pathname, router, isInActiveAIGame, isInActiveMultiplayerGame, isInPlaySubpage]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-full bg-base-200 px-4 sm:px-6 pb-20 lg:pb-0 overflow-y-auto transition-transform duration-200 ease-in-out"
      >
        {children}
      </div>
      <div className="lg:hidden">
        <BottomNavigation />
      </div>

      <OverlayContainer type="history">
        <HistoryPage />
      </OverlayContainer>
    </>
  );
};
