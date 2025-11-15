import { useFarcaster } from "~~/contexts/FarcasterContext";

export const useFarcasterAuth = () => {
  const { context } = useFarcaster();

  // Use context data directly from Farcaster SDK
  const user = context?.user
    ? {
        fid: context.user.fid,
        username: context.user.username,
        display_name: context.user.displayName || context.user.username,
        pfp_url: context.user.pfpUrl,
      }
    : null;

  return { user, isSignedIn: !!user, isLoading: false, error: null };
};
