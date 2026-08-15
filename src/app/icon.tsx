import { ImageResponse } from "next/og";
import { BRAND_GRADIENT, MARK_PATH, MARK_VIEWBOX } from "@/lib/brand-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Sekme ikonu.
 *
 * 32px'te çizilir ama tarayıcı çoğu zaman 16px'e indirir; tasarım o boyuta
 * göre yapılır. İki karar buradan çıkıyor:
 *
 *   · Kenar payı dar (2px). Daha geniş bir pay 16px'e inince harfi dört
 *     piksellik bir lekeye çeviriyor.
 *   · Köşe yarıçapı 7 — sekmede kare bir blok fazla sert, tam yuvarlak ise
 *     diğer sekmelerdeki favicon'ların arasında kimliksiz duruyor.
 *
 * Harf, uygulamanın içindekiyle aynı monogram: daha önce burada sistem
 * fontuyla yazılmış bir "M" vardı ve markanın işaretiyle ilgisi yoktu.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          backgroundImage: BRAND_GRADIENT,
        }}
      >
        <svg width={26} height={26} viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}>
          <path d={MARK_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
