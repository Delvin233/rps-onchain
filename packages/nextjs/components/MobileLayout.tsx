"use client";

import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

export const MobileLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className="h-full bg-base-200 pb-20 overflow-y-auto">
        {children}
      </div>
      <BottomNavigation />
    </>
  );
};
