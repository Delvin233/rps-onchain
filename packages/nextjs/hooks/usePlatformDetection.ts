"use client";

import { useFarcaster } from "~~/contexts/FarcasterContext";

export const usePlatformDetection = () => {
  const { context, isMiniAppReady } = useFarcaster();
  const isBaseApp =
    typeof window !== "undefined" &&
    (window.location.ancestorOrigins?.[0]?.includes("base.dev") || window.location.href.includes("base.dev/preview"));
  const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
  const isMiniApp = (isMiniAppReady && !!context) || isBaseApp || isMiniPay;

  return { isMiniApp, isBaseApp, isMiniPay, isFarcaster: isMiniAppReady && !!context };
};
