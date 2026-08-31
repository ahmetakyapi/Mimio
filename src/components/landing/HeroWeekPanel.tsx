"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Kahraman sahnesinin arka yüzeyi: bir haftanın ritmi.
 *
 * Burada önce panelin ekran görüntüsü duruyordu. Küçültülmüş bir ekran
 * görüntüsü kahraman ölçeğinde okunmuyor; kenar bar, kart köşeleri ve
 * yarım kalmış paneller parça parça bir gürültüye dönüşüyordu — tasarlanmış
 * bir sahne değil, arkaya yapıştırılmış bir resim gibi.
 *
 * Yerine kahramana özel çizilen bir yüzey kondu. Bu, seans kartının kurduğu
 * yöntemin ikinci uygulaması: ürünün ürettiği şeyi ekran görüntüsü olarak
 * değil, kendi ölçeğinde yeniden çizerek göstermek. Sahte bir arayüz değil —
 * pencere çerçevesi, sahte düğme, iskelet çubuğu yok; yalnızca planın
 * kendisi: yedi gün ve alan renkleriyle bloklar.
 *
 * Kart ile birlikte tek bir cümle kuruyorlar: arkada haftanın tamamı,
 * önde o haftanın içinden tek bir seansın kaydı.
 *
 * Panel bilerek tek fikirli: yalnızca haftanın ritmi. Altına alan dengesi
 * çubukları da konmuştu ama kartın arkasında yarım kalıyor, düzeltmeye
 * çalıştığımız parçalanmayı küçük ölçekte tekrar ediyordu.
 *
 * Veri temsilîdir — tıpkı karttaki Corsi serisi gibi. Ürünün gerçek plan
 * yapısını (gün başına 2-3 blok, 25 slot kapasite, alanlar arası dengesizlik)
 * taşır; uydurma bir sayı iddiası taşımaz.
 */

type DomainKey = "cognitive" | "motor" | "visual" | "memory";

const DOMAIN_COLOR: Record<DomainKey, string> = {
  cognitive: "var(--color-domain-cognitive)",
  motor: "var(--color-domain-motor)",
  visual: "var(--color-domain-visual)",
  memory: "var(--color-domain-memory)",
};

/* Yedi gün. Pazar boş: haftanın her günü dolu bir takvim gerçekçi değil ve
   "boş slot" hâli ürünün öneri motorunun beslendiği durum. */
const WEEK: readonly { day: string; blocks: readonly DomainKey[] }[] = [
  { day: "Pzt", blocks: ["memory", "motor", "cognitive"] },
  { day: "Sal", blocks: ["visual", "cognitive"] },
  { day: "Çar", blocks: ["memory", "visual", "motor"] },
  { day: "Per", blocks: ["memory", "motor"] },
  { day: "Cum", blocks: ["cognitive", "visual"] },
  { day: "Cmt", blocks: ["memory", "visual"] },
  { day: "Paz", blocks: [] },
];

/* Slot sayacı blok sayımından türer, elle yazılmaz. */
const TOTAL = WEEK.reduce((n, d) => n + d.blocks.length, 0);

export function HeroWeekPanel() {
  const reduced = useReducedMotion();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-surface-strong)",
        border: "1px solid var(--color-line-strong)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <header
        className="flex items-center gap-2 px-5 py-2.5"
        style={{ borderBottom: "1px solid var(--color-line)" }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-muted)">
          Haftalık plan
        </span>
        <span className="numeral ml-auto text-[11px] text-(--color-text-soft)">
          {TOTAL} / 25 slot
        </span>
      </header>

      <div className="px-5 pt-4 pb-5">
        {/* Yedi sütun; her sütun bir gün. Bloklar yukarıdan aşağı dizilir,
            böylece dolu günler görsel olarak da "ağır" durur. */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEK.map((d, di) => (
            <div key={d.day} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-(--color-text-muted) text-center">
                {d.day}
              </span>
              <div className="flex flex-col gap-1.5">
                {d.blocks.map((b, bi) => (
                  <motion.span
                    key={`${d.day}-${bi}`}
                    initial={reduced ? false : { opacity: 0, scaleY: 0.4 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.35 + di * 0.05 + bi * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="block h-7 sm:h-8 rounded-md origin-top"
                    style={{
                      background: `color-mix(in srgb, ${DOMAIN_COLOR[b]} 15%, transparent)`,
                      borderLeft: `2px solid ${DOMAIN_COLOR[b]}`,
                    }}
                  />
                ))}
                {/* Boş gün: dolu günlerle aynı yüksekliği tutan kesik çerçeve.
                    Sütun çökmezse haftanın ritmi de bozulmaz. */}
                {d.blocks.length === 0 && (
                  <span
                    className="block h-7 sm:h-8 rounded-md"
                    style={{ border: "1px dashed var(--color-line-strong)" }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
