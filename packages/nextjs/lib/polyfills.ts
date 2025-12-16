/**
 * Global polyfills for browser APIs during SSR
 * This prevents "ReferenceError: indexedDB is not defined" during build
 */

// Only run polyfills during SSR (when window is undefined)
if (typeof window === "undefined") {
  // Polyfill indexedDB
  if (typeof global !== "undefined" && !global.indexedDB) {
    global.indexedDB = {
      open: () => ({
        addEventListener: () => {},
        removeEventListener: () => {},
        result: {
          transaction: () => ({
            objectStore: () => ({
              get: () => ({ addEventListener: () => {} }),
              put: () => ({ addEventListener: () => {} }),
              delete: () => ({ addEventListener: () => {} }),
            }),
          }),
        },
      }),
      deleteDatabase: () => ({ addEventListener: () => {} }),
    } as any;
  }

  // Polyfill localStorage
  if (typeof global !== "undefined" && !global.localStorage) {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as any;
  }

  // Polyfill sessionStorage
  if (typeof global !== "undefined" && !global.sessionStorage) {
    global.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as any;
  }
}
