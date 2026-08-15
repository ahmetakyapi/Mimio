"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Kaplama katmanını `document.body`ye taşır.
 *
 * SORUN: `position: fixed` normalde görünür alana göre konumlanır — ama bir
 * atada `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change`
 * ya da `contain` varsa o ata yeni bir "containing block" kurar ve fixed öge
 * artık ONA göre yerleşir. Bu uygulamada ikisi de bol: cam yüzeyler
 * (`backdrop-filter: blur(...)`) ve framer-motion'ın animasyon sırasında
 * yazdığı `transform`. Böyle bir atanın içinde açılan modal, ekranın
 * ortasında değil o kutunun içinde beliriyor — uzun bir sayfada aşağı
 * kaydırmadan görünmüyor.
 *
 * Modalı gövdeye taşımak bu tuzağı bütünüyle ortadan kaldırır: artık hiçbir
 * ata zinciri onu yakalayamaz. Tek tek "şu kartın blur'unu kaldır" yamalarıyla
 * uğraşmak yerine sınıfın tamamı bir kez çözülür — yarın eklenecek yeni bir
 * cam yüzey de aynı hatayı geri getiremez.
 *
 * `mounted` bekçisi şart: sunucuda `document` yok, ilk render'da portal
 * kurulamaz. Hidrasyondan sonra basılır.
 */
export function Portal({ children }: { readonly children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
