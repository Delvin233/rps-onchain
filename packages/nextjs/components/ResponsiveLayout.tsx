"use client";

import { ReactNode, useEffect, useState } from "react";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";

export const ResponsiveLayout = ({ children }: { children: ReactNode }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return isDesktop ? <DesktopLayout>{children}</DesktopLayout> : <MobileLayout>{children}</MobileLayout>;
};
