import "@rainbow-me/rainbowkit/styles.css";
import { MatchSyncProvider } from "~~/components/MatchSyncProvider";
import { MobileLayout } from "~~/components/MobileLayout";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { OverlayProvider } from "~~/components/overlays/OverlayManager";
import { AuthProvider } from "~~/contexts/AuthContext";
import { getActiveTheme } from "~~/styles/fontThemes";
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
  const fontTheme = getActiveTheme();

  return (
    <html suppressHydrationWarning className={``}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontTheme.googleFontsUrl} rel="stylesheet" />
        <style>{`
          :root {
            --font-heading: '${fontTheme.heading}', system-ui, sans-serif;
            --font-body: '${fontTheme.body}', system-ui, sans-serif;
            --font-mono: '${fontTheme.mono}', monospace;
          }
          body {
            font-family: var(--font-body);
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading);
          }
        `}</style>
      </head>
      <body>
        <ThemeProvider enableSystem>
          <div className="flex justify-center h-screen bg-base-300 overflow-hidden">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl h-screen bg-base-200 shadow-2xl relative overflow-y-auto">
              <ScaffoldEthAppWithProviders>
                <AuthProvider>
                  <MatchSyncProvider>
                    <OverlayProvider>
                      <MobileLayout>{children}</MobileLayout>
                    </OverlayProvider>
                  </MatchSyncProvider>
                </AuthProvider>
              </ScaffoldEthAppWithProviders>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
