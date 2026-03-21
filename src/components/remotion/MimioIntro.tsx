"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  TrendingUp,
  Target,
  Brain,
  CalendarDays,
  Star,
  CheckCircle2,
} from "lucide-react";

/* ── Color palettes ── */
const DARK = {
  bg: "#04070d",
  surface: "rgba(255,255,255,0.04)",
  surfaceEl: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.09)",
  indigo: "#818cf8",
  purple: "#a78bfa",
  cyan: "#22d3ee",
  emerald: "#34d399",
  amber: "#fbbf24",
  textStrong: "#f1f5f9",
  textSoft: "#94a3b8",
  textMuted: "#64748b",
  glowIndigo: "rgba(99,102,241,0.14)",
  glowPurple: "rgba(139,92,246,0.13)",
} as const;

const LIGHT = {
  bg: "#f5f6ff",
  surface: "rgba(255,255,255,0.85)",
  surfaceEl: "#ffffff",
  border: "rgba(99,102,241,0.14)",
  indigo: "#4f46e5",
  purple: "#7c3aed",
  cyan: "#0891b2",
  emerald: "#059669",
  amber: "#d97706",
  textStrong: "#0f172a",
  textSoft: "#475569",
  textMuted: "#94a3b8",
  glowIndigo: "rgba(99,102,241,0.10)",
  glowPurple: "rgba(139,92,246,0.08)",
} as const;

type Colors = {
  bg: string;
  surface: string;
  surfaceEl: string;
  border: string;
  indigo: string;
  purple: string;
  cyan: string;
  emerald: string;
  amber: string;
  textStrong: string;
  textSoft: string;
  textMuted: string;
  glowIndigo: string;
  glowPurple: string;
};

type SceneProps = { frame: number; fps: number; C: Colors };

/* ── Spring helper ── */
function sp(
  frame: number,
  fps: number,
  delay = 0,
  stiffness = 100,
  damping = 20
) {
  return spring({ frame: frame - delay, fps, config: { stiffness, damping } });
}

/* ══════════════════════════════════════════
   Scene 1 — Dashboard Overview
══════════════════════════════════════════ */
function DashboardScene({ frame, fps, C }: SceneProps) {
  const stats = [
    { label: "Toplam Seans", value: "24", Icon: CalendarDays, color: C.indigo },
    { label: "Danışanlar", value: "8", Icon: Users, color: C.emerald },
    { label: "Ort. Skor", value: "84", Icon: TrendingUp, color: C.amber },
    { label: "Bu Hafta", value: "6", Icon: Target, color: C.cyan },
  ];

  const clients = [
    { name: "Ela Selin", game: "Sıra Hafızası", score: 92, color: C.indigo },
    { name: "Tuna Akarsu", game: "Mavi Nabız", score: 78, color: C.purple },
    { name: "Asya Demir", game: "Hedef Tarama", score: 85, color: C.cyan },
  ];

  const headerP = sp(frame, fps, 0);
  const notifP = sp(frame, fps, 90);

  return (
    <AbsoluteFill style={{ padding: 28, fontFamily: "system-ui, sans-serif" }}>
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowIndigo}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          transform: `translateY(${interpolate(headerP, [0, 1], [16, 0])}px)`,
          opacity: headerP,
          marginBottom: 18,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            M
          </div>
          <LayoutDashboard size={11} color={C.indigo} />
          <span
            style={{
              color: C.indigo,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Mimio Dashboard
          </span>
        </div>
        <h2
          style={{
            color: C.textStrong,
            fontSize: 17,
            fontWeight: 800,
            margin: "0 0 2px",
            lineHeight: 1.2,
          }}
        >
          Hoş geldiniz, Ayşe Hanım
        </h2>
        <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>
          Bu hafta 6 seans planlandı · 3 danışan aktif
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 7,
          marginBottom: 14,
        }}
      >
        {stats.map((s, i) => {
          const p = sp(frame, fps, 10 + i * 8);
          const Icon = s.Icon;
          return (
            <div
              key={s.label}
              style={{
                background: `${s.color}18`,
                border: `1px solid ${s.color}28`,
                borderRadius: 10,
                padding: "9px 10px",
                transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
                opacity: p,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  marginBottom: 5,
                }}
              >
                <Icon size={9} color={s.color} />
                <span
                  style={{
                    color: s.color,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </span>
              </div>
              <strong
                style={{
                  color: C.textStrong,
                  fontSize: 19,
                  fontWeight: 900,
                  lineHeight: 1,
                  display: "block",
                }}
              >
                {s.value}
              </strong>
            </div>
          );
        })}
      </div>

      {/* Label */}
      <div style={{ opacity: sp(frame, fps, 45), marginBottom: 8 }}>
        <p
          style={{
            color: C.textMuted,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Son Seanslar
        </p>
      </div>

      {/* Client rows */}
      {clients.map((c, i) => {
        const p = sp(frame, fps, 52 + i * 12);
        return (
          <div
            key={c.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: C.surfaceEl,
              border: `1px solid ${C.border}`,
              borderRadius: 9,
              padding: "7px 11px",
              marginBottom: 5,
              transform: `translateX(${interpolate(p, [0, 1], [22, 0])}px)`,
              opacity: p,
            }}
          >
            <div
              style={{
                width: 27,
                height: 27,
                borderRadius: 7,
                background: `linear-gradient(135deg, ${c.color}, ${c.color}88)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {c.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{ color: C.textStrong, fontSize: 11, fontWeight: 600, margin: 0 }}
              >
                {c.name}
              </p>
              <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>
                {c.game}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: c.color, fontSize: 12, fontWeight: 800 }}>
                {c.score}
              </span>
              <div
                style={{
                  width: 42,
                  height: 3,
                  background: `${c.color}22`,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${c.score}%`,
                    height: "100%",
                    background: c.color,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Notification badge */}
      <div
        style={{
          position: "absolute",
          top: 22,
          right: 22,
          background: `${C.emerald}14`,
          border: `1px solid ${C.emerald}30`,
          borderRadius: 10,
          padding: "7px 11px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: notifP,
          transform: `translateX(${interpolate(notifP, [0, 1], [18, 0])}px)`,
        }}
      >
        <CheckCircle2 size={11} color={C.emerald} />
        <span style={{ color: C.emerald, fontSize: 10, fontWeight: 600 }}>
          Seans başladı · Ela Selin
        </span>
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 2 — Games Showcase
══════════════════════════════════════════ */
function GamesScene({ frame, fps, C }: SceneProps) {
  const games = [
    { label: "Sıra Hafızası", area: "Çalışma Belleği", Icon: Brain, color: C.indigo },
    { label: "Mavi Nabız", area: "Motor Beceri", Icon: Target, color: C.purple },
    { label: "Hedef Tarama", area: "Görsel Algı", Icon: Target, color: C.cyan },
  ];

  const headerP = sp(frame, fps, 0);
  const scoreFrame = Math.min(frame, 150);
  const countedScore = Math.round(
    interpolate(scoreFrame, [45, 100], [0, 92], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const gaugeRotation = interpolate(scoreFrame, [45, 100], [-90, 242], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ padding: 28, fontFamily: "system-ui, sans-serif" }}>
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: -70,
          right: -70,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowPurple}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [16, 0])}px)`,
          marginBottom: 18,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
        >
          <Gamepad2 size={12} color={C.indigo} />
          <span
            style={{
              color: C.indigo,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Terapötik Oyunlar
          </span>
        </div>
        <h2
          style={{
            color: C.textStrong,
            fontSize: 17,
            fontWeight: 800,
            margin: "0 0 2px",
            lineHeight: 1.2,
          }}
        >
          Her Oyun Bir Gelişim Hedefi
        </h2>
        <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>
          6 oyun · 3 beceri alanı · kanıta dayalı tasarım
        </p>
      </div>

      {/* Game cards */}
      {games.map((g, i) => {
        const p = sp(frame, fps, 15 + i * 16, 80, 18);
        const Icon = g.Icon;
        return (
          <div
            key={g.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              background: C.surfaceEl,
              border: `1px solid ${g.color}28`,
              borderRadius: 12,
              padding: "11px 14px",
              marginBottom: 8,
              transform: `translateX(${interpolate(p, [0, 1], [30, 0])}px)`,
              opacity: p,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: `${g.color}18`,
                border: `1px solid ${g.color}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={16} color={g.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{ color: C.textStrong, fontSize: 12, fontWeight: 700, margin: 0 }}
              >
                {g.label}
              </p>
              <p style={{ color: C.textMuted, fontSize: 10, margin: 0 }}>
                {g.area}
              </p>
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={9} color={C.amber} fill={C.amber} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Score card */}
      <div
        style={{
          background: `${C.indigo}12`,
          border: `1px solid ${C.indigo}28`,
          borderRadius: 12,
          padding: "13px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: sp(frame, fps, 60),
          transform: `translateY(${interpolate(sp(frame, fps, 60), [0, 1], [12, 0])}px)`,
        }}
      >
        <div>
          <p
            style={{
              color: C.textMuted,
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              margin: "0 0 3px",
            }}
          >
            Son Seans Skoru
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <strong
              style={{ color: C.indigo, fontSize: 32, fontWeight: 900, lineHeight: 1 }}
            >
              {countedScore}
            </strong>
            <span style={{ color: C.textMuted, fontSize: 14 }}>/100</span>
          </div>
        </div>
        {/* Gauge */}
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: `3px solid ${C.indigo}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `3px solid ${C.indigo}`,
              borderBottomColor: "transparent",
              borderLeftColor: "transparent",
              transform: `rotate(${gaugeRotation}deg)`,
            }}
          />
          <span style={{ color: C.indigo, fontSize: 10, fontWeight: 800 }}>
            %{countedScore}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Main Composition
   300 frames @ 30fps = 10s looping
   Scene 1: Dashboard  0–148  (fade 120–148)
   Scene 2: Games      148–300 (fade 148–168, fade out 275–298)
══════════════════════════════════════════ */
export type MimioIntroProps = { theme?: "dark" | "light" };

export function MimioIntro({ theme = "dark" }: MimioIntroProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const C: Colors = theme === "light" ? LIGHT : DARK;

  const s1Opacity = interpolate(frame, [0, 12, 120, 148], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const s2Opacity = interpolate(frame, [148, 168, 275, 298], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene2Frame = Math.max(0, frame - 155);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* Scene 1 */}
      <div style={{ position: "absolute", inset: 0, opacity: s1Opacity }}>
        <DashboardScene frame={frame} fps={fps} C={C} />
      </div>

      {/* Scene 2 */}
      <div style={{ position: "absolute", inset: 0, opacity: s2Opacity }}>
        <GamesScene frame={scene2Frame} fps={fps} C={C} />
      </div>
    </AbsoluteFill>
  );
}
