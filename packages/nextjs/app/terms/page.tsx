export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-base-200 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--color-primary)" }}>
        Terms of Service
      </h1>
      <p className="text-sm text-base-content/60 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6 text-base-content/80">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using RPS-onChain (&quot;the App&quot;), you accept and agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use the App.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p>
            RPS-onChain is a free-to-play Rock Paper Scissors game built on blockchain technology. The App allows users
            to play against AI opponents or other users through shareable room codes. Match results can optionally be
            published to the blockchain for verification.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. No Gambling or Betting</h2>
          <p>
            RPS-onChain is a free-to-play game with no gambling, betting, or financial wagering features. Users do not
            risk or win money through gameplay. Network fees for blockchain transactions are separate from gameplay and
            are paid to the blockchain network, not to the App operator.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Wallet Connection</h2>
          <p>
            To use the App, you must connect a compatible cryptocurrency wallet. You are solely responsible for
            maintaining the security of your wallet and private keys. The App does not have access to your private keys
            or funds.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Network Fees</h2>
          <p>
            Certain actions (creating rooms, joining rooms, publishing matches) require blockchain transactions that
            incur network fees. These fees are paid to the blockchain network (Celo or Base), not to the App operator.
            Network fees are typically less than $0.01 USD but may vary based on network conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Use the App for any illegal purposes</li>
            <li>Attempt to exploit, hack, or manipulate the App or smart contracts</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Use automated tools or bots to interact with the App</li>
            <li>Impersonate other users or entities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
          <p>
            The App, including its design, code, and content, is owned by the operator. The smart contracts are
            open-source and available for review. You may not copy, modify, or distribute the App without permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
          <p>
            THE APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that the App will
            be error-free, uninterrupted, or secure. Blockchain transactions are irreversible, and we are not
            responsible for user errors or network issues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, the App operator shall not be liable for any indirect, incidental,
            special, or consequential damages arising from your use of the App, including but not limited to loss of
            funds, data, or profits.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Third-Party Services</h2>
          <p>
            The App integrates with third-party services including blockchain networks (Celo, Base), wallet providers,
            and data storage services. We are not responsible for the performance or policies of these third-party
            services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Independent Operation</h2>
          <p>
            RPS-onChain is independently operated and is not affiliated with, endorsed by, or operated by Opera,
            MiniPay, or any other platform where the App may be listed. All app functionality and support are the sole
            responsibility of the App operator.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately
            upon posting. Your continued use of the App after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Termination</h2>
          <p>
            We reserve the right to terminate or suspend access to the App at any time, without notice, for conduct that
            we believe violates these Terms or is harmful to other users or the App.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws, without regard to
            conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">15. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us through the support channels provided in the
            App.
          </p>
        </section>
      </div>
    </div>
  );
}
