import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
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
  themeColor: "#04070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mimio-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){}` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={plusJakartaSans.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
