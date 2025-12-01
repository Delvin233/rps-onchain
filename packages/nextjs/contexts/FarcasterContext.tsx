"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Context } from "@farcaster/miniapp-core";
import sdk from "@farcaster/miniapp-sdk";
import { useAccount, useConnect } from "wagmi";

interface EnrichedUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

interface FarcasterContextType {
  isMiniAppReady: boolean;
  context: Context.MiniAppContext | null;
  enrichedUser: EnrichedUser | null;
  setMiniAppReady: () => void;
  addMiniApp: () => Promise<any>;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Context.MiniAppContext | null>(null);
  const [enrichedUser, setEnrichedUser] = useState<EnrichedUser | null>(null);
  const [isMiniAppReady, setIsMiniAppReady] = useState(false);
  const isInitializing = useRef(false);
  const isInitialized = useRef(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  const setMiniAppReady = useCallback(async () => {
    // Prevent multiple initializations using ref (survives re-renders)
    if (isInitializing.current || isInitialized.current) {
      return;
    }

    isInitializing.current = true;

    try {
      const ctx = await sdk.context;
      if (ctx) {
        // Fetch user's verified addresses from Neynar first
        if (ctx.user) {
          try {
            const response = await fetch(`/api/farcaster/user?fid=${ctx.user.fid}`);
            if (response.ok) {
              const userData = await response.json();
              // Prioritize verified addresses over custody address
              const connectedAddress = userData.verifications?.[0] || userData.custody_address || null;

              // Set everything at once to prevent multiple re-renders
              setEnrichedUser({
                fid: ctx.user.fid,
                username: userData.username || ctx.user.username || `fid-${ctx.user.fid}`,
                displayName:
                  userData.display_name || ctx.user.displayName || userData.username || `User ${ctx.user.fid}`,
                pfpUrl: userData.pfp_url || ctx.user.pfpUrl || "/placeholder-avatar.png",
              });

              // Set context with address in one go
              const contextWithAddress = {
                ...ctx,
                connectedAddress,
              };
              setContext(contextWithAddress as any);
            } else {
              throw new Error("Failed to fetch user data");
            }
          } catch (error) {
            console.error("Failed to fetch user data:", error);
            // Fallback to basic SDK data
            setEnrichedUser({
              fid: ctx.user.fid,
              username: ctx.user.username || `fid-${ctx.user.fid}`,
              displayName: ctx.user.displayName || ctx.user.username || `User ${ctx.user.fid}`,
              pfpUrl: ctx.user.pfpUrl || "/placeholder-avatar.png",
            });
            setContext(ctx as any);
          }
        } else {
          setContext(ctx as any);
        }
      }
      await sdk.actions.ready();
      isInitialized.current = true;
    } catch (err) {
      console.error("[Farcaster] SDK initialization error:", err);
    } finally {
      isInitializing.current = false;
      setIsMiniAppReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMiniAppReady]);

  // Auto-connect Farcaster wallet when in miniapp and not already connected
  useEffect(() => {
    if (isMiniAppReady && context?.user && !isConnected) {
      const farcasterConnector = connectors.find(
        c => c.id === "farcasterMiniApp" || c.name?.toLowerCase().includes("farcaster"),
      );

      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, context, isConnected, connectors, connect]);

  const handleAddMiniApp = useCallback(async () => {
    try {
      const result = await sdk.actions.addMiniApp();
      return result || null;
    } catch (error) {
      console.error("[error] adding mini app", error);
      return null;
    }
  }, []);

  return (
    <FarcasterContext.Provider
      value={{
        isMiniAppReady,
        setMiniAppReady,
        addMiniApp: handleAddMiniApp,
        context,
        enrichedUser,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error("useFarcaster must be used within a FarcasterProvider");
  }
  return context;
}
