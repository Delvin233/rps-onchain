// Register service worker
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(registration => {
        console.log("SW registered:", registration);
      })
      .catch(error => {
        console.log("SW registration failed:", error);
      });
  });
}
