"use client";

import { useEffect } from "react";
import { useAuth } from "~~/contexts/AuthContext";
import { getActiveColorTheme } from "~~/styles/colorThemes";

export const ColorLoader = () => {
  const { address } = useAuth();

  useEffect(() => {
    // Skip if address hasn't actually changed (prevent flash on navigation)
    if (typeof window !== "undefined" && (window as any).__lastColorThemeAddress === address) {
      return;
    }
    (window as any).__lastColorThemeAddress = address;

    const colorTheme = getActiveColorTheme(address);
    const root = document.documentElement;

    // Set CSS variables directly
    root.style.setProperty("--theme-primary", colorTheme.primary);
    root.style.setProperty("--theme-secondary", colorTheme.secondary);
    root.style.setProperty("--theme-accent", colorTheme.accent);
    root.style.setProperty("--theme-background", colorTheme.background);
    root.style.setProperty("--theme-background-alt", colorTheme.backgroundAlt);
    root.style.setProperty("--theme-card", colorTheme.card);
    root.style.setProperty("--theme-border", colorTheme.border);
    root.style.setProperty("--theme-text", colorTheme.text);
    root.style.setProperty("--theme-text-muted", colorTheme.textMuted);
    root.style.setProperty("--theme-success", colorTheme.success);
    root.style.setProperty("--theme-error", colorTheme.error);
    root.style.setProperty("--theme-warning", colorTheme.warning);

    // DaisyUI overrides
    root.style.setProperty("--color-primary", colorTheme.primary);
    root.style.setProperty("--color-secondary", colorTheme.secondary);
    root.style.setProperty("--color-accent", colorTheme.accent);
    root.style.setProperty("--color-base-100", colorTheme.backgroundAlt);
    root.style.setProperty("--color-base-200", colorTheme.background);
    root.style.setProperty("--color-base-300", colorTheme.card);
    root.style.setProperty("--color-base-content", colorTheme.text);
    root.style.setProperty("--color-success", colorTheme.success);
    root.style.setProperty("--color-error", colorTheme.error);
    root.style.setProperty("--color-warning", colorTheme.warning);

    // Add static styles once
    if (!document.getElementById("color-theme-styles")) {
      const style = document.createElement("style");
      style.id = "color-theme-styles";
      style.textContent = `
        body { background-color: var(--theme-background) !important; color: var(--theme-text) !important; }
        .text-primary { color: var(--theme-primary) !important; }
        .text-secondary { color: var(--theme-secondary) !important; }
        .text-accent { color: var(--theme-accent) !important; }
        .text-success { color: var(--theme-success) !important; }
        .text-error { color: var(--theme-error) !important; }
        .text-warning { color: var(--theme-warning) !important; }
        .bg-primary { background-color: var(--theme-primary) !important; }
        .bg-secondary { background-color: var(--theme-secondary) !important; }
        .bg-accent { background-color: var(--theme-accent) !important; }
        .bg-base-100 { background-color: var(--theme-background-alt) !important; }
        .bg-base-200 { background-color: var(--theme-background) !important; }
        .bg-base-300 { background-color: var(--theme-card) !important; }
        .border-primary { border-color: var(--theme-primary) !important; }
        .border-secondary { border-color: var(--theme-secondary) !important; }
        .border-border { border-color: var(--theme-border) !important; }
        .text-glow-primary { color: var(--theme-primary) !important; }
        .shadow-glow-primary { box-shadow: none !important; }
        .bg-gradient-primary { background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%) !important; }
        .btn-primary { background-color: var(--theme-primary) !important; border-color: var(--theme-primary) !important; }
        .btn-secondary { background-color: var(--theme-secondary) !important; border-color: var(--theme-secondary) !important; }
        .btn-accent { background-color: var(--theme-accent) !important; border-color: var(--theme-accent) !important; }
        .badge-primary { background-color: var(--theme-primary) !important; border-color: var(--theme-primary) !important; }
        /* Opacity support for MiniPay */
        .bg-card\\/50 { background-color: rgba(var(--theme-card-rgb, 30, 41, 59), 0.5) !important; }
        .bg-primary\\/10 { background-color: rgba(var(--theme-primary-rgb, 16, 185, 129), 0.1) !important; }
        .bg-primary\\/20 { background-color: rgba(var(--theme-primary-rgb, 16, 185, 129), 0.2) !important; }
        .bg-secondary\\/10 { background-color: rgba(var(--theme-secondary-rgb, 251, 146, 60), 0.1) !important; }
        .bg-secondary\\/20 { background-color: rgba(var(--theme-secondary-rgb, 251, 146, 60), 0.2) !important; }
        .bg-accent\\/10 { background-color: rgba(var(--theme-accent-rgb, 59, 130, 246), 0.1) !important; }
        .bg-accent\\/20 { background-color: rgba(var(--theme-accent-rgb, 59, 130, 246), 0.2) !important; }
        .bg-info\\/10 { background-color: rgba(var(--theme-accent-rgb, 59, 130, 246), 0.1) !important; }
        .border-primary\\/20 { border-color: rgba(var(--theme-primary-rgb, 16, 185, 129), 0.2) !important; }
        .border-primary\\/30 { border-color: rgba(var(--theme-primary-rgb, 16, 185, 129), 0.3) !important; }
        .border-primary\\/50 { border-color: rgba(var(--theme-primary-rgb, 16, 185, 129), 0.5) !important; }
        .border-secondary\\/20 { border-color: rgba(var(--theme-secondary-rgb, 251, 146, 60), 0.2) !important; }
        .border-secondary\\/50 { border-color: rgba(var(--theme-secondary-rgb, 251, 146, 60), 0.5) !important; }
        .border-accent\\/20 { border-color: rgba(var(--theme-accent-rgb, 59, 130, 246), 0.2) !important; }
        .border-accent\\/50 { border-color: rgba(var(--theme-accent-rgb, 59, 130, 246), 0.5) !important; }
        .border-info\\/30 { border-color: rgba(var(--theme-accent-rgb, 59, 130, 246), 0.3) !important; }
      `;
      document.head.appendChild(style);
    }
  }, [address]);

  return null;
};
