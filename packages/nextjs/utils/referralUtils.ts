/**
 * Referral Utilities for Viral Growth
 *
 * Handles invite link generation and referral detection for the viral growth system.
 * Works with GoodDollar's automated referral tracking - no custom database needed.
 */

/**
 * Generate an invite link for a user to share
 */
export function generateInviteLink(referrerAddress: string): string {
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  return `${baseUrl}?ref=${encodeURIComponent(referrerAddress)}`;
}

/**
 * Extract referrer address from URL parameters
 */
export function getReferrerFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get("ref");

  return ref ? decodeURIComponent(ref) : null;
}

/**
 * Check if current user was referred by someone
 */
export function isReferredUser(): boolean {
  return getReferrerFromUrl() !== null;
}

/**
 * Get social media sharing URLs
 */
export function getSocialShareUrls(inviteLink: string) {
  const message = encodeURIComponent(
    "🎮 Join me in RPS OnChain! Play Rock Paper Scissors and earn rewards with GoodDollar integration!",
  );

  return {
    twitter: `https://twitter.com/intent/tweet?text=${message}&url=${encodeURIComponent(inviteLink)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${message}`,
    whatsapp: `https://wa.me/?text=${message}%20${encodeURIComponent(inviteLink)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`,
  };
}

/**
 * Clean referral parameter from URL (call after processing)
 */
export function cleanReferralFromUrl(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (url.searchParams.has("ref")) {
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }
}
