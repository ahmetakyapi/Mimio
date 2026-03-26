"use client";

import { type CSSProperties } from "react";

interface SkeletonProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly width?: string | number;
  readonly height?: string | number;
  readonly rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const radiusMap = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

/** Animated skeleton placeholder with theme-aware colors */
export function Skeleton({ className = "", style, width, height, rounded = "lg" }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width ?? "100%",
        height: height ?? "1rem",
        borderRadius: radiusMap[rounded],
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/** Full-screen loading state for initial app load */
export function AppLoadingSkeleton() {
  return (
    <div className="flex h-dvh bg-(--color-page-bg)" role="status" aria-label="Yükleniyor">
      {/* Sidebar skeleton (desktop only) */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 p-4 gap-3"
        style={{ background: "var(--color-sidebar)", borderRight: "1px solid var(--color-line)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton width={36} height={36} rounded="xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton height={12} width="60%" />
            <Skeleton height={8} width="40%" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={40} rounded="xl" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1.5">
            <Skeleton height={24} width={200} />
            <Skeleton height={14} width={300} />
          </div>
          <Skeleton width={120} height={40} rounded="xl" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={88} rounded="2xl" />
          ))}
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Skeleton height={200} rounded="2xl" />
          <Skeleton height={200} rounded="2xl" />
        </div>
      </div>
    </div>
  );
}

/** Game canvas loading skeleton */
export function GameLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-6" role="status" aria-label="Oyun yükleniyor">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent spin-refresh"
          style={{ borderColor: "rgba(99,102,241,0.4)", borderTopColor: "transparent" }} />
      </div>
      <Skeleton width={180} height={16} />
      <Skeleton width={120} height={12} />
    </div>
  );
}

/** Card-level skeleton for data loading states */
export function CardSkeleton({ rows = 3 }: { readonly rows?: number }) {
  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
      role="status" aria-label="Yükleniyor">
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton height={14} width="50%" />
          <Skeleton height={10} width="30%" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={12} width={`${85 - i * 15}%`} />
      ))}
    </div>
  );
}
