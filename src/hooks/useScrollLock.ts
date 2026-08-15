"use client";

import { useEffect } from "react";

/**
 * Modal açıkken arkadaki yüzeyin kaymasını durdurur.
 *
 * Telefonda modal içinde kaydırırken parmak kutunun dışına taştığında sayfa
 * altta kaçıyordu: kullanıcı "Yeni Danışan" formunu doldururken arkadaki
 * danışan listesi ilerliyor, modal kapandığında bambaşka bir yerde çıkıyordu.
 *
 * Kilit `body`ye değil `<html>`e bir imza yazarak kurulur — bu uygulamada
 * kaydırma gövdede değil, uygulama kabuğundaki `.app-scroll` kutusunda
 * yaşıyor. `body { overflow: hidden }` bu yüzden hiçbir şey yapmıyordu.
 * Kuralın kendisi globals.css'te (`html[data-modal-open] .app-scroll`).
 *
 * Sayaçla çalışır: üst üste iki katman açıldığında (ör. formun üstünde bir
 * onay diyaloğu) ilki kapanınca kilit erken çözülmez.
 */
const ATTR = "data-modal-open";
let openCount = 0;

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    openCount += 1;
    document.documentElement.setAttribute(ATTR, "");
    return () => {
      openCount = Math.max(0, openCount - 1);
      if (openCount === 0) document.documentElement.removeAttribute(ATTR);
    };
  }, [active]);
}
