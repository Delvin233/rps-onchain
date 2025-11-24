"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Palette, Save } from "lucide-react";
import toast from "react-hot-toast";
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

  const handleSavePreferences = async () => {
    if (!address) return;

    setSaving(true);
    try {
      const colorTheme = localStorage.getItem("colorTheme") || "delvin233";
      const fontTheme = localStorage.getItem("fontTheme") || "futuristic";
      const spacingScale = localStorage.getItem("spacingScale") || "comfortable";
      const fontSizeOverride = parseInt(localStorage.getItem("fontSizeOverride") || "100");

      await fetch("/api/user-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, colorTheme, fontTheme, spacingScale, fontSizeOverride }),
      });

      setSaved(true);
      toast.success("Preferences saved! Reloading...");
      setTimeout(() => window.location.reload(), 1000);
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
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)", textShadow: "0 0 20px var(--color-primary)" }}
          >
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
        )}

        {!address && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4 text-center">
            <p className="text-warning" style={{ fontSize: "calc(0.875rem * var(--font-size-override, 1))" }}>
              💡 Connect wallet to sync preferences across devices
            </p>
          </div>
        )}

        <div className="bg-card/30 backdrop-blur border border-border/50 rounded-xl p-6 text-center">
          <p className="text-base-content/60" style={{ fontSize: "calc(1rem * var(--font-size-override, 1))" }}>
            Color themes are now available above!
          </p>
        </div>
      </div>
    </div>
  );
}
