import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

/*
 * İki aile, üç ses.
 *
 * Önceki kurgu üç aile taşıyordu (Bricolage Grotesque + Instrument Sans +
 * IBM Plex Mono). Bricolage'ın hafif tuhaf harf biçimleri klinik bir ölçüm
 * aracının tonuyla çekişiyordu: sayfa "oyuncu" görünüyor ama ürün bir kayıt
 * defteri. Tek bir grotesk aileye indirildi.
 *
 *   · Schibsted Grotesk — başlıklardan düğme etiketine kadar her şey.
 *     Değişken ekseni 400-900; kontrast ağırlık, boyut ve harf aralığından
 *     geliyor, ikinci bir aileden değil. Haber-editoryal kökenli: dar
 *     apertürleri sıkı başlıkta karakter veriyor, 400'de gövde metni olarak
 *     sessizleşiyor. latin-ext ile Türkçe aksanlar tam.
 *   · IBM Plex Mono — yalnızca sayısal okumalar. Skor, süre, persentil ve
 *     span değerleri gövde metninden ayrılmalı; klinik veri hizalı okunur.
 *
 * Tek ailenin iki değişkeni ayrı ayrı yükleniyor: başlıklar 600-900,
 * gövde 400-600. Bu, `font-synthesis` kaynaklı sahte kalınlığı önler.
 */
const grotesk = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-body-face",
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
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1620" },
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
    <html lang="tr" suppressHydrationWarning className={`${grotesk.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mimio-theme');var v=(t==='dark'||t==='high-contrast')?t:(t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):'light');document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme','light');}` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
