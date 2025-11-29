"use client";

import { useAppKit } from "@reown/appkit/react";

interface LoginButtonClientProps {
  size?: "sm" | "lg";
}

export const LoginButtonClient = ({ size = "lg" }: LoginButtonClientProps) => {
  const { open } = useAppKit();

  const sizeClasses =
    size === "sm"
      ? "text-sm font-semibold rounded-lg py-2 px-6"
      : "text-lg font-semibold rounded-xl py-4 w-full max-w-md";

  return (
    <button
      onClick={() => open()}
      className={`hover:scale-105 transform transition-all duration-200 ${sizeClasses}`}
      style={{
        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
        color: "var(--color-primary-content)",
      }}
    >
      Login
    </button>
  );
};
