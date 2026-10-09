"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import LandingPage from "./LandingPage";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { OfflineIndicator } from "./ui/OfflineIndicator";
import { AppLoadingSkeleton } from "./ui/LoadingSkeleton";
import { IntroProvider } from "./motion/Intro";
import { PageTransitionProvider, usePageTransition } from "./motion/PageTransition";
import { SmoothScroll } from "./motion/SmoothScroll";
import { Cursor } from "./motion/Cursor";

// Lazy load the main app to reduce initial bundle
const MimioApp = lazy(() =>
  import("./MimioApp").then((mod) => ({ default: mod.MimioApp }))
);

/* Perde kapanırken uygulama paketi hâlâ iniyorsa geçiş iskelette açılıyordu.
   Ziyaretçi tanıtımdayken paket arkada önceden istenir. */
const preloadApp = () => { void import("./MimioApp"); };

type TopView = "landing" | "app";

const ACTIVE_THERAPIST_KEY = "mimio-active-therapist-v2";

export function ClientRoot() {
  return (
    <PageTransitionProvider>
      <RootViews />
    </PageTransitionProvider>
  );
}

function RootViews() {
  const [topView, setTopView] = useState<TopView>("landing");
  const [initialAppView, setInitialAppView] = useState<"login" | "register">(
    "login"
  );
  const { run } = usePageTransition();

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

  useEffect(() => {
    if (topView !== "landing") return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(preloadApp);
    else window.setTimeout(preloadApp, 2500);
  }, [topView]);

  const enterApp = (view: "login" | "register") =>
    run(() => {
      setInitialAppView(view);
      setTopView("app");
    }, view === "login" ? "Giriş" : "Hesap oluştur");

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Ana içeriğe atla
      </a>

      {topView === "landing" ? (
        <IntroProvider enabled>
          <SmoothScroll>
            <Cursor />
            <LandingPage
              onLogin={() => enterApp("login")}
              onRegister={() => enterApp("register")}
            />
          </SmoothScroll>
        </IntroProvider>
      ) : (
        <Suspense fallback={<AppLoadingSkeleton />}>
          <ErrorBoundary>
            <MimioApp
              initialAppView={initialAppView}
              onLogout={() => run(() => setTopView("landing"), "Tanıtım")}
            />
          </ErrorBoundary>
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
