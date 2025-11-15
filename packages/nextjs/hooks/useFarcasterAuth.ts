import { useFarcaster } from "~~/contexts/FarcasterContext";

export const useFarcasterAuth = () => {
  const { enrichedUser } = useFarcaster();

  const user = enrichedUser
    ? {
        fid: enrichedUser.fid,
        username: enrichedUser.username,
        display_name: enrichedUser.displayName,
        pfp_url: enrichedUser.pfpUrl,
      }
    : null;

  return { user, isSignedIn: !!user, isLoading: false, error: null };
};
