import dynamic from "next/dynamic";
import "@rainbow-me/rainbowkit/styles.css";
import { Analytics } from "@vercel/analytics/next";
import { BaseAppReady } from "~~/components/BaseAppReady";
import { ColorLoader } from "~~/components/ColorLoader";
import { FontLoader } from "~~/components/FontLoader";
import { FontSizeLoader } from "~~/components/FontSizeLoader";
import { MatchSyncProvider } from "~~/components/MatchSyncProvider";
import { PreferencesSync } from "~~/components/PreferencesSync";
import { ResponsiveLayout } from "~~/components/ResponsiveLayout";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { SpacingLoader } from "~~/components/SpacingLoader";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { AuthProvider } from "~~/contexts/AuthContext";
import { FarcasterProvider } from "~~/contexts/FarcasterContext";
import "~~/styles/globals.css";
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
  return (
    <html suppressHydrationWarning className={``}>
      <head>
        <link rel="icon" href="/rpsOnchainFavicons/favicon.ico" sizes="any" />
        <link rel="icon" href="/rpsOnchainFavicons/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/rpsOnchainFavicons/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/rpsOnchainFavicons/apple-touch-icon.png" />
        <link rel="manifest" href="/rpsOnchainFavicons/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
                  const colorTheme = localStorage.getItem('colorTheme') || 'delvin233';
                  const fontTheme = localStorage.getItem('fontTheme') || 'retroArcade';
                  
                  const colors = {
                    delvin233: { primary: '#10b981', bg: '#0a0a0a', text: '#f5f5f5' },
                    neonCyberpunk: { primary: '#34d399', bg: '#0f172a', text: '#f5f5f4' },
                  };
                  
                  const fonts = {
                    futuristic: { url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap' },
                    retroArcade: { url: 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&family=Courier+Prime:wght@400;700&display=swap' },
                  };
                  
                  const c = colors[colorTheme] || colors.delvin233;
                  const f = fonts[fontTheme] || fonts.retroArcade;
                  
                  document.documentElement.style.setProperty('--theme-primary', c.primary);
                  document.documentElement.style.setProperty('--theme-background', c.bg);
                  document.documentElement.style.setProperty('--color-base-200', c.bg);
                  document.documentElement.style.setProperty('--color-primary', c.primary);
                  
                  const link = document.createElement('link');
                  link.rel = 'stylesheet';
                  link.href = f.url;
                  document.head.appendChild(link);
                } catch (e) {
                  // Ignore errors during SSR
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <BaseAppReady />
        <CRTEffect />
        <ColorLoader />
        <FontLoader />
        <FontSizeLoader />
        <SpacingLoader />
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
        <Analytics />
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
