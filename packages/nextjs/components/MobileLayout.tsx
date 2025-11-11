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

  const isInGame = pathname.includes("/game/multiplayer/") || pathname === "/play/single";
  const isInPlayMode = pathname === "/play/paid" || pathname === "/play/multiplayer";

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

      // In active game: only allow swipe right to open history overlay
      if (isInGame) {
        if (swipeDistance > 0) {
          router.push("/history");
        }
        return;
      }

      // Allow swipes in play mode pages
      if (isInPlayMode) {
        const currentIndex = mainRoutes.indexOf(pathname);
        if (currentIndex === -1) return;

        if (swipeDistance > 0 && currentIndex < mainRoutes.length - 1) {
          router.push(mainRoutes[currentIndex + 1]);
        } else if (swipeDistance < 0 && currentIndex > 0) {
          router.push(mainRoutes[currentIndex - 1]);
        }
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
  }, [pathname, router, isInGame, isInPlayMode]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-full bg-base-200 pb-20 overflow-y-auto transition-transform duration-200 ease-in-out"
      >
        {children}
      </div>
      <BottomNavigation />

      <OverlayContainer type="history">
        <HistoryPage />
      </OverlayContainer>
    </>
  );
};
