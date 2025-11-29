"use client";

import dynamic from "next/dynamic";

const LoginButtonClient = dynamic(
  () => import("./LoginButtonClient").then(mod => ({ default: mod.LoginButtonClient })),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="hover:scale-105 transform transition-all duration-200 text-base font-semibold rounded-xl py-3 px-12 mx-auto opacity-50 cursor-not-allowed"
        style={{
          background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
          color: "var(--color-primary-content)",
        }}
      >
        Login
      </button>
    ),
  },
);

export const LoginButton = () => {
  return <LoginButtonClient />;
};
