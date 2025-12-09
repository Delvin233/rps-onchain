import React from "react";
import Link from "next/link";

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <footer className="bg-base-200 border-t border-base-300 py-3 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center items-center gap-3 text-xs md:text-sm text-base-content/50">
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <span className="hidden md:inline">•</span>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="hidden md:inline">•</span>
          <span className="text-center">© {new Date().getFullYear()} RPS-onChain</span>
        </div>
      </div>
    </footer>
  );
};
