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
  FileText,
  Zap,
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

/* ── Scene opacity helper ── */
function sceneOpacity(frame: number, start: number) {
  return interpolate(
    frame,
    [start, start + 15, start + 155, start + 175],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
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
    { label: "Ritim Vurgu", area: "Koordinasyon", Icon: Gamepad2, color: C.emerald },
    { label: "Renk Akışı", area: "Dikkat", Icon: Brain, color: C.amber },
    { label: "Örüntü Bul", area: "Mantıksal Düşünme", Icon: Target, color: C.purple },
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

      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [16, 0])}px)`,
          marginBottom: 14,
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
          6 oyun · 5 beceri alanı · kanıta dayalı tasarım
        </p>
      </div>

      {/* Game grid 2 cols */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
        {games.map((g, i) => {
          const p = sp(frame, fps, 15 + i * 10, 80, 18);
          const Icon = g.Icon;
          return (
            <div
              key={g.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.surfaceEl,
                border: `1px solid ${g.color}28`,
                borderRadius: 10,
                padding: "9px 11px",
                transform: `translateX(${interpolate(p, [0, 1], [i % 2 === 0 ? -20 : 20, 0])}px)`,
                opacity: p,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${g.color}18`,
                  border: `1px solid ${g.color}28`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={13} color={g.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{ color: C.textStrong, fontSize: 10, fontWeight: 700, margin: 0 }}
                >
                  {g.label}
                </p>
                <p style={{ color: C.textMuted, fontSize: 8, margin: 0 }}>{g.area}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score card */}
      <div
        style={{
          background: `${C.indigo}12`,
          border: `1px solid ${C.indigo}28`,
          borderRadius: 12,
          padding: "11px 14px",
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
            Son Seans Skoru · Ela Selin
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <strong
              style={{ color: C.indigo, fontSize: 28, fontWeight: 900, lineHeight: 1 }}
            >
              {countedScore}
            </strong>
            <span style={{ color: C.textMuted, fontSize: 13 }}>/100</span>
          </div>
        </div>
        <div
          style={{
            width: 50,
            height: 50,
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
          <span style={{ color: C.indigo, fontSize: 9, fontWeight: 800 }}>
            %{countedScore}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 3 — Session Planner
══════════════════════════════════════════ */
function SessionPlannerScene({ frame, fps, C }: SceneProps) {
  const goals = [
    { label: "Çalışma Belleği", progress: 72, color: C.indigo },
    { label: "Görsel Algı", progress: 58, color: C.cyan },
    { label: "Motor Koordinasyon", progress: 84, color: C.emerald },
  ];

  const activities = [
    { name: "Sıra Hafızası", type: "Çalışma Belleği", dur: "15 dk", diff: "Orta", color: C.indigo },
    { name: "Hedef Tarama", type: "Görsel Algı", dur: "10 dk", diff: "Kolay", color: C.cyan },
    { name: "Ritim Vurgu", type: "Koordinasyon", dur: "12 dk", diff: "Zor", color: C.purple },
  ];

  const headerP = sp(frame, fps, 0);
  const btnP = sp(frame, fps, 118);

  return (
    <AbsoluteFill style={{ padding: 28, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowIndigo}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          opacity: headerP,
          marginBottom: 15,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <CalendarDays size={11} color={C.indigo} />
          <span
            style={{
              color: C.indigo,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Seans Planlayıcısı
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
          Ela Selin — Program
        </h2>
        <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>
          3 hedef · 3 aktivite · ~37 dakika
        </p>
      </div>

      <p
        style={{
          color: C.textMuted,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          margin: "0 0 9px",
          opacity: sp(frame, fps, 14),
        }}
      >
        Tedavi Hedefleri
      </p>

      {goals.map((g, i) => {
        const p = sp(frame, fps, 20 + i * 14);
        const barWidth = interpolate(frame, [35 + i * 14, 95 + i * 14], [0, g.progress], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={g.label}
            style={{
              marginBottom: 9,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [-18, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: C.textSoft, fontSize: 10, fontWeight: 600 }}>
                {g.label}
              </span>
              <span style={{ color: g.color, fontSize: 10, fontWeight: 800 }}>
                {g.progress}%
              </span>
            </div>
            <div
              style={{
                height: 5,
                background: `${g.color}18`,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${g.color}, ${g.color}cc)`,
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        );
      })}

      <p
        style={{
          color: C.textMuted,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          margin: "12px 0 8px",
          opacity: sp(frame, fps, 62),
        }}
      >
        Planlanan Aktiviteler
      </p>

      {activities.map((a, i) => {
        const p = sp(frame, fps, 68 + i * 12, 90, 20);
        return (
          <div
            key={a.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.surfaceEl,
              border: `1px solid ${a.color}22`,
              borderRadius: 10,
              padding: "8px 12px",
              marginBottom: 6,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [20, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `${a.color}18`,
                border: `1px solid ${a.color}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Brain size={12} color={a.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{ color: C.textStrong, fontSize: 11, fontWeight: 700, margin: 0 }}
              >
                {a.name}
              </p>
              <p style={{ color: C.textMuted, fontSize: 9, margin: 0 }}>{a.type}</p>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: C.textMuted, fontSize: 9 }}>{a.dur}</span>
              <span
                style={{
                  background: `${a.color}18`,
                  color: a.color,
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: `1px solid ${a.color}28`,
                }}
              >
                {a.diff}
              </span>
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 22,
          right: 22,
          background: `linear-gradient(135deg, ${C.indigo}, ${C.purple})`,
          borderRadius: 10,
          padding: "8px 18px",
          color: "white",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: btnP,
          transform: `translateY(${interpolate(btnP, [0, 1], [10, 0])}px)`,
          boxShadow: `0 6px 20px ${C.glowIndigo}`,
        }}
      >
        <CheckCircle2 size={11} color="white" />
        Seans Oluştur
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 4 — Smart Therapy Suggestions
══════════════════════════════════════════ */
function TherapySuggestionsScene({ frame, fps, C }: SceneProps) {
  const suggestions = [
    {
      client: "Ela Selin",
      suggestion: "Sıra Hafızası — Zorluk 3",
      reason: "Son 3 seansta çalışma belleği skoru sürekli yükseliyor, zorluk artırılabilir",
      confidence: 94,
      priority: "Yüksek",
      color: C.emerald,
    },
    {
      client: "Tuna Akarsu",
      suggestion: "Mavi Nabız — Motor Odaklı",
      reason: "Motor beceri skoru 2 haftadır platoda, farklı egzersiz türü önerilir",
      confidence: 78,
      priority: "Orta",
      color: C.amber,
    },
    {
      client: "Asya Demir",
      suggestion: "Hedef Tarama — Hız Modu",
      reason: "Görsel algı gelişimi beklenen eğrinin altında kaldı",
      confidence: 62,
      priority: "Düşük",
      color: C.cyan,
    },
  ];

  const headerP = sp(frame, fps, 0);

  return (
    <AbsoluteFill style={{ padding: 28, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowPurple}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <Zap size={11} color={C.purple} />
          <span
            style={{
              color: C.purple,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Akıllı Öneri Motoru
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
          Kişiselleştirilmiş Öneriler
        </h2>
        <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>
          Geçmiş seans verisi ve kural motoruna dayalı
        </p>
      </div>

      {suggestions.map((s, i) => {
        const p = sp(frame, fps, 15 + i * 22, 85, 18);
        const confWidth = interpolate(frame, [40 + i * 22, 105 + i * 22], [0, s.confidence], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={s.client}
            style={{
              background: C.surfaceEl,
              border: `1px solid ${s.color}22`,
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 10,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [24, 0])}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 5,
              }}
            >
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}
                >
                  <span style={{ color: C.textStrong, fontSize: 11, fontWeight: 700 }}>
                    {s.client}
                  </span>
                  <span
                    style={{
                      background: `${s.color}18`,
                      color: s.color,
                      fontSize: 8,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 20,
                      border: `1px solid ${s.color}30`,
                    }}
                  >
                    {s.priority}
                  </span>
                </div>
                <p style={{ color: s.color, fontSize: 10, fontWeight: 600, margin: 0 }}>
                  {s.suggestion}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                <span
                  style={{
                    color: s.color,
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1,
                    display: "block",
                  }}
                >
                  {Math.round(confWidth)}%
                </span>
                <span style={{ color: C.textMuted, fontSize: 8 }}>güven</span>
              </div>
            </div>
            <p
              style={{
                color: C.textMuted,
                fontSize: 9,
                margin: "0 0 8px",
                lineHeight: 1.5,
              }}
            >
              {s.reason}
            </p>
            <div
              style={{
                height: 3,
                background: `${s.color}18`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${confWidth}%`,
                  height: "100%",
                  background: s.color,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Scene 5 — Clinical Summary
══════════════════════════════════════════ */
function ClinicalSummaryScene({ frame, fps, C }: SceneProps) {
  const SUMMARY_TEXT =
    "Ela Selin, son 4 seanslık değerlendirmede çalışma belleği alanında belirgin gelişim gösterdi. Sıra Hafızası oyununda skor ortalaması 68'den 92'ye yükseldi. Motor beceri egzersizlerine devam edilmesi önerilir. Ailenin sürece dahil edilmesi için rehberlik seansı planlanmalı.";

  const charCount = Math.floor(
    interpolate(frame, [22, 145], [0, SUMMARY_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const activities = [
    { label: "Sıra Hafızası", done: true, score: 92, color: C.indigo },
    { label: "Hedef Tarama", done: true, score: 85, color: C.cyan },
    { label: "Mavi Nabız", done: true, score: 78, color: C.purple },
    { label: "Ritim Vurgu", done: false, score: null, color: C.textMuted },
  ];

  const headerP = sp(frame, fps, 0);
  const exportP = sp(frame, fps, 122);

  return (
    <AbsoluteFill style={{ padding: 28, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.glowIndigo}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [14, 0])}px)`,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <FileText size={11} color={C.indigo} />
          <span
            style={{
              color: C.indigo,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Klinik Özet
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
          Ela Selin — Seans Özeti
        </h2>
        <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>
          Otomatik oluşturuldu · 14 Mart 2025
        </p>
      </div>

      {/* Summary text box */}
      <div
        style={{
          background: C.surfaceEl,
          border: `1px solid ${C.indigo}28`,
          borderRadius: 11,
          padding: "11px 13px",
          marginBottom: 13,
          minHeight: 74,
          opacity: sp(frame, fps, 18),
          transform: `translateY(${interpolate(sp(frame, fps, 18), [0, 1], [10, 0])}px)`,
        }}
      >
        <p style={{ color: C.textStrong, fontSize: 10, lineHeight: 1.7, margin: 0 }}>
          {SUMMARY_TEXT.slice(0, charCount)}
          {charCount < SUMMARY_TEXT.length && (
            <span
              style={{
                display: "inline-block",
                width: 1,
                height: 11,
                background: C.indigo,
                marginLeft: 1,
                verticalAlign: "text-bottom",
                opacity: frame % 18 < 9 ? 1 : 0,
              }}
            />
          )}
        </p>
      </div>

      <p
        style={{
          color: C.textMuted,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          margin: "0 0 8px",
          opacity: sp(frame, fps, 72),
        }}
      >
        Aktivite Tamamlama
      </p>

      {activities.map((a, i) => {
        const p = sp(frame, fps, 78 + i * 11);
        return (
          <div
            key={a.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 9,
              padding: "7px 11px",
              marginBottom: 5,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [16, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                flexShrink: 0,
                background: a.done ? `${a.color}18` : `${C.textMuted}12`,
                border: `1px solid ${a.done ? a.color : C.border}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {a.done ? (
                <CheckCircle2 size={10} color={a.color} />
              ) : (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    background: `${C.textMuted}30`,
                  }}
                />
              )}
            </div>
            <span
              style={{
                color: a.done ? C.textStrong : C.textMuted,
                fontSize: 11,
                fontWeight: 600,
                flex: 1,
              }}
            >
              {a.label}
            </span>
            {a.score !== null ? (
              <span style={{ color: a.color, fontSize: 12, fontWeight: 800 }}>
                {a.score}
              </span>
            ) : (
              <span style={{ color: C.textMuted, fontSize: 9 }}>Bekliyor</span>
            )}
          </div>
        );
      })}

      {/* Export button */}
      <div
        style={{
          position: "absolute",
          bottom: 22,
          right: 22,
          background: C.surfaceEl,
          border: `1px solid ${C.indigo}28`,
          borderRadius: 9,
          padding: "7px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: C.indigo,
          fontSize: 10,
          fontWeight: 700,
          opacity: exportP,
          transform: `translateY(${interpolate(exportP, [0, 1], [8, 0])}px)`,
        }}
      >
        <FileText size={10} color={C.indigo} />
        PDF Aktar
      </div>
    </AbsoluteFill>
  );
}

/* ══════════════════════════════════════════
   Main Composition
   840 frames @ 30fps = 28s looping
   Scene 1: Dashboard         0   → 175
   Scene 2: Games             165 → 340
   Scene 3: Session Planner   330 → 505
   Scene 4: Therapy Suggestions 495 → 670
   Scene 5: Clinical Summary  660 → 840
══════════════════════════════════════════ */
export type MimioIntroProps = { theme?: "dark" | "light" };

export function MimioIntro({ theme = "dark" }: MimioIntroProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const C: Colors = theme === "light" ? LIGHT : DARK;

  const s1Op = sceneOpacity(frame, 0);
  const s2Op = sceneOpacity(frame, 165);
  const s3Op = sceneOpacity(frame, 330);
  const s4Op = sceneOpacity(frame, 495);
  const s5Op = sceneOpacity(frame, 660);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: s1Op }}>
        <DashboardScene frame={frame} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s2Op }}>
        <GamesScene frame={Math.max(0, frame - 165)} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s3Op }}>
        <SessionPlannerScene frame={Math.max(0, frame - 330)} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s4Op }}>
        <TherapySuggestionsScene frame={Math.max(0, frame - 495)} fps={fps} C={C} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s5Op }}>
        <ClinicalSummaryScene frame={Math.max(0, frame - 660)} fps={fps} C={C} />
      </div>
    </AbsoluteFill>
  );
}
