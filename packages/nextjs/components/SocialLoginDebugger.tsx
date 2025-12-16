"use client";

import { useState } from "react";
import { useConnectedAddress } from "~~/hooks/useConnectedAddress";

export function SocialLoginDebugger() {
  const { address, authMethod } = useConnectedAddress();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/debug-social-login?address=${address}`);
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Debug failed:", error);
      setDebugInfo({ error: "Debug failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const createTestMatch = async () => {
    if (!address) return;

    try {
      const response = await fetch("/api/debug-social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      console.log("Test match created:", data);
      // Re-run debug to see the new match
      await runDebug();
    } catch (error) {
      console.error("Failed to create test match:", error);
    }
  };

  if (!address) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <p className="text-warning">Please connect your wallet to use the debugger</p>
      </div>
    );
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Social Login Debugger</h3>
        <div className="flex gap-2">
          <button onClick={runDebug} disabled={isLoading} className="btn btn-sm btn-primary">
            {isLoading ? "Debugging..." : "Run Debug"}
          </button>
          <button onClick={createTestMatch} className="btn btn-sm btn-secondary">
            Create Test Match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium">Connection Info</h4>
          <div className="bg-base-200 p-3 rounded text-sm space-y-1">
            <p>
              <span className="font-medium">Address:</span> {address}
            </p>
            <p>
              <span className="font-medium">Auth Method:</span> {authMethod || "unknown"}
            </p>
            <p>
              <span className="font-medium">Is Social Login:</span> {authMethod === "wallet" ? "No" : "Yes"}
            </p>
          </div>
        </div>

        {debugInfo && (
          <div className="space-y-2">
            <h4 className="font-medium">Debug Results</h4>
            <div className="bg-base-200 p-3 rounded text-sm space-y-1">
              <p>
                <span className="font-medium">AI Matches Found:</span> {debugInfo.matches?.aiMatches?.count || 0}
              </p>
              <p>
                <span className="font-medium">Multiplayer Matches:</span>{" "}
                {debugInfo.matches?.multiplayerMatches?.count || 0}
              </p>
              <p>
                <span className="font-medium">Redis Keys:</span> {debugInfo.storage?.redis?.keys?.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {debugInfo && (
        <details className="bg-base-200 rounded-lg">
          <summary className="p-3 cursor-pointer font-medium">Raw Debug Data</summary>
          <pre className="p-3 text-xs overflow-auto bg-base-300 rounded-b-lg">{JSON.stringify(debugInfo, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
