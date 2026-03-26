"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Shows a banner when the user goes offline.
 * Automatically hides when back online with a brief success message.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Initialize with actual state
    setIsOnline(navigator.onLine);

    const goOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const goOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold transition-all"
      style={{
        background: isOnline
          ? "linear-gradient(90deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))"
          : "linear-gradient(90deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))",
        color: "#fff",
        backdropFilter: "blur(8px)",
      }}
      role="alert"
      aria-live="assertive">
      {isOnline ? (
        <>
          <Wifi size={14} />
          <span>Bağlantı yeniden kuruldu</span>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          <span>Çevrimdışı — Veriler yerel olarak kaydediliyor</span>
        </>
      )}
    </div>
  );
}
