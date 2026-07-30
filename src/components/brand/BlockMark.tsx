"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Mimio'nun imza ögesi: dokuz blok.
 *
 * Bu bir süs değil — Corsi Blok Testi'nin aparatı. Platformdaki en eski ve
 * en çok oynanan görev (Sıra Hafızası) tam olarak budur: bloklar sırayla
 * yanar, danışan aynı sırayı tekrarlar. Aynı nesne hem markanın işareti,
 * hem kahraman görseli, hem de oyun tahtası olur.
 *
 * `animated` verildiğinde gerçek bir Corsi dizisi oynatır: bloklar
 * yanar, kısa bir duraklamadan sonra baştan başlar. Sağlıklı yetişkinlerde
 * tipik ileri açıklık 5-7 blok olduğu için varsayılan dizi uzunluğu 5.
 */

interface BlockMarkProps {
  /** Kenar uzunluğu (px) */
  readonly size?: number;
  /** Blok dizisini canlandır */
  readonly animated?: boolean;
  /** Yanan blok rengi — varsayılan meşe */
  readonly litColor?: string;
  /** Sönük blok rengi */
  readonly dimColor?: string;
  readonly className?: string;
  /** Dizi uzunluğu (yalnızca animated) */
  readonly span?: number;
}

/** Sabit bir dizi: her yüklemede aynı olsun ki marka tanınır kalsın. */
const SIGNATURE_SEQUENCE = [4, 0, 8, 5, 2] as const;

export function BlockMark({
  size = 32,
  animated = false,
  litColor = "var(--color-oak)",
  dimColor = "currentColor",
  className,
  span = 5,
}: BlockMarkProps) {
  const [litIndex, setLitIndex] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const sequence = useMemo(() => SIGNATURE_SEQUENCE.slice(0, Math.max(1, Math.min(9, span))), [span]);

  useEffect(() => {
    if (!animated) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      /* Hareket azaltılmışsa dizi oynatılmaz; son blok sabit yanar. */
      setLitIndex(sequence[sequence.length - 1]);
      return;
    }

    let cancelled = false;
    const STEP = 520;
    const REST = 1600;

    const run = () => {
      if (cancelled) return;
      sequence.forEach((cell, i) => {
        timers.current.push(
          window.setTimeout(() => setLitIndex(cell), i * STEP),
        );
        timers.current.push(
          window.setTimeout(() => setLitIndex(null), i * STEP + STEP * 0.62),
        );
      });
      timers.current.push(
        window.setTimeout(run, sequence.length * STEP + REST),
      );
    };
    run();

    return () => {
      cancelled = true;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [animated, sequence]);

  const gap = size * 0.09;
  const cell = (size - gap * 2) / 3;
  const radius = cell * 0.22;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Mimio"
      style={{ color: dimColor }}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const isLit = litIndex === i;
        return (
          <rect
            key={i}
            x={col * (cell + gap)}
            y={row * (cell + gap)}
            width={cell}
            height={cell}
            rx={radius}
            fill={isLit ? litColor : "currentColor"}
            opacity={isLit ? 1 : 0.42}
            style={{ transition: "fill 140ms linear, opacity 140ms linear" }}
          />
        );
      })}
    </svg>
  );
}

/** Logo kilidi: işaret + kelime markası. */
export function BrandLockup({
  size = 30,
  animated = false,
  className,
}: {
  readonly size?: number;
  readonly animated?: boolean;
  readonly className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <BlockMark size={size} animated={animated} dimColor="var(--color-primary)" />
      <span
        className="font-display font-extrabold tracking-tight text-(--color-text-strong)"
        style={{ fontSize: size * 0.66, lineHeight: 1 }}
      >
        Mimio
      </span>
    </span>
  );
}
