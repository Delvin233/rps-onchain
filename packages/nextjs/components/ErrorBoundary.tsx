"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Filter out known non-critical errors
    const errorMessage = error.message || error.toString();
    if (
      errorMessage.includes("Failed to find Server Action") ||
      errorMessage.includes("indexedDB is not defined") ||
      errorMessage.includes("ReferenceError: indexedDB is not defined") ||
      errorMessage.includes('Please call "createAppKit" before using') ||
      errorMessage.includes("has not been authorized yet")
    ) {
      console.warn("Known non-critical error filtered in ErrorBoundary:", errorMessage);
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Filter out known non-critical errors
    const errorMessage = error.message || error.toString();
    if (
      errorMessage.includes("Failed to find Server Action") ||
      errorMessage.includes("indexedDB is not defined") ||
      errorMessage.includes("ReferenceError: indexedDB is not defined") ||
      errorMessage.includes('Please call "createAppKit" before using') ||
      errorMessage.includes("has not been authorized yet")
    ) {
      return;
    }

    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">{error.message || "An unexpected error occurred."}</p>
        <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Try again
        </button>
      </div>
    </div>
  );
}
