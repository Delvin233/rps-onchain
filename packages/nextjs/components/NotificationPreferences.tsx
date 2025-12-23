"use client";

import { useEffect, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { useFarcaster } from "~~/contexts/FarcasterContext";

export function NotificationPreferences() {
  const { enrichedUser, context, sdk } = useFarcaster();
  const [hasNotificationToken, setHasNotificationToken] = useState(false);

  // Check if user has notification token (meaning they've enabled notifications in Farcaster)
  useEffect(() => {
    if (context?.client?.notificationDetails?.token) {
      setHasNotificationToken(true);

      // Store the notification token for the cron job to use
      if (enrichedUser?.fid) {
        storeNotificationToken(enrichedUser.fid, context.client.notificationDetails.token);
      }
    }
  }, [context?.client?.notificationDetails?.token, enrichedUser?.fid]);

  // Listen for Farcaster SDK notification events
  useEffect(() => {
    if (!sdk) return;

    const handleNotificationsEnabled = () => {
      console.log("[Notifications] User enabled notifications via Farcaster menu");
      setHasNotificationToken(true);

      // Store the notification token when user enables notifications
      if (enrichedUser?.fid && context?.client?.notificationDetails?.token) {
        storeNotificationToken(enrichedUser.fid, context.client.notificationDetails.token);
      }
    };

    const handleNotificationsDisabled = () => {
      console.log("[Notifications] User disabled notifications via Farcaster menu");
      setHasNotificationToken(false);

      // Remove the notification token when user disables notifications
      if (enrichedUser?.fid) {
        removeNotificationToken(enrichedUser.fid);
      }
    };

    // Register event listeners
    sdk.on("notificationsEnabled", handleNotificationsEnabled);
    sdk.on("notificationsDisabled", handleNotificationsDisabled);

    // Cleanup listeners on unmount
    return () => {
      sdk.removeListener("notificationsEnabled", handleNotificationsEnabled);
      sdk.removeListener("notificationsDisabled", handleNotificationsDisabled);
    };
  }, [sdk, enrichedUser?.fid, context?.client?.notificationDetails?.token]);

  const storeNotificationToken = async (fid: number, token: string) => {
    try {
      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fid,
          notificationToken: token,
          enableDailyReminders: true, // Auto-enable when user grants permissions
          reminderTime: "09:00",
          timezone: "UTC",
        }),
      });
      console.log(`[Notifications] Stored token for FID ${fid}`);
    } catch (error) {
      console.error("Error storing notification token:", error);
    }
  };

  const removeNotificationToken = async (fid: number) => {
    try {
      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fid,
          notificationToken: null, // Remove the token
          enableDailyReminders: false,
        }),
      });
      console.log(`[Notifications] Removed token for FID ${fid}`);
    } catch (error) {
      console.error("Error removing notification token:", error);
    }
  };

  return (
    <div className="bg-card/50 rounded-xl p-6 mb-4 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <Bell size={24} className="text-primary" />
        <div>
          <p className="font-semibold">Daily UBI Reminders</p>
          <p className="text-xs text-base-content/60">Get notified when your daily UBI is ready to claim</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Notification Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notification Status</p>
            <p className="text-xs text-base-content/60">
              {hasNotificationToken
                ? "✓ Notifications enabled - you&apos;ll receive daily reminders"
                : "Notifications disabled - enable in Farcaster menu"}
            </p>
          </div>
          <div className={`badge ${hasNotificationToken ? "badge-success" : "badge-warning"}`}>
            {hasNotificationToken ? "Enabled" : "Disabled"}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-info/10 border border-info/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Settings size={16} className="text-info mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-info mb-2">How to enable notifications:</p>
              <ol className="text-xs text-base-content/70 space-y-1 list-decimal list-inside">
                <li>Tap the three dots (⋯) in the top right corner</li>
                <li>Look for &ldquo;Turn on notifications&rdquo; option</li>
                <li>Tap to enable notifications for this app</li>
                <li>You&apos;ll receive daily reminders at 9 AM UTC when your UBI is ready</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {hasNotificationToken && (
          <div className="bg-success/10 border border-success/30 rounded-lg p-3">
            <p className="text-xs text-success">
              🎉 Perfect! You&apos;ll receive daily reminders when your GoodDollar UBI is ready to claim. Notifications
              are sent around 9 AM UTC each day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
