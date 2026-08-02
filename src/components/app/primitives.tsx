"use client";

/*
 * Deniz ekranlarının ortak parçaları.
 *
 * Dört ekran (Bugün, Danışanlar, Danışan detayı, Haftalık Plan) aynı görsel
 * dili paylaşıyor: cam kart, mono göz kapağı, degrade avatar, ölçüm çubuğu.
 * Bunlar burada tek kez tanımlanır — aksi hâlde her ekran kendi kartını biraz
 * farklı yuvarlatıyor, sistem dağılıyor.
 */

import type { ReactNode } from "react";

/* ── Kart ──────────────────────────────────────────────────────────────── */

/** Cam yüzey. Deniz'de veri taşıyan her blok bu kabuğun içinde durur. */
export function Card({
  children,
  className = "",
  pad = "p-5",
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly pad?: string;
}) {
  return <div className={`glass rounded-[18px] ${pad} ${className}`}>{children}</div>;
}

/**
 * Kart üstü etiket: mono, küçük, geniş harf aralıklı, versal.
 * Başlık değil — "bu blok neyi sayıyor" sorusunun cevabı.
 */
export function Eyebrow({ children, className = "" }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div className={`numeral text-[9.5px] font-semibold uppercase tracking-[0.14em] text-(--color-text-soft) ${className}`}>
      {children}
    </div>
  );
}

/** Kart başlığı — display ailesi, 15px. */
export function CardTitle({ children, className = "" }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <span className={`font-display font-bold text-[14px] tracking-[-0.02em] text-(--color-text-strong) ${className}`}>
      {children}
    </span>
  );
}

/* ── Avatar ────────────────────────────────────────────────────────────── */

/**
 * Danışan avatarı. Degrade, id'nin hash'inden seçilir; aynı kişi her ekranda
 * aynı rengi taşır. Fotoğraf yok — klinik kayıtta çocuk fotoğrafı tutmak
 * gereksiz bir veri sorumluluğu, baş harf yeterli ayırt ediciliği veriyor.
 */
export function Avatar({
  name,
  id,
  size = 38,
  radius = 12,
  className = "",
  ring = false,
}: {
  readonly name: string;
  readonly id?: string;
  readonly size?: number;
  readonly radius?: number;
  readonly className?: string;
  /** Üst üste binen yığınlarda kartla arasına boşluk basar */
  readonly ring?: boolean;
}) {
  const seed = id ?? name;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const variant = (h % 4) + 1;

  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center shrink-0 font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `var(--gradient-avatar-${variant})`,
        fontSize: size * 0.37,
        boxShadow: ring ? "0 0 0 2px var(--color-surface-strong)" : undefined,
      }}
    >
      {(name.trim()[0] ?? "?").toLocaleUpperCase("tr-TR")}
    </span>
  );
}

/* ── Etiketler ─────────────────────────────────────────────────────────── */

export type TagTone = "primary" | "green" | "amber" | "violet" | "teal";

const TAG_TONE: Record<TagTone, { bg: string; fg: string }> = {
  primary: { bg: "var(--color-primary-light)", fg: "var(--color-primary-ink)" },
  green: { bg: "color-mix(in srgb, var(--color-accent-green) 12%, transparent)", fg: "var(--color-accent-green)" },
  amber: { bg: "color-mix(in srgb, var(--color-accent-amber) 14%, transparent)", fg: "var(--color-accent-amber)" },
  violet: { bg: "color-mix(in srgb, var(--color-accent-violet) 13%, transparent)", fg: "var(--color-accent-violet)" },
  teal: { bg: "color-mix(in srgb, var(--color-accent-teal) 13%, transparent)", fg: "var(--color-accent-teal)" },
};

/** Yuvarlatılmış tint rozet. Metin rengi her zaman tonun koyu (`-ink`) hâli. */
export function Tag({ children, tone = "primary" }: { readonly children: ReactNode; readonly tone?: TagTone }) {
  const t = TAG_TONE[tone];
  return (
    <span
      className="inline-flex items-center px-[11px] py-[5px] rounded-lg text-[11px] font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

/* ── Ölçüm ─────────────────────────────────────────────────────────────── */

/**
 * Bağımsızlık ölçeği — 5 segment. Ergoterapide bağımsızlık sürekli bir sayı
 * değil, ayrık bir basamak (tam bağımlı → bağımsız); bu yüzden çubuk değil
 * segment. Son dolu segment cyan: "şu an buradasın" işareti.
 */
export function StepBar({
  value,
  max = 5,
  width = 14,
  height = 5,
}: {
  readonly value: number;
  readonly max?: number;
  readonly width?: number;
  readonly height?: number;
}) {
  return (
    <span className="flex gap-[3px]" aria-label={`${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            width,
            height,
            borderRadius: 3,
            background:
              i < value - 1
                ? "var(--color-primary)"
                : i === value - 1
                  ? "var(--color-signature-to)"
                  : "var(--color-line-strong)",
          }}
        />
      ))}
    </span>
  );
}

/** Yatay doluluk çubuğu. Dolgu imza degradesinin 90° hâli. */
export function MeterBar({
  pct,
  height = 6,
  color,
}: {
  readonly pct: number;
  readonly height?: number;
  readonly color?: string;
}) {
  return (
    <span className="block rounded-full overflow-hidden" style={{ height, background: "var(--color-line-strong)" }}>
      <span
        className="block h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color ?? "var(--gradient-bar)" }}
      />
    </span>
  );
}

/* ── Grafikler ─────────────────────────────────────────────────────────── */

/**
 * Sparkline. `series` en az üç nokta ve bir miktar değişim taşımıyorsa
 * hiçbir şey çizmez — düz bir çizgi bilgi değil gürültüdür.
 */
export function Sparkline({
  series,
  width = 104,
  height = 30,
  id,
}: {
  readonly series: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly id: string;
}) {
  if (series.length < 3) return null;
  const max = Math.max(...series);
  const min = Math.min(...series);
  if (max === min) return null;

  const step = width / (series.length - 1);
  const y = (v: number) => height - 3 - ((v - min) / (max - min)) * (height - 8);
  const pts = series.map((v, i) => `${(i * step).toFixed(1)} ${y(v).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const gid = `spk-${id}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={y(series[series.length - 1])} r={3.2} fill="var(--color-signature-to)" />
    </svg>
  );
}

/** Halka ilerleme + ortada değer. Hedefe yakınlık için. */
export function ScoreRing({ value, size = 58 }: { readonly value: number; readonly size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-label={`${value}/100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line-strong)" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="numeral"
        style={{ fontSize: size * 0.24, fontWeight: 600, fill: "var(--color-text-strong)" }}
      >
        {Math.round(value)}
      </text>
    </svg>
  );
}

/**
 * Beş eksenli radar. Ergoterapi değerlendirmesi tek skora indirgenemez —
 * profil şekli, tepe değerinden daha çok şey söyler.
 */
export function Radar({
  axes,
  size = 190,
  id,
}: {
  readonly axes: ReadonlyArray<{ label: string; value: number }>;
  readonly size?: number;
  readonly id: string;
}) {
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36;
  const gid = `rad-${id}`;

  const point = (i: number, ratio: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * R * ratio, cy + Math.sin(a) * R * ratio] as const;
  };
  const ring = (ratio: number) =>
    Array.from({ length: n }, (_, i) => point(i, ratio).map((v) => v.toFixed(1)).join(",")).join(" ");
  const shape = axes.map((ax, i) => point(i, Math.max(0, Math.min(100, ax.value)) / 100).map((v) => v.toFixed(1)).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--color-signature-to)" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {[1, 0.667, 0.333].map((r) => (
        <polygon key={r} points={ring(r)} fill="none" stroke="var(--color-line-strong)" strokeWidth={1} />
      ))}
      <polygon points={shape} fill={`url(#${gid})`} stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" />
      {axes.map((ax, i) => {
        const [px, py] = point(i, Math.max(0, Math.min(100, ax.value)) / 100);
        return <circle key={ax.label} cx={px} cy={py} r={3.2} fill="var(--color-primary)" />;
      })}
      {axes.map((ax, i) => {
        const [px, py] = point(i, 1.24);
        return (
          <text
            key={ax.label}
            x={px}
            y={py}
            textAnchor={px > cx + 4 ? "start" : px < cx - 4 ? "end" : "middle"}
            dominantBaseline="middle"
            style={{ font: "600 9.5px var(--font-sans)", fill: "var(--color-text-soft)" }}
          >
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Ekran başlığı ─────────────────────────────────────────────────────── */

/**
 * Her ekranın tepesi aynı üçlüyü taşır: mono göz kapağı (bağlam), display
 * başlık (ekranın adı), gövde alt satırı (o an bilinmesi gereken tek şey).
 */
export function ScreenHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  readonly eyebrow: ReactNode;
  readonly title: ReactNode;
  readonly sub?: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div className="min-w-0">
        <div className="numeral text-[10px] font-medium uppercase tracking-[0.16em] text-(--color-text-soft) mb-2">
          {eyebrow}
        </div>
        <h1 className="m-0 mb-[7px] text-[clamp(1.3125rem,1.9vw,1.75rem)] leading-[1.1] text-(--color-text-strong)">{title}</h1>
        {sub && <p className="m-0 text-[12.5px] text-(--color-text-body)">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

/** İkincil (çerçeveli) düğme — sayfada birden çok olabilir. */
export const btnGhost =
  "px-[17px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer transition-colors " +
  "bg-(--color-surface-strong) text-(--color-text-body) border border-(--color-line) " +
  "hover:border-(--color-line-strong) hover:text-(--color-primary)";

/** Segment seçici (Hafta/Ay/Danışan, 10 seans/3 ay/Tümü). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  readonly options: ReadonlyArray<{ value: T; label: string }>;
  readonly value: T;
  readonly onChange: (v: T) => void;
  readonly size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-[11px] py-[5px] text-[11px]" : "px-[13px] py-[7px] text-[11.5px]";
  return (
    <div
      className="flex p-[3px] rounded-xl shrink-0"
      style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
      role="tablist"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`${pad} rounded-lg font-semibold cursor-pointer border-none transition-colors ${on ? "text-white" : "text-(--color-text-soft) bg-transparent hover:text-(--color-text-body)"}`}
            style={on ? { background: "var(--gradient-signature)" } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
