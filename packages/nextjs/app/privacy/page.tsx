export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-base-200 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--color-primary)" }}>
        Privacy Policy
      </h1>
      <p className="text-sm text-base-content/60 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6 text-base-content/80">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p>
            This Privacy Policy explains how RPS-onChain (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;)
            collects, uses, and protects your information when you use our application. We are committed to protecting
            your privacy and being transparent about our data practices.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

          <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Wallet Address</h3>
          <p>
            When you connect your wallet to use the App, we collect your public wallet address. This is necessary to
            enable gameplay and track your statistics.
          </p>

          <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Game Data</h3>
          <p>We collect and store:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Match results (wins, losses, ties)</li>
            <li>Game moves (rock, paper, scissors selections)</li>
            <li>Room codes and game sessions</li>
            <li>Timestamps of gameplay</li>
            <li>Player statistics and rankings</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">2.3 Blockchain Data</h3>
          <p>
            When you choose to publish matches on-chain, this data becomes permanently recorded on the public blockchain
            (Celo or Base) and is accessible to anyone.
          </p>

          <h3 className="text-lg font-semibold mt-4 mb-2">2.4 Technical Data</h3>
          <p>We may collect:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>IP address (for security and analytics)</li>
            <li>Usage patterns and interactions with the App</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">2.5 Optional Identity Data</h3>
          <p>
            If you choose to use ENS names, Basenames, or Farcaster profiles, we may display this publicly associated
            information (username, profile picture) to enhance your gaming experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Enable gameplay and match users for multiplayer games</li>
            <li>Track and display player statistics and rankings</li>
            <li>Store match history for your review</li>
            <li>Improve the App&apos;s functionality and user experience</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Provide customer support</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>

          <h3 className="text-lg font-semibold mt-4 mb-2">4.1 Storage Locations</h3>
          <p>Your data is stored in:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              <strong>Turso Database:</strong> Primary storage for user statistics and match history
            </li>
            <li>
              <strong>Redis:</strong> Temporary storage for active game rooms (7-day retention)
            </li>
            <li>
              <strong>IPFS:</strong> Decentralized backup storage for match data
            </li>
            <li>
              <strong>Blockchain:</strong> Optional permanent storage for published matches (public and immutable)
            </li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">4.2 Security Measures</h3>
          <p>
            We implement industry-standard security measures to protect your data. However, no method of transmission or
            storage is 100% secure. We cannot guarantee absolute security of your information.
          </p>

          <h3 className="text-lg font-semibold mt-4 mb-2">4.3 Private Keys</h3>
          <p>
            We do NOT have access to your wallet&apos;s private keys or funds. Your wallet security is your
            responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Sharing and Disclosure</h2>

          <h3 className="text-lg font-semibold mt-4 mb-2">5.1 Public Information</h3>
          <p>The following information is publicly visible:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Your wallet address (when playing or viewing leaderboards)</li>
            <li>Your game statistics and rankings</li>
            <li>Match results you choose to publish on-chain</li>
            <li>ENS/Basename/Farcaster profile information (if connected)</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">5.2 Third-Party Services</h3>
          <p>We integrate with third-party services that may collect data:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              <strong>Blockchain Networks:</strong> Celo and Base networks process and store transaction data publicly
            </li>
            <li>
              <strong>Wallet Providers:</strong> Your wallet provider may collect data according to their privacy policy
            </li>
            <li>
              <strong>Analytics Services:</strong> We may use analytics to improve the App (anonymized when possible)
            </li>
            <li>
              <strong>Hosting Services:</strong> Vercel hosts our application and may collect technical data
            </li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">5.3 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law, court order, or to protect our rights, property, or
            safety.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>

          <h3 className="text-lg font-semibold mt-4 mb-2">6.1 Access and Deletion</h3>
          <p>
            You can request access to or deletion of your personal data by contacting us through the support channels.
            Note that blockchain data cannot be deleted once published.
          </p>

          <h3 className="text-lg font-semibold mt-4 mb-2">6.2 Opt-Out</h3>
          <p>
            You can stop using the App at any time. Disconnecting your wallet will prevent further data collection, but
            historical data may be retained for record-keeping.
          </p>

          <h3 className="text-lg font-semibold mt-4 mb-2">6.3 Data Portability</h3>
          <p>
            You can export your match history and statistics. Blockchain data is publicly accessible and can be queried
            directly from the blockchain.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Children&apos;s Privacy</h2>
          <p>
            The App is not intended for users under 13 years of age. We do not knowingly collect personal information
            from children. If you believe a child has provided us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. International Users</h2>
          <p>
            The App is accessible globally. By using the App, you consent to the transfer and processing of your data in
            jurisdictions that may have different data protection laws than your country.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking</h2>
          <p>
            We use local storage and cookies to maintain your session and preferences. You can disable cookies in your
            browser settings, but this may affect App functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Data Retention</h2>
          <p>We retain your data as follows:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              <strong>Active game rooms:</strong> 7 days in Redis cache
            </li>
            <li>
              <strong>Match history:</strong> Indefinitely in Turso and IPFS
            </li>
            <li>
              <strong>Blockchain data:</strong> Permanent and immutable
            </li>
            <li>
              <strong>User statistics:</strong> Until deletion is requested
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
            &quot;Last Updated&quot; date. Your continued use of the App after changes constitutes acceptance of the
            updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Independent Operation</h2>
          <p>
            RPS-onChain is independently operated and is not affiliated with Opera, MiniPay, or any platform where the
            App may be listed. This Privacy Policy applies only to RPS-onChain and not to any third-party platforms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us
            through the support channels provided in the App.
          </p>
        </section>
      </div>
    </div>
  );
}
