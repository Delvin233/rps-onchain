/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */
"use client";

import { useEffect, useState } from "react";
import { cleanReferralFromUrl, getReferrerFromUrl } from "~~/utils/referralUtils";

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

/**
 * Referral Banner Component
 *
 * Shows a welcome message to users who were referred by someone.
 * Part of the viral growth system - encourages engagement from referred users.
 */

export default function ReferralBanner() {
  const [referrer, setReferrer] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const referrerAddress = getReferrerFromUrl();
    if (referrerAddress) {
      setReferrer(referrerAddress);
      setIsVisible(true);

      // Clean the URL after processing
      cleanReferralFromUrl();

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible || !referrer) return null;

  return (
    <div className="alert alert-success mb-4 shadow-lg">
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="ml-3">
          <h3 className="font-bold">Welcome! 🎉</h3>
          <div className="text-sm">
            You&apos;ve been invited by{" "}
            <span className="font-mono text-xs bg-base-200 px-2 py-1 rounded">
              {referrer.slice(0, 6)}...{referrer.slice(-4)}
            </span>
            <br />
            Play games and both of you can earn GoodDollar rewards!
          </div>
        </div>
        <button className="btn btn-sm btn-ghost ml-auto" onClick={() => setIsVisible(false)}>
          ✕
        </button>
      </div>
    </div>
  );
}
