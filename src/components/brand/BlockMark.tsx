"use client";

/**
 * Mimio monogramı.
 *
 * M harfi, ürünün ölçtüğü şeyin biçimini taşır: iki tepe ve aradaki vadi,
 * bir ilerleme eğrisinin silüetidir. Sağ ayak kasıtlı olarak sol ayaktan
 * yüksek biter — grafiği yukarı bırakır, "gelişim" okumasını verir.
 *
 * Alt kenardaki cetvel çentikleri markanın diğer yüzeylerinde (başlık altı
 * çizgisi, bölüm ayracı) tekrar eden ölçüm motifiyle aynıdır.
 */

interface MarkProps {
  /** Kenar uzunluğu (px) */
  readonly size?: number;
  /** Harf rengi */
  readonly color?: string;
  /** Zeminli döşeme hâli (koyu kutu içinde açık harf) */
  readonly tile?: boolean;
  readonly className?: string;
}

export function BlockMark({
  size = 32,
  color = "currentColor",
  tile = false,
  className,
}: MarkProps) {
  const V = 32; // viewBox birimi

  /*
   * M tek dolu yol. Gövde ağır (kol kalınlığı 32 birimin ~4,8'i) ki 24 px'te
   * bile dolu okunsun. Sağ ayak sol ayaktan yukarıda biter: harf bir ilerleme
   * eğrisi gibi yukarı bırakır.
   */
  const m = [
    "M3.4 26.4",
    "L3.4 5.6",
    "L9.6 5.6",
    "L16 17.2",
    "L22.4 5.6",
    "L28.6 5.6",
    "L28.6 20.4",
    "L23.4 20.4",
    "L23.4 14.6",
    "L18 24.2",
    "L14 24.2",
    "L8.6 14.6",
    "L8.6 26.4",
    "Z",
  ].join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${V} ${V}`}
      className={className}
      role="img"
      aria-label="Mimio"
    >
      {tile && (
        <rect width={V} height={V} rx={8} fill="var(--color-primary)" />
      )}
      <path d={m} fill={tile ? "var(--color-text-inverse)" : color} />
    </svg>
  );
}

/** Logo kilidi: monogram + kelime markası. */
export function BrandLockup({
  size = 30,
  tile = false,
  className,
}: {
  readonly size?: number;
  readonly tile?: boolean;
  readonly className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <BlockMark size={size} tile={tile} color="var(--color-primary)" />
      <span
        className="font-display font-extrabold tracking-tight text-(--color-text-strong)"
        style={{ fontSize: size * 0.66, lineHeight: 1 }}
      >
        Mimio
      </span>
    </span>
  );
}
