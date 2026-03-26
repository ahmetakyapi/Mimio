"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import LandingPage from "./LandingPage";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { OfflineIndicator } from "./ui/OfflineIndicator";
import { AppLoadingSkeleton } from "./ui/LoadingSkeleton";

// Lazy load the main app to reduce initial bundle
const MimioApp = lazy(() =>
  import("./MimioApp").then((mod) => ({ default: mod.MimioApp }))
);

type TopView = "landing" | "app";

const ACTIVE_THERAPIST_KEY = "mimio-active-therapist-v2";

export function ClientRoot() {
  const [topView, setTopView] = useState<TopView>("landing");
  const [initialAppView, setInitialAppView] = useState<"login" | "register">(
    "login"
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_THERAPIST_KEY);
      if (saved) {
        setTopView("app");
      }
    } catch {
      // localStorage not available
    }
  }, []);

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Ana içeriğe atla
      </a>

      {topView === "landing" ? (
        <LandingPage
          onLogin={() => {
            setInitialAppView("login");
            setTopView("app");
          }}
          onRegister={() => {
            setInitialAppView("register");
            setTopView("app");
          }}
        />
      ) : (
        <Suspense fallback={<AppLoadingSkeleton />}>
          <ErrorBoundary>
            <MimioApp
              initialAppView={initialAppView}
              onLogout={() => setTopView("landing")}
            />
          </ErrorBoundary>
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
