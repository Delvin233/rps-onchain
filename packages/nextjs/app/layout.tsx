import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { MobileLayout } from "~~/components/MobileLayout";
import { AuthProvider } from "~~/contexts/AuthContext";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "RPS-ONCHAIN",
  description: "Rock Paper Scissors on-chain game with Pinata storage",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <body>
        <ThemeProvider enableSystem>
          <div className="flex justify-center h-screen bg-base-300 overflow-hidden">
            <div className="w-full max-w-md h-screen bg-base-200 shadow-2xl relative overflow-y-auto">
              <ScaffoldEthAppWithProviders>
                <AuthProvider>
                  <MobileLayout>{children}</MobileLayout>
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
