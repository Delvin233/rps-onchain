"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);

    // Filter out known non-critical errors
    const errorMessage = error.message || error.toString();
    if (
      errorMessage.includes("Failed to find Server Action") ||
      errorMessage.includes("indexedDB is not defined") ||
      errorMessage.includes("ReferenceError: indexedDB is not defined")
    ) {
      // These are known issues that don't affect functionality
      console.warn("Known non-critical error filtered:", errorMessage);
      return;
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
            <p className="text-gray-600 mb-4">We&apos;re sorry, but something unexpected happened.</p>
            <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
