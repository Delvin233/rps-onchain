import "@rainbow-me/rainbowkit/styles.css";
import { ColorLoader } from "~~/components/ColorLoader";
import { FontLoader } from "~~/components/FontLoader";
import { FontSizeLoader } from "~~/components/FontSizeLoader";
import { MatchSyncProvider } from "~~/components/MatchSyncProvider";
import { PreferencesSync } from "~~/components/PreferencesSync";
import { ResponsiveLayout } from "~~/components/ResponsiveLayout";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { SpacingLoader } from "~~/components/SpacingLoader";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { OverlayProvider } from "~~/components/overlays/OverlayManager";
import { AuthProvider } from "~~/contexts/AuthContext";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

const appUrl = process.env.NEXT_PUBLIC_URL || "https://www.rpsonchain.xyz";

const baseMetadata = getMetadata({
  title: "RPS-ONCHAIN",
  description: "Rock Paper Scissors on-chain game with Pinata storage",
});

export const metadata = {
  ...baseMetadata,
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/images/frame-preview.png`,
      button: {
        title: "Play RPS",
        action: {
          type: "launch_frame",
          name: "RPS-OnChain",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const colorTheme = localStorage.getItem('colorTheme') || 'delvin233';
                const fontTheme = localStorage.getItem('fontTheme') || 'futuristic';
                const fontSizeOverride = localStorage.getItem('fontSizeOverride') || '100';
                
                const colors = {
                  delvin233: { primary: '#10b981', bg: '#0a0a0a', bgAlt: '#171717', card: '#1f1f1f', text: '#f5f5f5' },
                  neonCyberpunk: { primary: '#34d399', bg: '#0f172a', bgAlt: '#1e293b', card: '#1e293b', text: '#f5f5f4' },
                };
                
                const fonts = {
                  futuristic: { heading: 'Orbitron', body: 'Rajdhani', url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap' },
                  retroArcade: { heading: 'Silkscreen', body: 'VT323', url: 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&family=Courier+Prime:wght@400;700&display=swap' },
                };
                
                const c = colors[colorTheme] || colors.delvin233;
                const f = fonts[fontTheme] || fonts.futuristic;
                
                document.documentElement.style.setProperty('--theme-primary', c.primary);
                document.documentElement.style.setProperty('--theme-background', c.bg);
                document.documentElement.style.setProperty('--color-base-200', c.bg);
                document.documentElement.style.setProperty('--color-primary', c.primary);
                document.body.style.backgroundColor = c.bg;
                document.body.style.color = c.text;
                
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = f.url;
                document.head.appendChild(link);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ColorLoader />
        <FontLoader />
        <FontSizeLoader />
        <SpacingLoader />
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>
            <AuthProvider>
              <PreferencesSync />
              <MatchSyncProvider>
                <OverlayProvider>
                  <ResponsiveLayout>{children}</ResponsiveLayout>
                </OverlayProvider>
              </MatchSyncProvider>
            </AuthProvider>
          </ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
