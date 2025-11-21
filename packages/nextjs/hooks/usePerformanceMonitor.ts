// Performance monitoring hook - track FPS and memory
import { useEffect, useState } from "react";

interface PerformanceMetrics {
  fps: number;
  memory: number; // MB
  frameTime: number; // ms
}

export function usePerformanceMonitor(enabled = false) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    frameTime: 16.67,
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrame = (currentTime: number) => {
      frameCount++;
      const elapsed = currentTime - lastTime;

      // Update every second
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        const frameTime = elapsed / frameCount;

        // Get memory if available
        const memory = (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
          : 0;

        setMetrics({ fps, memory, frameTime });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFrame);
    };

    animationId = requestAnimationFrame(measureFrame);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  return metrics;
}
