/**
 * Paylaşım kartı — /api/og?title=…&subtitle=…
 *
 * Kart, bağlantı bir mesajlaşma uygulamasında ya da bir gönderide açıldığında
 * ürünü tanıtan tek yüzey. Önceki sürüm ortalanmış bir blok kurguluyordu:
 * degrade döşeme, altında başlık, altında alt satır. Üç sorunu vardı —
 * döşemede sistem fontuyla yazılmış bir "M" duruyordu (markanın monogramı
 * değil), tipografi tarayıcının varsayılan sans'ıydı ve kompozisyon boştu:
 * 1200×630'luk tuvalin ortasında dar bir sütun, iki yanında geniş boşluk.
 *
 * Yeni kurgu sola yaslı bir "künye": marka kilidi üstte, manşet ortada, altta
 * ürünün ne ölçtüğünü söyleyen üç sayı. Sağ üstte imza degradesinden bir
 * aurora yayı — uygulamanın zeminiyle aynı motif.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { BRAND_FROM, BRAND_INK, BRAND_TO, MARK_PATH, MARK_VIEWBOX } from "@/lib/brand-mark";
import { PLATFORM_STATS } from "@/lib/platform-stats";

export const runtime = "edge";

const W = 1200;
const H = 630;

/**
 * Başlık ailesi.
 *
 * Satori sistem fontuna düşerse kart "varsayılan" görünüyor; ürünün başlık
 * ailesi (Schibsted Grotesk) yüklenirse kart uygulamanın kendi sesiyle
 * konuşuyor. Ağ hatasında kart yine basılır — yalnızca font düşer.
 */
async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@700&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype|woff2?)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Terapi seanslarını oyuna dönüştür.";
  const subtitle =
    searchParams.get("subtitle") ??
    "Danışan takibi, haftalık plan, kanıta dayalı oyunlar ve yazdırılabilir raporlar — tek platformda.";

  const font = await loadDisplayFont();

  const stats = [
    { value: String(PLATFORM_STATS.gameCount), label: "terapi oyunu" },
    { value: String(PLATFORM_STATS.activityCount), label: "kanıt temelli aktivite" },
    { value: String(PLATFORM_STATS.protocolCount), label: "hazır protokol" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BRAND_INK,
          padding: "72px 80px",
          position: "relative",
          fontFamily: font ? "Display" : "sans-serif",
          color: "#eaf2ff",
        }}
      >
        {/*
          Aurora — uygulamanın zeminindeki üç katmanın ilki.

          Satori'nin iki sınırı burada belirleyici: `inset` kısayolunu ve
          8 haneli hex alfayı (`#2b62f555`) çözemiyor. Kenarlar tek tek
          yazılıyor, renkler `rgba()` veriliyor; ilk denemede yay hiç
          basılmıyordu çünkü katman ne boyutlanıyor ne de renk alıyordu.
        */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: "flex",
            backgroundImage: [
              "radial-gradient(circle at 86% -6%, rgba(43,98,245,0.55) 0%, rgba(43,98,245,0) 55%)",
              "radial-gradient(circle at 104% 52%, rgba(23,194,224,0.34) 0%, rgba(23,194,224,0) 45%)",
              "radial-gradient(circle at -6% 112%, rgba(124,92,255,0.34) 0%, rgba(124,92,255,0) 50%)",
            ].join(", "),
          }}
        />

        {/* ── Marka kilidi ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              backgroundImage: `linear-gradient(135deg, ${BRAND_FROM} 0%, ${BRAND_TO} 100%)`,
            }}
          >
            <svg width={38} height={38} viewBox={`0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}`}>
              <path d={MARK_PATH} fill="#ffffff" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1 }}>Mimio</span>
            <span style={{ fontSize: 17, color: "#7b91ab", letterSpacing: 1.6 }}>
              ÖLÇÜM TEMELLİ ERGOTERAPİ
            </span>
          </div>
        </div>

        {/* ── Manşet ── */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 880 }}>
          <div
            style={{
              fontSize: title.length > 46 ? 62 : 74,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -2.4,
              color: "#ffffff",
              display: "flex",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 25,
              lineHeight: 1.45,
              color: "#b9cade",
              display: "flex",
              maxWidth: 820,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* ── Ölçüler ── ürünün ne kadar şey taşıdığını bir bakışta verir. */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1.6, color: "#ffffff", lineHeight: 1 }}>
                {s.value}
              </span>
              <span style={{ fontSize: 18, color: "#7b91ab", marginTop: 8 }}>{s.label}</span>
            </div>
          ))}

          {/* İmza şeridi — kartın alt kenarına oturan tek renkli hamle. */}
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              width: 210,
              height: 8,
              borderRadius: 4,
              backgroundImage: `linear-gradient(90deg, ${BRAND_FROM} 0%, ${BRAND_TO} 100%)`,
            }}
          />
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: font ? [{ name: "Display", data: font, weight: 700, style: "normal" }] : undefined,
    },
  );
}
