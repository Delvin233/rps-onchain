// Route prefetching utility - preload next page on hover
export function prefetchRoute(href: string) {
  if (typeof window === "undefined") return;

  // Use Next.js router prefetch
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  link.as = "document";
  document.head.appendChild(link);

  // Also prefetch API data if needed
  if (href.includes("/profile")) {
    // Prefetch player data
    const address = localStorage.getItem("lastAddress");
    if (address) {
      fetch(`/api/player-data?address=${address}`).catch(() => {});
    }
  }
}

// Debounced prefetch - only prefetch if user hovers for 200ms
export function debouncedPrefetch(href: string, delay = 200) {
  let timeout: NodeJS.Timeout;
  return {
    onMouseEnter: () => {
      timeout = setTimeout(() => prefetchRoute(href), delay);
    },
    onMouseLeave: () => {
      clearTimeout(timeout);
    },
  };
}
