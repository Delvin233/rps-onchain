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
        console.log("[Farcaster] Full SDK context:", ctx);
        console.log("[Farcaster] Client object:", (ctx as any).client);

        // Set basic user data immediately from SDK
        if (ctx.user) {
          setEnrichedUser({
            fid: ctx.user.fid,
            username: ctx.user.username || `fid-${ctx.user.fid}`,
            displayName: ctx.user.displayName || ctx.user.username || `User ${ctx.user.fid}`,
            pfpUrl: ctx.user.pfpUrl || "/placeholder-avatar.png",
          });
        }

        // Set initial context without address
        setContext(ctx as any);

        // Fetch user's verified addresses from Neynar (async, don't block)
        if (ctx.user) {
          // Fetch enriched data in background
          fetch(`/api/farcaster/user?fid=${ctx.user.fid}`)
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              throw new Error("Failed to fetch user data");
            })
            .then(userData => {
              // Prioritize verified addresses over custody address
              // Verified addresses are the wallets the user has connected
              const connectedAddress = userData.verifications?.[0] || userData.custody_address || null;
              console.log("[Farcaster] User data:", userData);
              console.log("[Farcaster] Fetched wallet address:", connectedAddress);

              // Update with enriched data
              setEnrichedUser({
                fid: ctx.user.fid,
                username: userData.username || ctx.user.username || `fid-${ctx.user.fid}`,
                displayName:
                  userData.display_name || ctx.user.displayName || userData.username || `User ${ctx.user.fid}`,
                pfpUrl: userData.pfp_url || ctx.user.pfpUrl || "/placeholder-avatar.png",
              });

              // Update context with address
              const contextWithAddress = {
                ...ctx,
                connectedAddress,
              };
              setContext(contextWithAddress as any);
            })
            .catch(error => {
              console.error("Failed to fetch user data:", error);
              // Keep the basic SDK data we already set
            });
        }
      }
      await sdk.actions.ready();
    } catch (err) {
      console.error("[Farcaster] SDK initialization error:", err);
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
