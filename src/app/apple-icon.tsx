import { ImageResponse } from "next/og";
import { BRAND_FROM, BRAND_TO, MARK_PATH, MARK_VIEWBOX } from "@/lib/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS ana ekran ikonu.
 *
 * KÖŞE YARIÇAPI YOK — kasıtlı. iOS ikonu kendi "squircle" maskesiyle kırpar;
 * kaynakta ayrıca yuvarlatmak iki eğrinin üst üste binmesine, köşelerde ince
 * beyaz bir hilale yol açıyor. Önceki sürüm 40px yarıçap veriyordu.
 *
 * Harf, maskenin kırptığı alandan uzak dursun diye kareye göre %54: iOS
 * maskesi köşelerden yaklaşık %10 alıyor, monogramın kolları o bölgeye
 * girmiyor.
 *
 * Üstteki radyal aydınlık, düz degradeye derinlik veren tek hamle — Deniz'de
 * degrade yüzeylere doku eklenir, tuvalin kendisi düz bırakılmaz.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: [
            `radial-gradient(120% 100% at 22% 6%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 58%)`,
            `linear-gradient(135deg, ${BRAND_FROM} 0%, ${BRAND_TO} 100%)`,
          ].join(", "),
        }}
      >
        <svg width={98} height={98} viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}>
          <path d={MARK_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
