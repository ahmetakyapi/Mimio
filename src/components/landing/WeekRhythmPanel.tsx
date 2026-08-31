"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Bir haftanın ritmi — çizilmiş yüzey, ekran görüntüsü değil.
 *
 * Bu yüzey bir süre kahramanın arka katmanıydı. Kahramanda tek görsel
 * kaldığı için kendi bölümüne indi; tam genişlikte durduğu için artık üstü
 * örtülmüyor ve blokların içi de doldu.
 *
 * Neden ekran görüntüsü değil: haftalık plan ekranının görüntüsü bu ölçekte
 * kenar bar, araç çubuğu ve yan panellerle birlikte geliyor; anlatılmak
 * istenen tek şey (haftanın ritmi) o gürültünün içinde kayboluyordu. Burada
 * yalnızca o tek şey çiziliyor.
 *
 * Sahte bir arayüz de değil: pencere çerçevesi, sahte düğme, iskelet çubuğu
 * yok. Takvim, ürünün demo haftasının birebir kendisi — `seed-demo.mjs`
 * içindeki SCHEDULE ile aynı danışanlar, aynı saatler, aynı oyunlar. Bu
 * yüzden gerçek uygulamada Haftalık Plan ekranı açıldığında görülen hafta
 * ile bu yüzey aynı şeyi söyler; sayılar da (15 seans, 25 slot, %60 doluluk)
 * oradan çıkar.
 */

type DomainKey = "cognitive" | "motor" | "visual" | "memory";

const DOMAIN: Record<DomainKey, { color: string; label: string }> = {
  cognitive: { color: "var(--color-domain-cognitive)", label: "Bilişsel" },
  motor: { color: "var(--color-domain-motor)", label: "Motor" },
  visual: { color: "var(--color-domain-visual)", label: "Görsel" },
  memory: { color: "var(--color-domain-memory)", label: "Bellek" },
};

/* Oyun → beceri alanı. Uygulamadaki eşlemenin aynısı. */
const GAME: Record<string, { title: string; domain: DomainKey }> = {
  memory: { title: "Sıra Hafızası", domain: "memory" },
  pairs: { title: "Kart Eşle", domain: "visual" },
  pulse: { title: "Mavi Nabız", domain: "motor" },
  route: { title: "Komut Rotası", domain: "motor" },
  difference: { title: "Fark Avcısı", domain: "visual" },
  scan: { title: "Hedef Tarama", domain: "cognitive" },
  logic: { title: "Dizi Mantık", domain: "cognitive" },
};

interface Slot {
  time: string;
  client: string;
  game: keyof typeof GAME;
}

/* Demo haftası. Pazar boş: her günü dolu bir takvim gerçekçi değil ve
   "boş slot" ürünün öneri motorunun beslendiği durum. */
const WEEK: readonly { day: string; date: number; slots: readonly Slot[] }[] = [
  {
    day: "Pzt",
    date: 31,
    slots: [
      { time: "09:30", client: "Ela Selin", game: "memory" },
      { time: "11:00", client: "Tuna Akarsu", game: "pulse" },
      { time: "14:00", client: "Derin Kaya", game: "pulse" },
    ],
  },
  {
    day: "Sal",
    date: 1,
    slots: [
      { time: "14:00", client: "Asya Demir", game: "scan" },
      { time: "15:30", client: "Kerem Arslan", game: "logic" },
    ],
  },
  {
    day: "Çar",
    date: 2,
    slots: [
      { time: "09:30", client: "Ela Selin", game: "pairs" },
      { time: "13:00", client: "Mina Yıldız", game: "difference" },
      { time: "15:30", client: "Derin Kaya", game: "route" },
    ],
  },
  {
    day: "Per",
    date: 3,
    slots: [
      { time: "09:30", client: "Zeynep Ada", game: "pairs" },
      { time: "11:00", client: "Tuna Akarsu", game: "route" },
      { time: "15:30", client: "Kerem Arslan", game: "memory" },
    ],
  },
  {
    day: "Cum",
    date: 4,
    slots: [
      { time: "09:30", client: "Ela Selin", game: "logic" },
      { time: "14:00", client: "Asya Demir", game: "difference" },
    ],
  },
  {
    day: "Cmt",
    date: 5,
    slots: [
      { time: "10:30", client: "Mina Yıldız", game: "pairs" },
      { time: "11:30", client: "Zeynep Ada", game: "difference" },
    ],
  },
  { day: "Paz", date: 6, slots: [] },
];

const CAPACITY = 25;
/* Sayaç ve yüzdeler takvimden türer, elle yazılmaz: takvim değişirse
   başlıktaki doluluk ve alttaki denge kendiliğinden düzelir. */
const TOTAL = WEEK.reduce((n, d) => n + d.slots.length, 0);
const MAX_PER_DAY = Math.max(...WEEK.map((d) => d.slots.length));
const BALANCE = (Object.keys(DOMAIN) as DomainKey[])
  .map((key) => ({
    key,
    label: DOMAIN[key].label,
    count: WEEK.reduce((n, d) => n + d.slots.filter((s) => GAME[s.game].domain === key).length, 0),
  }))
  .map((d) => ({ ...d, pct: Math.round((d.count / TOTAL) * 100) }))
  .sort((a, b) => b.pct - a.pct);

export function WeekRhythmPanel() {
  const reduced = useReducedMotion();

  return (
    <div
      className="rounded-2xl md:rounded-3xl overflow-hidden"
      style={{
        background: "var(--color-surface-strong)",
        border: "1px solid var(--color-line-strong)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <header
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 sm:px-6 py-3.5"
        style={{ borderBottom: "1px solid var(--color-line)" }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-muted)">
          Haftalık plan
        </span>
        {/* Renk anahtarı: bloklardaki renk ne anlama geliyor, tek satırda. */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
          {(Object.keys(DOMAIN) as DomainKey[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: DOMAIN[k].color }}
              />
              <span className="text-[11px] text-(--color-text-soft)">{DOMAIN[k].label}</span>
            </span>
          ))}
        </div>
        <span className="numeral ml-auto text-[11px] text-(--color-text-soft)">
          {TOTAL} / {CAPACITY} slot · %{Math.round((TOTAL / CAPACITY) * 100)}
        </span>
      </header>

      {/* Telefonda yedi sütun 55 piksele iner ve blokların içi okunmaz;
          şerit yatay kayar, sütunlar okunur genişliğini korur. */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[46rem] px-5 sm:px-6 pt-5 pb-6">
          <div className="grid grid-cols-7 gap-2">
            {WEEK.map((d) => (
              <div key={d.day} className="min-w-0">
                <div
                  className="flex items-baseline gap-1.5 pb-2 mb-2.5"
                  style={{ borderBottom: "1px solid var(--color-line)" }}
                >
                  <span className="text-[11px] font-bold text-(--color-text-body)">{d.day}</span>
                  <span className="numeral text-[11px] text-(--color-text-muted)">{d.date}</span>
                  <span className="ml-auto numeral text-[10px] text-(--color-text-muted)">
                    {d.slots.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {d.slots.map((s, si) => {
                    const g = GAME[s.game];
                    const c = DOMAIN[g.domain].color;
                    return (
                      <motion.div
                        key={`${d.day}-${s.time}`}
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{
                          duration: 0.45,
                          delay: si * 0.05 + d.date * 0.01,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="rounded-lg px-2.5 py-2"
                        style={{
                          background: `color-mix(in srgb, ${c} 12%, transparent)`,
                          borderLeft: `2px solid ${c}`,
                        }}
                      >
                        <p className="numeral text-[10px] m-0 leading-none" style={{ color: c }}>
                          {s.time}
                        </p>
                        <p className="text-[11.5px] font-bold text-(--color-text-strong) m-0 mt-1 leading-tight truncate">
                          {s.client}
                        </p>
                        <p className="text-[10.5px] text-(--color-text-muted) m-0 mt-0.5 leading-tight truncate">
                          {g.title}
                        </p>
                      </motion.div>
                    );
                  })}

                  {/* Boş slotlar kesik çerçeveyle durur: haftanın en dolu günü
                      kadar yer tutarlar, böylece sütunlar aynı tabana oturur ve
                      "burada yer var" görünür kalır. */}
                  {Array.from({ length: MAX_PER_DAY - d.slots.length }).map((_, i) => (
                    <span
                      key={`bos-${d.day}-${i}`}
                      className="block rounded-lg h-[3.75rem]"
                      style={{ border: "1px dashed var(--color-line-strong)" }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alan dengesi — planın hangi beceriye ne kadar yer ayırdığı. */}
      <div
        className="px-5 sm:px-6 py-4 sm:py-5"
        style={{ borderTop: "1px solid var(--color-line)" }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
          {BALANCE.map((b, i) => (
            <div key={b.key} className="min-w-0">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[11px] font-semibold text-(--color-text-soft) truncate">
                  {b.label}
                </span>
                <span className="numeral ml-auto text-[11px] text-(--color-text-muted)">
                  %{b.pct}
                </span>
              </div>
              <span
                className="block h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--color-line-soft)" }}
              >
                <motion.span
                  className="block h-full rounded-full origin-left"
                  style={{ background: DOMAIN[b.key].color, width: `${b.pct}%` }}
                  initial={reduced ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.8, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
