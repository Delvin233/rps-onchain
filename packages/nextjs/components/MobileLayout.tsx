"use client";

import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { OverlayContainer } from "./overlays/OverlayManager";
import HistoryPage from "~~/app/history/page";

export const MobileLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className="h-full bg-base-200 pb-20 overflow-y-auto">{children}</div>
      <BottomNavigation />

      <OverlayContainer type="history">
        <HistoryPage />
      </OverlayContainer>
    </>
  );
};
