import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

/*
 * Üç aile, üç ses.
 *
 * Önceki kurgu tek aileye (Schibsted Grotesk) indirilmişti: kontrast
 * yalnızca ağırlık ve harf aralığından geliyordu. Pratikte ekran başlığı
 * ("İyi sabahlar, Ahmet.") ile arayüz başlığı ("Haftalık Plan") aynı
 * sesle konuşuyor, sayfada hiyerarşinin en üst basamağı kayboluyordu.
 * Deniz üç rol tanımlar ve her rolü ayrı bir aileye verir:
 *
 *   · Schibsted Grotesk — ekran başlığı ve büyük sayı. Aile seçimi
 *     `~/dev-starter/knowledge/themes/mimio.md` § 3'teki tipografi
 *     etüdünden geliyor: haber-editoryal kökenli, dar apertürleri sıkı
 *     başlıkta karakter veriyor. Tasarım dokümanı burada Space Grotesk
 *     kullanıyordu; ekosistem etüdü bilinçli olarak onun yerine geçiyor.
 *   · Plus Jakarta Sans — arayüz ve gövde. Yuvarlak terminalleri klinik
 *     yüzeye "çocuk sıcaklığı" katan tek tipografik hamle; 400'de
 *     seans notu, 600-700'de düğme ve etiket.
 *   · IBM Plex Mono — yalnızca sayısal okuma. Skor, süre, persentil ve
 *     span değerleri gövde metninden ayrılmalı; klinik veri hizalı okunur.
 *
 * Üçü de latin-ext taşıyor — Türkçe aksanlar (ı, İ, ğ, ş) tam.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-face",
  display: "swap",
});

const display = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-face",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-face",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mimio.app'
const DESCRIPTION = "Ergoterapistler için motor beceri, hafıza ve görsel ayrım oyunlarını tek merkezde buluşturan etkileşimli platform."

export const metadata: Metadata = {
  title: "Mimio",
  description: DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Mimio",
    description: DESCRIPTION,
    url: APP_URL,
    siteName: "Mimio",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Mimio — Ergoterapistler için Yeni Nesil Platform",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mimio",
    description: DESCRIPTION,
    images: ["/api/og"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#050b16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: aşağıdaki inline script, React hidrasyondan
    // önce data-theme'i yazar; bu kasıtlı sunucu/istemci farkıdır.
    <html lang="tr" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mimio-theme');var v=(t==='dark'||t==='high-contrast')?t:(t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):'light');document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme','light');}` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* iOS ana ekranda uygulama adı: bu olmadan `<title>` kullanılıyor ve
            "Mimio | Ergoterapi Oyun Platformu" ikonun altında kırpılıyor. */}
        <meta name="apple-mobile-web-app-title" content="Mimio" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
