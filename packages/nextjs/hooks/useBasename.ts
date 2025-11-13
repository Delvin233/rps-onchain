"use client";

import { useEffect, useState } from "react";

export const useBasename = (address: string | undefined) => {
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBasename(null);
      return;
    }

    const fetchBasename = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://resolver-api.basename.app/v1/name/${address}`);
        if (response.ok) {
          const data = await response.json();
          setBasename(data.name || null);
        } else {
          setBasename(null);
        }
      } catch {
        setBasename(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBasename();
  }, [address]);

  return { basename, isLoading };
};
