"use client";

import { useSyncMatches } from "~~/hooks/useSyncMatches";

export const MatchSyncProvider = ({ children }: { children: React.ReactNode }) => {
  useSyncMatches();
  return <>{children}</>;
};
