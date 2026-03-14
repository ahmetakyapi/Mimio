"use client";

import { useEffect, useState } from "react";
import LandingPage from "./LandingPage";
import { MimiTherapyApp } from "./MimiTherapyApp";

type TopView = "landing" | "app";

const ACTIVE_THERAPIST_KEY = "mimitherapy-active-therapist-v2";

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

  if (topView === "landing") {
    return (
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
    );
  }

  return (
    <MimiTherapyApp
      initialAppView={initialAppView}
      onLogout={() => setTopView("landing")}
    />
  );
}
