import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mimio",
  description:
    "Ergoterapistler için motor beceri, hafıza ve görsel ayrım oyunlarını tek merkezde buluşturan etkileşimli platform.",
};

export const viewport: Viewport = {
  themeColor: "#daf3ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
