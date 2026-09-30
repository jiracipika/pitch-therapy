"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker. No-op in development so hot reload
 * is never served from cache.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive — registration failure is non-fatal.
    });
  }, []);
  return null;
}
