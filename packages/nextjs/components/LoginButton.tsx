"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

interface LoginButtonProps {
  size?: "sm" | "lg";
}

const LoginButtonClient = dynamic(
  () => import("./LoginButtonClient").then(mod => ({ default: mod.LoginButtonClient })),
  {
    ssr: false,
  },
);

const LoadingButton = ({ size = "lg" }: LoginButtonProps) => {
  const sizeClasses =
    size === "sm"
      ? "text-sm font-semibold rounded-lg py-2 px-6"
      : "text-lg font-semibold rounded-xl py-4 w-full max-w-md";

  return (
    <button
      disabled
      className={`hover:scale-105 transform transition-all duration-200 opacity-50 cursor-not-allowed ${sizeClasses}`}
      style={{
        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
        color: "var(--color-primary-content)",
      }}
    >
      Login
    </button>
  );
};

export const LoginButton = ({ size = "lg" }: LoginButtonProps) => {
  return (
    <Suspense fallback={<LoadingButton size={size} />}>
      <LoginButtonClient size={size} />
    </Suspense>
  );
};
