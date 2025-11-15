import { useFarcaster } from "~~/contexts/FarcasterContext";

export const useFarcasterAuth = () => {
  const { context } = useFarcaster();

  // Use context data directly from Farcaster SDK with safe fallbacks
  const user = context?.user
    ? {
        fid: context.user.fid,
        username: context.user.username || context.user.displayName || `fid-${context.user.fid}`,
        display_name: context.user.displayName || context.user.username || `User ${context.user.fid}`,
        pfp_url: context.user.pfpUrl || context.user.profileImage || "/placeholder-avatar.png",
      }
    : null;

  return { user, isSignedIn: !!user, isLoading: false, error: null };
};
