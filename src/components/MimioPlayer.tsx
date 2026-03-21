"use client";

import dynamic from "next/dynamic";
import { useTheme } from "./ThemeProvider";

const Inner = dynamic(() => import("./remotion/MimioPlayerInner"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        aspectRatio: "4/3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  ),
});

export function MimioPlayer() {
  const { theme } = useTheme();
  const resolvedTheme = theme === "light" ? "light" : "dark";
  return <Inner theme={resolvedTheme} />;
}
