// Import polyfills first to prevent SSR errors
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BaseAppReady } from "~~/components/BaseAppReady";
import { ErrorBoundary } from "~~/components/ErrorBoundary";
import { HideLoader } from "~~/components/HideLoader";
import { MatchSyncProvider } from "~~/components/MatchSyncProvider";
import { PreferencesSync } from "~~/components/PreferencesSync";
import { ResponsiveLayout } from "~~/components/ResponsiveLayout";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ServiceInitializer } from "~~/components/ServiceInitializer";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { AuthProvider } from "~~/contexts/AuthContext";
import { FarcasterProvider } from "~~/contexts/FarcasterContext";
import "~~/lib/polyfills";
import "~~/styles/globals.css";
import { registerServiceWorker } from "~~/utils/registerSW";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

const CRTEffect = dynamic(() => import("~~/components/CRTEffect").then(mod => ({ default: mod.CRTEffect })));

const OverlayProvider = dynamic(() =>
  import("~~/components/overlays/OverlayManager").then(mod => ({ default: mod.OverlayProvider })),
);

const appUrl = process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz";

const baseMetadata = getMetadata({
  title: "RPS-onChain",
  description: "Rock Paper Scissors on-chain game with Ai single player mode and PVP mode",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  ...baseMetadata,
  manifest: "/rpsOnchainFavicons/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RPS-onChain",
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${appUrl}/images/frame-preview.png`,
      button: {
        title: "Play RPS",
        action: {
          type: "launch_miniapp",
          name: "RPS-onChain",
          url: appUrl,
          splashImageUrl: `${appUrl}/images/splash.png`,
          splashBackgroundColor: "#0c0a09",
        },
      },
    }),
  },
};

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  // Register service worker on client
  if (typeof window !== "undefined") {
    registerServiceWorker();
  }

  return (
    <html suppressHydrationWarning className={``}>
      <head>
        {/* CRITICAL: Theme script must run FIRST to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window === 'undefined' || !localStorage) return;
                  const colorTheme = localStorage.getItem('colorTheme') || 'delvin233';
                  const fontTheme = localStorage.getItem('fontTheme') || 'futuristic';
                  const spacingScale = localStorage.getItem('spacingScale') || 'comfortable';
                  const fontSizeOverride = localStorage.getItem('fontSizeOverride');
                  
                  const colors = {
                    delvin233: { primary: '#10b981', secondary: '#6ee7b7', bg: '#0a0a0a', bgAlt: '#171717', card: '#1f1f1f', text: '#f5f5f5' },
                    neonCyberpunk: { primary: '#34d399', secondary: '#60a5fa', bg: '#0f172a', bgAlt: '#1e293b', card: '#1e293b', text: '#f5f5f4' },
                    oceanBreeze: { primary: '#06b6d4', secondary: '#3b82f6', bg: '#0c1222', bgAlt: '#1a2332', card: '#1a2332', text: '#e0f2fe' },
                    sunsetGlow: { primary: '#f59e0b', secondary: '#ef4444', bg: '#1c0f0a', bgAlt: '#2d1810', card: '#2d1810', text: '#fef3c7' },
                    forestNight: { primary: '#10b981', secondary: '#059669', bg: '#0a1f1a', bgAlt: '#0f2f27', card: '#0f2f27', text: '#d1fae5' },
                    royalPurple: { primary: '#8b5cf6', secondary: '#a78bfa', bg: '#1a0f2e', bgAlt: '#2d1b4e', card: '#2d1b4e', text: '#f3e8ff' },
                    fireIce: { primary: '#ef4444', secondary: '#06b6d4', bg: '#1a0a0a', bgAlt: '#2d1414', card: '#2d1414', text: '#fef2f2' },
                    monochromePro: { primary: '#6b7280', secondary: '#9ca3af', bg: '#0a0a0a', bgAlt: '#1a1a1a', card: '#1a1a1a', text: '#f5f5f5' },
                    retroArcade: { primary: '#fbbf24', secondary: '#f59e0b', bg: '#1a0f00', bgAlt: '#2d1a00', card: '#2d1a00', text: '#fef3c7' },
                  };
                  
                  const fonts = {
                    futuristic: { url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap', heading: 'Orbitron', body: 'Rajdhani', mono: 'JetBrains Mono', multiplier: 1.2 },
                    modernWeb3: { url: 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap', heading: 'Sora', body: 'DM Sans', mono: 'JetBrains Mono', multiplier: 1.2 },
                    retroArcade: { url: 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&family=Courier+Prime:wght@400;700&display=swap', heading: 'Silkscreen', body: 'VT323', mono: 'Courier Prime', multiplier: 1.2 },
                    cleanModern: { url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600;700&display=swap', heading: 'Plus Jakarta Sans', body: 'Inter', mono: 'Fira Code', multiplier: 1.2 },
                    techForward: { url: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600;700&display=swap', heading: 'Syne', body: 'Manrope', mono: 'Source Code Pro', multiplier: 1.2 },
                    cyberpunk: { url: 'https://fonts.googleapis.com/css2?family=Teko:wght@300;400;500;600;700&family=Electrolize&family=Azeret+Mono:wght@400;500;600;700&display=swap', heading: 'Teko', body: 'Electrolize', mono: 'Azeret Mono', multiplier: 1.2 },
                    minimalPro: { url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Work+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap', heading: 'Outfit', body: 'Work Sans', mono: 'IBM Plex Mono', multiplier: 1.2 },
                    neonGaming: { url: 'https://fonts.googleapis.com/css2?family=Bungee&family=Kanit:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;500;600;700&display=swap', heading: 'Bungee', body: 'Kanit', mono: 'Roboto Mono', multiplier: 1.2 },
                  };
                  
                  const spacing = {
                    compact: { padding: '0.75rem', cardGap: '0.5rem', sectionGap: '0.75rem', innerGap: '0.5rem' },
                    comfortable: { padding: '1rem', cardGap: '0.75rem', sectionGap: '1rem', innerGap: '0.75rem' },
                    spacious: { padding: '1.5rem', cardGap: '1rem', sectionGap: '1.5rem', innerGap: '1rem' },
                  };
                  
                  const c = colors[colorTheme] || colors.delvin233;
                  const f = fonts[fontTheme] || fonts.futuristic;
                  const s = spacing[spacingScale] || spacing.comfortable;
                  const fsOverride = fontSizeOverride ? parseInt(fontSizeOverride) / 100 : 1;
                  
                  const root = document.documentElement.style;
                  root.setProperty('--theme-primary', c.primary);
                  root.setProperty('--theme-secondary', c.secondary);
                  root.setProperty('--theme-background', c.bg);
                  root.setProperty('--theme-background-alt', c.bgAlt);
                  root.setProperty('--theme-card', c.card);
                  root.setProperty('--theme-text', c.text);
                  root.setProperty('--color-base-100', c.bgAlt);
                  root.setProperty('--color-base-200', c.bg);
                  root.setProperty('--color-base-300', c.card);
                  root.setProperty('--color-primary', c.primary);
                  root.setProperty('--color-secondary', c.secondary);
                  root.setProperty('--color-base-content', c.text);
                  root.setProperty('--font-heading', "'" + f.heading + "', system-ui, sans-serif");
                  root.setProperty('--font-body', "'" + f.body + "', system-ui, sans-serif");
                  root.setProperty('--font-mono', "'" + f.mono + "', monospace");
                  root.setProperty('--font-size-multiplier', f.multiplier.toString());
                  root.setProperty('--font-size-override', fsOverride.toString());
                  root.setProperty('--card-padding', s.padding);
                  root.setProperty('--card-gap', s.cardGap);
                  root.setProperty('--section-gap', s.sectionGap);
                  root.setProperty('--inner-gap', s.innerGap);
                  document.body.style.backgroundColor = c.bg;
                  document.body.style.color = c.text;
                  document.body.style.fontFamily = "'" + f.body + "', system-ui, sans-serif";
                  
                  if (!document.querySelector('link[href="' + f.url + '"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = f.url;
                    link.media = 'print';
                    link.onload = function() { this.media = 'all'; };
                    document.head.appendChild(link);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="icon" href="/rpsOnchainFavicons/favicon.ico" sizes="any" />
        <link rel="icon" href="/rpsOnchainFavicons/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/rpsOnchainFavicons/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/rpsOnchainFavicons/apple-touch-icon.png" />
        <link rel="manifest" href="/rpsOnchainFavicons/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
        <link rel="dns-prefetch" href="https://gateway.pinata.cloud" />
        <link rel="dns-prefetch" href="https://forno.celo.org" />
        <link rel="dns-prefetch" href="https://mainnet.base.org" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // CRITICAL: Prevent indexedDB access during SSR/build
              (function() {
                // Server-side polyfill
                if (typeof window === 'undefined' && typeof global !== 'undefined') {
                  global.indexedDB = undefined;
                  global.IDBKeyRange = undefined;
                  global.IDBCursor = undefined;
                  global.IDBDatabase = undefined;
                  global.IDBTransaction = undefined;
                  global.IDBObjectStore = undefined;
                  global.IDBRequest = undefined;
                }
                
                // Suppress known non-critical console errors
                const originalError = console.error;
                console.error = function(...args) {
                  const msg = args[0]?.toString() || '';
                  // Filter out known non-critical errors
                  if (
                    msg.includes('fuse-rpc.gateway.pokt.network') ||
                    msg.includes('Cross-Origin-Opener-Policy') ||
                    msg.includes('preloaded using link preload') ||
                    msg.includes('Minified React error #418') ||
                    msg.includes('Failed to find Server Action') ||
                    msg.includes('indexedDB is not defined') ||
                    msg.includes('ReferenceError: indexedDB is not defined') ||
                    msg.includes('Please call "createAppKit" before using') ||
                    msg.includes('has not been authorized yet') ||
                    msg.includes('The source') && msg.includes('has not been authorized')
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                // Handle unhandled promise rejections
                if (typeof window !== 'undefined') {
                  window.addEventListener('unhandledrejection', function(event) {
                    const msg = event.reason?.message || event.reason?.toString() || '';
                    if (
                      msg.includes('indexedDB is not defined') ||
                      msg.includes('Failed to find Server Action') ||
                      msg.includes('Please call "createAppKit" before using') ||
                      msg.includes('has not been authorized yet')
                    ) {
                      event.preventDefault();
                      console.warn('Filtered unhandled rejection:', msg);
                    }
                  });
                }
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Loading skeleton with theme colors */
              #app-loading {
                position: fixed;
                inset: 0;
                background: var(--theme-background, #0a0a0a);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                transition: opacity 0.3s ease-out;
              }
              #app-loading.loaded {
                opacity: 0;
                pointer-events: none;
              }
              .loading-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid var(--theme-card, #1f1f1f);
                border-top-color: var(--theme-primary, #10b981);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `,
          }}
        />
      </head>
      <body>
        {/* Loading skeleton - hidden once React hydrates */}
        <div id="app-loading">
          <div className="loading-spinner"></div>
        </div>

        <BaseAppReady />
        <HideLoader />

        {/* Initialize background services */}
        <ServiceInitializer />

        <ErrorBoundary>
          <CRTEffect />
          <ThemeProvider enableSystem>
            <ScaffoldEthAppWithProviders>
              <FarcasterProvider>
                <AuthProvider>
                  <PreferencesSync />
                  <MatchSyncProvider>
                    <OverlayProvider>
                      <ResponsiveLayout>{children}</ResponsiveLayout>
                    </OverlayProvider>
                  </MatchSyncProvider>
                </AuthProvider>
              </FarcasterProvider>
            </ScaffoldEthAppWithProviders>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
