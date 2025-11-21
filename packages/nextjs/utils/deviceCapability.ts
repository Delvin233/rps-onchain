// Device capability detection - adjust features based on device power
// Like how Nintendo games adjust graphics for Switch vs Switch Lite

export interface DeviceCapability {
  tier: "low" | "medium" | "high";
  memory: number; // GB
  cores: number;
  gpu: "low" | "medium" | "high";
  connection: "slow" | "medium" | "fast";
  supportsWebP: boolean;
  supportsServiceWorker: boolean;
}

export function detectDeviceCapability(): DeviceCapability {
  if (typeof window === "undefined") {
    return getDefaultCapability();
  }

  // Detect memory
  const memory = (navigator as any).deviceMemory || 4;

  // Detect CPU cores
  const cores = navigator.hardwareConcurrency || 4;

  // Detect GPU tier (rough estimate)
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  let gpu: "low" | "medium" | "high" = "medium";

  if (gl) {
    const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      if (renderer.includes("intel") || renderer.includes("mali")) {
        gpu = "low";
      } else if (renderer.includes("nvidia") || renderer.includes("amd") || renderer.includes("apple")) {
        gpu = "high";
      }
    }
  }

  // Detect connection speed
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  let connectionSpeed: "slow" | "medium" | "fast" = "medium";

  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      connectionSpeed = "slow";
    } else if (effectiveType === "4g") {
      connectionSpeed = "fast";
    }
  }

  // Determine tier
  let tier: "low" | "medium" | "high" = "medium";
  if (memory <= 2 || cores <= 2 || gpu === "low") {
    tier = "low";
  } else if (memory >= 8 && cores >= 8 && gpu === "high") {
    tier = "high";
  }

  return {
    tier,
    memory,
    cores,
    gpu,
    connection: connectionSpeed,
    supportsWebP: checkWebPSupport(),
    supportsServiceWorker: "serviceWorker" in navigator,
  };
}

function checkWebPSupport(): boolean {
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
}

function getDefaultCapability(): DeviceCapability {
  return {
    tier: "medium",
    memory: 4,
    cores: 4,
    gpu: "medium",
    connection: "medium",
    supportsWebP: true,
    supportsServiceWorker: true,
  };
}

// Get optimized settings based on device
export function getOptimizedSettings(capability: DeviceCapability) {
  switch (capability.tier) {
    case "low":
      return {
        animations: false,
        particleEffects: false,
        imageQuality: "low",
        pollingInterval: 3000, // 3s
        cacheSize: 50,
        prefetch: false,
      };

    case "medium":
      return {
        animations: true,
        particleEffects: false,
        imageQuality: "medium",
        pollingInterval: 1500, // 1.5s
        cacheSize: 100,
        prefetch: true,
      };

    case "high":
      return {
        animations: true,
        particleEffects: true,
        imageQuality: "high",
        pollingInterval: 1000, // 1s
        cacheSize: 200,
        prefetch: true,
      };
  }
}
