"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Palette } from "lucide-react";
import { FontSizeSlider } from "~~/components/FontSizeSlider";
import { FontThemeSelector } from "~~/components/FontThemeSelector";
import { SpacingScaleSelector } from "~~/components/SpacingScaleSelector";

export default function ThemeSettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-base-200 p-6 pt-12 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn btn-sm btn-ghost">
            <ArrowLeft size={20} />
          </button>
          <Palette className="text-primary" size={32} />
          <h1 className="text-3xl font-bold text-glow-primary">Theme Settings</h1>
        </div>

        <p className="text-base-content/60 mb-6">Customize your gaming experience with fonts and spacing.</p>

        <div className="mb-4">
          <FontThemeSelector />
        </div>

        <div className="mb-4">
          <FontSizeSlider />
        </div>

        <div className="mb-4">
          <SpacingScaleSelector />
        </div>

        <div className="bg-card/30 backdrop-blur border border-border/50 rounded-xl p-6 text-center">
          <p className="text-sm text-base-content/60">🎨 Color themes coming soon!</p>
        </div>
      </div>
    </div>
  );
}
