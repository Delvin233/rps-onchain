// Platform detection utilities
export type ShareDestination = "farcaster" | "native" | "clipboard" | "base-app";

// Detect if running in Farcaster
export function isFarcaster(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Farcaster-specific user agent or window properties
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("farcaster") ||
    userAgent.includes("warpcast") ||
    // @ts-ignore - Farcaster may inject global properties
    typeof window.farcaster !== "undefined"
  );
}

// Detect if running in Base App
export function isBaseApp(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Base App-specific indicators
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("base") ||
    userAgent.includes("coinbase") ||
    // @ts-ignore - Base App may inject global properties
    typeof window.base !== "undefined" ||
    // @ts-ignore
    typeof window.coinbase !== "undefined"
  );
}

// Check if native share is available
export function hasNativeShare(): boolean {
  if (typeof window === "undefined") return false;
  return typeof navigator.share === "function";
}

// Check if device is mobile
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || window.innerWidth <= 768;
}

// Check if device is iOS
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/i.test(userAgent);
}

// Check if device is Android
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/i.test(userAgent);
}

// Get available share methods based on platform
export function getAvailableShareMethods(): ShareDestination[] {
  const methods: ShareDestination[] = ["clipboard"]; // Always available

  if (hasNativeShare()) {
    methods.unshift("native"); // Prefer native share on mobile
  }

  if (isFarcaster()) {
    methods.unshift("farcaster"); // Prefer Farcaster in Farcaster app
  }

  if (isBaseApp()) {
    methods.unshift("base-app"); // Prefer Base App in Base App
  }

  return methods;
}

// Get platform-specific share button text
export function getShareButtonText(destination: ShareDestination): string {
  switch (destination) {
    case "farcaster":
      return "Share to Farcaster";
    case "base-app":
      return "Share to Base";
    case "native":
      return "Share";
    case "clipboard":
      return "Copy Link";
    default:
      return "Share";
  }
}

// Get platform-specific share button icon
export function getShareButtonIcon(destination: ShareDestination): string {
  switch (destination) {
    case "farcaster":
      return "🟣"; // Farcaster purple
    case "base-app":
      return "🔵"; // Base blue
    case "native":
      return "📤"; // Share icon
    case "clipboard":
      return "📋"; // Clipboard icon
    default:
      return "📤";
  }
}

// Check if running in a miniapp/iframe context
export function isInMiniApp(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.self !== window.top;
  } catch {
    // If we can't access window.top due to cross-origin restrictions,
    // we're likely in an iframe/miniapp
    return true;
  }
}

// Get referrer information for analytics
export function getShareReferrer(): string {
  if (typeof document === "undefined") return "unknown";

  const referrer = document.referrer;
  if (!referrer) return "direct";

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("farcaster") || hostname.includes("warpcast")) {
      return "farcaster";
    }
    if (hostname.includes("base") || hostname.includes("coinbase")) {
      return "base";
    }
    if (hostname.includes("twitter") || hostname.includes("x.com")) {
      return "twitter";
    }
    if (hostname.includes("telegram")) {
      return "telegram";
    }
    if (hostname.includes("discord")) {
      return "discord";
    }

    return hostname;
  } catch {
    return "unknown";
  }
}
