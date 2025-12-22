// Analytics event types
export type ShareType = "room-code" | "match-result" | "room-history";
export type ShareDestination = "farcaster" | "native" | "clipboard" | "base-app";

export interface ShareAnalyticsEvent {
  event: string;
  properties: {
    shareType: ShareType;
    destination?: ShareDestination;
    roomId: string;
    matchId?: string;
    timeToShare?: number;
    error?: string;
    referrer?: string;
    platform?: string;
    userAgent?: string;
  };
}

// Track share initiated
export function trackShare(type: ShareType, destination: ShareDestination, roomId: string, matchId?: string): void {
  const event: ShareAnalyticsEvent = {
    event: "share_button_clicked",
    properties: {
      shareType: type,
      destination,
      roomId,
      matchId,
      platform: getPlatform(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Analytics:", event);
  }

  // Send to analytics service (implement based on your analytics provider)
  sendAnalyticsEvent(event);
}

// Track share completed successfully
export function trackShareComplete(
  type: ShareType,
  destination: ShareDestination,
  roomId: string,
  timeToShare?: number,
): void {
  const event: ShareAnalyticsEvent = {
    event: "share_completed",
    properties: {
      shareType: type,
      destination,
      roomId,
      timeToShare,
      platform: getPlatform(),
    },
  };

  if (process.env.NODE_ENV === "development") {
    console.log("📊 Analytics:", event);
  }

  sendAnalyticsEvent(event);
}

// Track share failed
export function trackShareFailed(type: ShareType, destination: ShareDestination, roomId: string, error: string): void {
  const event: ShareAnalyticsEvent = {
    event: "share_failed",
    properties: {
      shareType: type,
      destination,
      roomId,
      error,
      platform: getPlatform(),
    },
  };

  if (process.env.NODE_ENV === "development") {
    console.log("📊 Analytics:", event);
  }

  sendAnalyticsEvent(event);
}

// Track share link clicked (from recipient side)
export function trackShareLinkClick(roomId: string, source: string = "unknown", matchId?: string): void {
  const event: ShareAnalyticsEvent = {
    event: "share_link_clicked",
    properties: {
      shareType: matchId ? "match-result" : "room-code",
      roomId,
      matchId,
      referrer: source,
      platform: getPlatform(),
    },
  };

  if (process.env.NODE_ENV === "development") {
    console.log("📊 Analytics:", event);
  }

  sendAnalyticsEvent(event);
}

// Track share link conversion (recipient joined game)
export function trackShareLinkConversion(
  roomId: string,
  action: "joined" | "created_new" | "spectated",
  matchId?: string,
): void {
  const event: ShareAnalyticsEvent = {
    event: "share_link_converted",
    properties: {
      shareType: matchId ? "match-result" : "room-code",
      roomId,
      matchId,
      destination: action as any, // Reusing destination field for action
      platform: getPlatform(),
    },
  };

  if (process.env.NODE_ENV === "development") {
    console.log("📊 Analytics:", event);
  }

  sendAnalyticsEvent(event);
}

// Track share link bounce (recipient left without action)
export function trackShareLinkBounce(
  roomId: string,
  reason: "expired" | "full" | "error" | "unknown",
  matchId?: string,
): void {
  const event: ShareAnalyticsEvent = {
    event: "share_link_bounced",
    properties: {
      shareType: matchId ? "match-result" : "room-code",
      roomId,
      matchId,
      error: reason,
      platform: getPlatform(),
    },
  };

  if (process.env.NODE_ENV === "development") {
    console.log("📊 Analytics:", event);
  }

  sendAnalyticsEvent(event);
}

// Get current platform
function getPlatform(): string {
  if (typeof window === "undefined") return "server";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("farcaster") || userAgent.includes("warpcast")) {
    return "farcaster";
  }
  if (userAgent.includes("base") || userAgent.includes("coinbase")) {
    return "base";
  }
  if (/android/i.test(userAgent)) {
    return "android";
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "ios";
  }
  if (/mobile/i.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}

// Send analytics event to your analytics service
function sendAnalyticsEvent(event: ShareAnalyticsEvent): void {
  // TODO: Implement based on your analytics provider
  // Examples:

  // Google Analytics 4
  // if (typeof gtag !== "undefined") {
  //   gtag("event", event.event, event.properties);
  // }

  // PostHog
  // if (typeof posthog !== "undefined") {
  //   posthog.capture(event.event, event.properties);
  // }

  // Mixpanel
  // if (typeof mixpanel !== "undefined") {
  //   mixpanel.track(event.event, event.properties);
  // }

  // Custom analytics API
  // fetch("/api/analytics", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(event),
  // }).catch(console.error);

  // For now, just log in development
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Would send to analytics:", event);
  }
}

// Utility to measure time to share
export class ShareTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  getTimeToShare(): number {
    return Date.now() - this.startTime;
  }

  reset(): void {
    this.startTime = Date.now();
  }
}

// Create a share timer for measuring engagement
export function createShareTimer(): ShareTimer {
  return new ShareTimer();
}
