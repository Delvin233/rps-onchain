"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigation } from "./BottomNavigation";
import { OverlayContainer } from "./overlays/OverlayManager";
import { useAccount } from "wagmi";
import HistoryPage from "~~/app/history/page";

const mainRoutes = ["/", "/play", "/history", "/profile"];

export const MobileLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isInGameArea = pathname?.startsWith("/game/");
  const shouldHideNav = isInGameArea && isConnected;

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

      // Block all swipes in game area
      if (isInGameArea) {
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
  }, [pathname, router, isInGameArea]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-full bg-base-200 px-4 sm:px-6 pb-20 lg:pb-0 overflow-y-auto transition-transform duration-200 ease-in-out"
      >
        {children}
      </div>
      {!shouldHideNav && (
        <div className="lg:hidden">
          <BottomNavigation />
        </div>
      )}

      <OverlayContainer type="history">
        <HistoryPage />
      </OverlayContainer>
    </>
  );
};
