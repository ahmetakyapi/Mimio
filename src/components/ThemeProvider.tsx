"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light" | "high-contrast";
type ThemePreference = Theme | "system";

interface ThemeContextValue {
  /** Active resolved theme (never "system") */
  theme: Theme;
  /** User's preference (may be "system") */
  preference: ThemePreference;
  /** Cycle between dark ↔ light */
  toggle: () => void;
  /** Set a specific theme or "system" to follow OS */
  setTheme: (t: ThemePreference) => void;
}

const STORAGE_KEY = "mimio-theme";
const VALID_THEMES: Theme[] = ["dark", "light", "high-contrast"];

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  preference: "dark",
  toggle: () => {},
  setTheme: () => {},
});

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function resolveTheme(pref: ThemePreference): Theme {
  return pref === "system" ? getSystemTheme() : pref;
}

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("dark");
  const [theme, setThemeState] = useState<Theme>("dark");

  // Initialize from localStorage or system preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      let initial: ThemePreference;
      if (saved && (VALID_THEMES.includes(saved as Theme) || saved === "system")) {
        initial = saved;
      } else {
        // First visit: respect OS preference
        initial = "system";
      }
      setPreference(initial);
      const resolved = resolveTheme(initial);
      setThemeState(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Listen to OS theme changes when preference is "system"
  useEffect(() => {
    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const resolved = getSystemTheme();
      setThemeState(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [preference]);

  const applyTheme = useCallback((next: ThemePreference) => {
    setPreference(next);
    const resolved = resolveTheme(next);
    setThemeState(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // quota exceeded
    }
  }, []);

  const toggle = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, preference, toggle, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
