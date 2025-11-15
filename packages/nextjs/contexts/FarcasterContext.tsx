"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Context } from "@farcaster/miniapp-core";
import sdk from "@farcaster/miniapp-sdk";

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

  const setMiniAppReady = useCallback(async () => {
    try {
      const ctx = await sdk.context;
      if (ctx) {
        setContext(ctx);

        // If username is missing, fetch from API
        if (ctx.user && (!ctx.user.username || !ctx.user.displayName)) {
          try {
            const response = await fetch(`/api/farcaster/user?fid=${ctx.user.fid}`);
            if (response.ok) {
              const userData = await response.json();
              setEnrichedUser({
                fid: ctx.user.fid,
                username: userData.username || ctx.user.username || `fid-${ctx.user.fid}`,
                displayName:
                  userData.display_name || ctx.user.displayName || userData.username || `User ${ctx.user.fid}`,
                pfpUrl: userData.pfp_url || ctx.user.pfpUrl || "/placeholder-avatar.png",
              });
            } else {
              // Fallback to context data
              setEnrichedUser({
                fid: ctx.user.fid,
                username: ctx.user.username || `fid-${ctx.user.fid}`,
                displayName: ctx.user.displayName || ctx.user.username || `User ${ctx.user.fid}`,
                pfpUrl: ctx.user.pfpUrl || "/placeholder-avatar.png",
              });
            }
          } catch (error) {
            console.error("Failed to fetch user data:", error);
            // Fallback to context data
            setEnrichedUser({
              fid: ctx.user.fid,
              username: ctx.user.username || `fid-${ctx.user.fid}`,
              displayName: ctx.user.displayName || ctx.user.username || `User ${ctx.user.fid}`,
              pfpUrl: ctx.user.pfpUrl || "/placeholder-avatar.png",
            });
          }
        } else if (ctx.user) {
          // Context already has username
          setEnrichedUser({
            fid: ctx.user.fid,
            username: ctx.user.username || `fid-${ctx.user.fid}`,
            displayName: ctx.user.displayName || ctx.user.username || `User ${ctx.user.fid}`,
            pfpUrl: ctx.user.pfpUrl || "/placeholder-avatar.png",
          });
        }
      }
      await sdk.actions.ready();
    } catch (err) {
      console.error("SDK initialization error:", err);
    } finally {
      setIsMiniAppReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [isMiniAppReady, setMiniAppReady]);

  const handleAddMiniApp = useCallback(async () => {
    try {
      const result = await sdk.actions.addFrame();
      return result || null;
    } catch (error) {
      console.error("[error] adding frame", error);
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
