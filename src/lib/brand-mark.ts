/**
 * Mimio monogramının tek kaynağı.
 *
 * Yol daha önce yalnızca `components/brand/BlockMark.tsx` içinde yaşıyordu;
 * ikon rotaları (favicon, apple-touch, PWA, OG) sunucuda çalıştığı ve o dosya
 * `"use client"` olduğu için oraya erişemiyordu. Sonuç: uygulamanın içinde
 * tasarlanmış monogram, dışarıda gördüğü her yüzeyde sistem fontuyla yazılmış
 * düz bir "M" (192px ikonda ise "Mi") ile temsil ediliyordu — üç farklı işaret,
 * üç farklı marka.
 *
 * Harfin biçimi ürünün ölçtüğü şeyi taşır: iki tepe ve aradaki vadi bir
 * ilerleme eğrisinin silüetidir; sağ ayak sol ayaktan yüksek biter, yani
 * grafik yukarı bırakılır.
 */

/** Monogramın viewBox birimi — yol bu kareye göre yazıldı. */
export const MARK_VIEWBOX = 32;

/** `M` harfi, tek dolu yol. */
export const MARK_PATH = [
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

/**
 * İmza degradesinin sabit hâli.
 *
 * İkonlar tema değişkenlerini okuyamaz: uygulama kabuğunun dışında, çoğu
 * zaman bir işletim sistemi yüzeyinde (sekme, ana ekran, paylaşım kartı)
 * basılıyorlar. Değerler `globals.css`teki açık tema imzasıyla birebir aynı.
 */
export const BRAND_FROM = "#2b62f5";
export const BRAND_TO = "#17c2e0";
export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_FROM} 0%, ${BRAND_TO} 100%)`;

/** Koyu zemin — OG kartı ve açılış ekranı. */
export const BRAND_INK = "#050b16";
