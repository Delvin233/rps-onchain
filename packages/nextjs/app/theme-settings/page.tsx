"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Palette, Save } from "lucide-react";
import toast from "react-hot-toast";
import { MdSettingsBackupRestore } from "react-icons/md";
import { useAccount } from "wagmi";
import { CRTToggle } from "~~/components/CRTToggle";
import { ColorThemeSelector } from "~~/components/ColorThemeSelector";
import { FontSizeSlider } from "~~/components/FontSizeSlider";
import { FontThemeSelector } from "~~/components/FontThemeSelector";
import { SpacingScaleSelector } from "~~/components/SpacingScaleSelector";

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-load preferences from cloud if local storage is empty
  useEffect(() => {
    if (!address) return;

    const userKey = address.toLowerCase();
    const hasLocalPrefs = localStorage.getItem(`colorTheme_${userKey}`);

    // Only auto-load if user has no local preferences
    if (!hasLocalPrefs) {
      fetch(`/api/user-preferences?address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.preferences) {
            const { colorTheme, fontTheme, spacingScale, fontSizeOverride, crtEffect } = data.preferences;
            localStorage.setItem(`colorTheme_${userKey}`, colorTheme);
            localStorage.setItem(`fontTheme_${userKey}`, fontTheme);
            localStorage.setItem(`spacingScale_${userKey}`, spacingScale);
            localStorage.setItem(`fontSizeOverride_${userKey}`, fontSizeOverride.toString());
            localStorage.setItem(`crtEffect_${userKey}`, crtEffect.toString());
            toast.success("Loaded your saved preferences from cloud");
            setTimeout(() => window.location.reload(), 1000);
          }
        })
        .catch(err => console.error("Failed to auto-load preferences:", err));
    }
  }, [address]);

  const handleLoadPreferences = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/user-preferences?address=${address}`);
      const data = await response.json();

      if (data.preferences) {
        const userKey = address.toLowerCase();
        const { colorTheme, fontTheme, spacingScale, fontSizeOverride, crtEffect } = data.preferences;

        // Apply preferences to localStorage
        localStorage.setItem(`colorTheme_${userKey}`, colorTheme);
        localStorage.setItem(`fontTheme_${userKey}`, fontTheme);
        localStorage.setItem(`spacingScale_${userKey}`, spacingScale);
        localStorage.setItem(`fontSizeOverride_${userKey}`, fontSizeOverride.toString());
        localStorage.setItem(`crtEffect_${userKey}`, crtEffect.toString());

        toast.success("Preferences loaded from cloud! Reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("No saved preferences found in cloud");
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!address) return;

    setSaving(true);
    try {
      const userKey = address.toLowerCase();
      const colorTheme = localStorage.getItem(`colorTheme_${userKey}`) || "delvin233";
      const fontTheme = localStorage.getItem(`fontTheme_${userKey}`) || "futuristic";
      const spacingScale = localStorage.getItem(`spacingScale_${userKey}`) || "comfortable";
      const fontSizeOverride = parseInt(localStorage.getItem(`fontSizeOverride_${userKey}`) || "100");
      const crtEffect = localStorage.getItem(`crtEffect_${userKey}`) === "true";

      await fetch("/api/user-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, colorTheme, fontTheme, spacingScale, fontSizeOverride, crtEffect }),
      });

      setSaved(true);
      toast.success("Preferences saved to cloud!");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 pt-4 lg:pt-0 pb-16 lg:pb-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
            <ArrowLeft size={20} />
          </button>
          <Palette className="text-primary" size={32} />
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
            Theme Settings
          </h1>
        </div>

        <p className="text-base-content/60 mb-6" style={{ fontSize: "calc(1rem * var(--font-size-override, 1))" }}>
          Customize your gaming experience with colors, fonts and spacing.
        </p>

        <div className="mb-4">
          <ColorThemeSelector />
        </div>

        <div className="mb-4">
          <FontThemeSelector />
        </div>

        <div className="mb-4">
          <FontSizeSlider />
        </div>

        <div className="mb-4">
          <SpacingScaleSelector />
        </div>

        <div className="mb-4">
          <CRTToggle />
        </div>

        {address && (
          <>
            <button onClick={handleSavePreferences} disabled={saving || saved} className="btn btn-primary w-full mb-4">
              {saved ? (
                <>
                  <Check size={20} />
                  Saved to Cloud!
                </>
              ) : (
                <>
                  <Save size={20} />
                  {saving ? "Saving..." : "Save Preferences to Cloud"}
                </>
              )}
            </button>
            <button
              onClick={handleLoadPreferences}
              disabled={loading}
              className="btn btn-outline btn-sm w-full mb-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <MdSettingsBackupRestore size={18} />
                  Restore from Cloud (Overwrite Local)
                </>
              )}
            </button>
          </>
        )}

        {!address && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4 text-center">
            <p className="text-warning" style={{ fontSize: "calc(0.875rem * var(--font-size-override, 1))" }}>
              💡 Connect wallet to sync preferences across devices
            </p>
          </div>
        )}

        <div className="bg-card/30 border border-border/50 rounded-xl p-6 text-center">
          <p className="text-base-content/60" style={{ fontSize: "calc(1rem * var(--font-size-override, 1))" }}>
            Color themes are now available above!
          </p>
        </div>
      </div>
    </div>
  );
}
