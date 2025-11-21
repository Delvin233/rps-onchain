// Hook for device-aware settings
import { useEffect, useState } from "react";
import { detectDeviceCapability, getOptimizedSettings } from "~~/utils/deviceCapability";

export function useDeviceSettings() {
  const [settings, setSettings] = useState(() => {
    const capability = detectDeviceCapability();
    return getOptimizedSettings(capability);
  });

  const [capability, setCapability] = useState(() => detectDeviceCapability());

  useEffect(() => {
    // Re-detect on network change
    const connection = (navigator as any).connection;
    if (connection) {
      const handleChange = () => {
        const newCapability = detectDeviceCapability();
        setCapability(newCapability);
        setSettings(getOptimizedSettings(newCapability));
      };

      connection.addEventListener("change", handleChange);
      return () => connection.removeEventListener("change", handleChange);
    }
  }, []);

  return { settings, capability };
}
