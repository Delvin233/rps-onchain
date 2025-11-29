"use client";

import { useAppKit } from "@reown/appkit/react";

export const LoginButtonClient = () => {
  const { open } = useAppKit();

  return (
    <button
      onClick={() => open()}
      className="hover:scale-105 transform transition-all duration-200 text-base font-semibold rounded-xl py-3 px-12 mx-auto"
      style={{
        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
        color: "var(--color-primary-content)",
      }}
    >
      Login
    </button>
  );
};
