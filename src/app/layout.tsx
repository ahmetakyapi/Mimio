import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

/*
 * Üç rol, üç ses:
 *   · Bricolage Grotesque — başlıklar. Hümanist-endüstriyel, hafif tuhaf;
 *     sayfaya karakter veren tek öge. Değişken opsz ekseniyle büyük
 *     boyutlarda sıkışır, küçükte açılır.
 *   · Instrument Sans — arayüz ve gövde. Sessiz, dar, Türkçe aksanlarda net.
 *   · IBM Plex Mono — yalnızca sayısal okumalar. Skor, süre, persentil ve
 *     span değerleri gövde metninden ayrılmalı; klinik veri hizalı okunur.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display-face",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
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
    { media: "(prefers-color-scheme: light)", color: "#eef2ff" },
    { media: "(prefers-color-scheme: dark)", color: "#04070d" },
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
    <html lang="tr" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mimio-theme');var v;if(t==='light'||t==='dark'||t==='high-contrast'){v=t}else{v=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme','dark');}` }} />
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
