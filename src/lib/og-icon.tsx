import { ImageResponse } from "next/og";
import { BRAND_FROM, BRAND_TO, MARK_PATH, MARK_VIEWBOX } from "@/lib/brand-mark";

/**
 * PWA ikonu üreteci — iki amaç, iki geometri.
 *
 * `any`      : ikonu olduğu gibi basan yüzeyler (masaüstü kısayolu, sekme
 *              listesi). Köşe yuvarlatılır, harf kareye göre %52.
 * `maskable` : Android'in kendi maskesiyle kırptığı yüzeyler. Burada iki şey
 *              değişir — zemin KENARDAN KENARA dolar (kaynakta yuvarlatma
 *              yok, yoksa maskenin dışında kalan köşeler beyaz görünür) ve
 *              harf "güvenli bölge"nin içinde kalacak kadar küçülür.
 *
 *              Güvenli bölge, kenarın %80'i çapında bir daire. O dairenin
 *              içine sığan karenin kenarı ≈ 0.8/√2 ≈ kenarın %56'sı; monogram
 *              %52'de kalıyor, yani en agresif maskede bile kollar kesilmiyor.
 *              Önceki sürüm `purpose: "any maskable"` ilan ediyordu ama tek
 *              bir yuvarlatılmış görsel veriyordu: Android hem köşeleri
 *              kırpıyor hem de harfin uçlarını yiyordu.
 */
export function brandIcon(px: number, purpose: "any" | "maskable") {
  const maskable = purpose === "maskable";
  const glyph = Math.round(px * (maskable ? 0.52 : 0.6));
  const radius = maskable ? 0 : Math.round(px * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius,
          backgroundImage: [
            "radial-gradient(120% 100% at 22% 6%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 58%)",
            `linear-gradient(135deg, ${BRAND_FROM} 0%, ${BRAND_TO} 100%)`,
          ].join(", "),
        }}
      >
        <svg width={glyph} height={glyph} viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}>
          <path d={MARK_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
