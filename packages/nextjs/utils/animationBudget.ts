// GPU-accelerated animation budget
// Only use transform and opacity for 60fps animations

export const gpuAcceleratedStyles = {
  // Force GPU acceleration
  willChange: "transform, opacity",
  transform: "translateZ(0)",
  backfaceVisibility: "hidden" as const,
  perspective: 1000,
};

// Animation presets optimized for 60fps
export const animations = {
  // Fade in/out
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },

  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  // Slide animations (GPU-accelerated)
  slideUp: {
    initial: { transform: "translateY(20px)", opacity: 0 },
    animate: { transform: "translateY(0)", opacity: 1 },
    transition: { duration: 0.3 },
  },

  slideDown: {
    initial: { transform: "translateY(-20px)", opacity: 0 },
    animate: { transform: "translateY(0)", opacity: 1 },
    transition: { duration: 0.3 },
  },

  // Scale animations
  scaleIn: {
    initial: { transform: "scale(0.9)", opacity: 0 },
    animate: { transform: "scale(1)", opacity: 1 },
    transition: { duration: 0.2 },
  },

  // Bounce (for wins)
  bounce: {
    animate: {
      transform: ["scale(1)", "scale(1.1)", "scale(1)"],
    },
    transition: { duration: 0.5 },
  },

  // Shake (for losses)
  shake: {
    animate: {
      transform: ["translateX(0)", "translateX(-10px)", "translateX(10px)", "translateX(0)"],
    },
    transition: { duration: 0.4 },
  },
};

// Check if animation should be enabled
export function shouldAnimate(deviceTier: "low" | "medium" | "high"): boolean {
  if (deviceTier === "low") return false;

  // Check user preference
  if (typeof window !== "undefined") {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return false;
  }

  return true;
}

// Optimized CSS for animations
export const animationCSS = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      transform: translateY(20px) translateZ(0);
      opacity: 0;
    }
    to { 
      transform: translateY(0) translateZ(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% { 
      transform: scale(1) translateZ(0);
    }
    50% { 
      transform: scale(1.05) translateZ(0);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }

  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  /* GPU acceleration for all animated elements */
  .animate-fade-in,
  .animate-slide-up,
  .animate-pulse {
    will-change: transform, opacity;
    transform: translateZ(0);
    backface-visibility: hidden;
  }
`;
