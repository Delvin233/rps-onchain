"use client";

import { useEffect, useState } from "react";

export const CRTEffect = () => {
  const [crtEnabled, setCrtEnabled] = useState(false);

  useEffect(() => {
    const checkCRT = () => {
      const enabled = localStorage.getItem("crtEffect") === "true";
      setCrtEnabled(enabled);

      if (enabled) {
        document.body.classList.add("crt-active");
      } else {
        document.body.classList.remove("crt-active");
      }
    };

    checkCRT();
    window.addEventListener("storage", checkCRT);

    return () => {
      window.removeEventListener("storage", checkCRT);
      document.body.classList.remove("crt-active");
    };
  }, []);

  if (!crtEnabled) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes flicker {
          0% {
            opacity: 0.97;
          }
          5% {
            opacity: 0.95;
          }
          10% {
            opacity: 0.98;
          }
          15% {
            opacity: 0.96;
          }
          20% {
            opacity: 0.97;
          }
          100% {
            opacity: 0.97;
          }
        }

        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .crt-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }

        .crt-scanlines {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.25) 51%);
          background-size: 100% 4px;
          animation: flicker 0.15s infinite;
        }

        .crt-scanline-moving {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.03) 50%, transparent 100%);
          height: 20%;
          animation: scanline 8s linear infinite;
        }

        .crt-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0, 0, 0, 0.3) 100%);
        }

        .crt-screen-curve {
          position: absolute;
          inset: 0;
          border-radius: 3% / 5%;
          box-shadow:
            inset 0 0 100px rgba(0, 0, 0, 0.5),
            inset 0 0 20px rgba(0, 0, 0, 0.8);
        }

        body.crt-active {
          animation: flicker 0.15s infinite;
        }

        body.crt-active * {
          text-shadow:
            0.06em 0 0 rgba(255, 0, 0, 0.75),
            -0.06em 0 0 rgba(0, 255, 0, 0.75),
            0 0 0 rgba(0, 0, 255, 0.75) !important;
        }

        body.crt-active::before {
          content: " ";
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          background-size: 100% 2px;
          z-index: 2;
          pointer-events: none;
        }
      `}</style>

      <div className="crt-container">
        <div className="crt-scanlines" />
        <div className="crt-scanline-moving" />
        <div className="crt-vignette" />
        <div className="crt-screen-curve" />
      </div>
    </>
  );
};
