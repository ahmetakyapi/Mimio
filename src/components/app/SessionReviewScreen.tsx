"use client";

/*
 * Seans Sonu Değerlendirme — tasarım dokümanı 1n/1o.
 *
 * Seans akışının üçüncü ve son ekranı: Kitaplık → Canlı Seans → **Seans Sonu**.
 *
 * Buradaki iş skor göstermek değil, seansı *kayda geçirmek*. Ergoterapide
 * seans ancak notu yazıldığında tamamlanmış sayılır; ekran bu yüzden sağ
 * yarısını SOAP notuna ayırıyor ve alanları canlı seansta toplanan veriden
 * ön dolduruyor — terapist boş sayfayla değil, düzeltilecek bir taslakla
 * karşılaşıyor.
 */

import { useState } from "react";
import { Check, RotateCcw, FileBarChart } from "lucide-react";
import { INDEPENDENCE_STEPS } from "@/lib/deniz-derive";
import { Avatar, ScoreRing } from "./primitives";
import type { ClientProfile } from "@/lib/platform-data";

export interface ReviewMetric {
  label: string;
  value: string;
  unit: string;
  /** Önceki seansa göre değişim; boşsa "değişmedi" yazılır */
  delta?: string;
  deltaTone?: "green" | "red" | "neutral";
}

export interface DomainGain {
  label: string;
  from: number;
  to: number;
  color: string;
}

export interface SoapDraft {
  s: string;
  o: string;
  a: string;
  p: string;
}

const SOAP_FIELDS: ReadonlyArray<{ key: keyof SoapDraft; letter: string; label: string }> = [
  { key: "s", letter: "S", label: "Sübjektif" },
  { key: "o", letter: "O", label: "Objektif" },
  { key: "a", letter: "A", label: "Değerlendirme" },
  { key: "p", letter: "P", label: "Plan" },
];

interface Props {
  readonly client: ClientProfile | null;
  readonly gameTitle: string;
  readonly whenLabel: string;
  readonly difficulty: string;
  readonly savedAt: string;
  readonly score: number;
  readonly headline: string;
  readonly badges: readonly { text: string; tone: "green" | "primary" | "violet" }[];
  readonly metrics: readonly ReviewMetric[];
  readonly gains: readonly DomainGain[];
  readonly nextHint: string;
  /** Tur tur doğru/yanlış */
  readonly rounds: readonly boolean[];
  readonly soap: SoapDraft;
  readonly onSoapChange: (next: SoapDraft) => void;
  readonly independence: number;
  readonly onIndependenceChange: (v: number) => void;
  readonly onSave: () => void;
  readonly onReplay: () => void;
  readonly onAddToReport: () => void;
}

export function SessionReviewScreen({
  client,
  gameTitle,
  whenLabel,
  difficulty,
  savedAt,
  score,
  headline,
  badges,
  metrics,
  gains,
  nextHint,
  rounds,
  soap,
  onSoapChange,
  independence,
  onIndependenceChange,
  onSave,
  onReplay,
  onAddToReport,
}: Props) {
  const [saved, setSaved] = useState(false);
  const correct = rounds.filter(Boolean).length;

  const toneColor = (t?: string) =>
    t === "green" ? "var(--color-accent-green)" : t === "red" ? "var(--color-accent-red)" : "var(--color-text-soft)";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Üst çubuk ──
          Değerlendirme de tam ekran açılır: üst güvenli alan payı buradan
          gelir. Telefonda "Seans Tamamlandı" rozeti ve otomatik kayıt saati
          adın yanına sığmıyor, üçü birden şeridi taşırıyordu — küçük ekranda
          rozet alt satıra iner, saat düşer (bilgi aşağıdaki kartta zaten var). */}
      <header
        className="flex items-center gap-3.5 shrink-0 max-lg:flex-wrap max-lg:gap-y-2 max-lg:gap-x-2.5 max-lg:px-3 max-lg:py-2.5 lg:h-16 lg:px-[26px]"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 10px)",
          background: "var(--color-chrome-header)",
          borderBottom: "1px solid var(--color-line)",
          backdropFilter: "blur(18px)",
        }}
      >
        {client && <Avatar name={client.displayName} id={client.id} size={34} radius={11} />}
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-(--color-text-strong) truncate leading-tight">
            {client?.displayName ?? "Danışan"} · {gameTitle}
          </span>
          <span className="block text-[10.5px] text-(--color-text-soft) truncate leading-tight">
            {whenLabel} · {difficulty}
          </span>
        </span>

        <span
          className="flex items-center gap-[7px] shrink-0 text-[11px] font-semibold"
          style={{
            padding: "7px 13px",
            borderRadius: 9,
            background: "color-mix(in srgb, var(--color-accent-green) 12%, transparent)",
            color: "var(--color-accent-green)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-accent-green)" }} />
          Seans Tamamlandı
        </span>

        <span className="numeral ml-auto shrink-0 text-[11px] text-(--color-text-soft) max-lg:hidden">
          Otomatik kaydedildi · {savedAt}
        </span>
      </header>

      <div className="grid flex-1 min-h-0 deniz-split" style={{ ["--split" as string]: "minmax(0,1fr) 380px" }}>
        {/* ── Sol: sonuç ──
            Telefonda 30/32px'lik iç boşluk kartlara ~64px yiyordu; kaydırma
            da bu kutuda kalıyordu (tam ekran seans `.app-shell` dışında
            olduğu için ortak "iç kaydırıcıları serbest bırak" kuralı burada
            geçerli değil). Boşluk daralır, kaydırma kendi kutusunda kalır. */}
        <div className="flex flex-col gap-[18px] max-lg:gap-3 overflow-y-auto p-[30px_32px] max-lg:p-4">
          {/* Manşet — skor halkası + tek cümlelik yorum.
              132px'lik halka 320px'lik ekranda metne 120px bırakıyordu;
              telefonda halka küçülür ve blok dikeye döner. */}
          <div
            className="flex items-center gap-[30px] shrink-0 max-lg:flex-col max-lg:items-start max-lg:gap-4 p-[24px_28px] max-lg:p-4"
            style={{
              borderRadius: 22,
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              backdropFilter: "blur(14px)",
            }}
          >
            <span className="max-lg:hidden"><ScoreRing value={score} size={132} /></span>
            <span className="lg:hidden"><ScoreRing value={score} size={92} /></span>
            <div className="min-w-0">
              <div className="numeral text-[10px] font-medium uppercase tracking-[0.16em] text-(--color-text-soft) mb-2">
                Normalize Skor
              </div>
              <h1 className="m-0 mb-3 text-[clamp(1.1875rem,1.8vw,1.625rem)] leading-[1.1] text-(--color-text-strong)">
                {headline}
              </h1>
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b.text}
                    className="text-[11.5px] font-semibold"
                    style={{
                      padding: "6px 12px",
                      borderRadius: 9,
                      background:
                        b.tone === "green"
                          ? "color-mix(in srgb, var(--color-accent-green) 12%, transparent)"
                          : b.tone === "violet"
                            ? "color-mix(in srgb, var(--color-accent-violet) 12%, transparent)"
                            : "var(--color-primary-light)",
                      color:
                        b.tone === "green"
                          ? "var(--color-accent-green)"
                          : b.tone === "violet"
                            ? "var(--color-accent-violet)"
                            : "var(--color-primary-ink)",
                    }}
                  >
                    {b.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ölçümler */}
          <div className="grid gap-[13px] shrink-0" style={{ gridTemplateColumns: "var(--stat-cols, repeat(4, minmax(0,1fr)))" }}>
            {metrics.map((m) => (
              <div
                key={m.label}
                style={{ padding: "15px 17px", borderRadius: 15, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
              >
                <div className="numeral text-[9.5px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft) mb-2">
                  {m.label}
                </div>
                <div className="flex items-baseline gap-[5px]">
                  <span className="figure text-[25px] text-(--color-text-strong) leading-none">{m.value}</span>
                  <span className="text-[11px] font-medium text-(--color-text-soft)">{m.unit}</span>
                </div>
                <div className="numeral text-[10.5px] font-semibold mt-1.5" style={{ color: toneColor(m.deltaTone) }}>
                  {m.delta ?? "değişmedi"}
                </div>
              </div>
            ))}
          </div>

          {/* İki panel masaüstünde yan yana. Telefonda 1fr/1fr her birine
              ~160px bırakıyor, çift çubuklu domain grafiği okunmuyordu. */}
          <div className="grid gap-3.5 max-lg:gap-3 flex-1 min-h-0 max-lg:grid-cols-1 lg:grid-cols-2">
            {/* Domain kazanımı — çift çubuk: önce ve sonra üst üste */}
            <div
              className="flex flex-col min-h-0"
              style={{ padding: "19px 21px", borderRadius: 18, background: "var(--color-surface)", border: "1px solid var(--color-line)", backdropFilter: "blur(14px)" }}
            >
              <h2 className="font-display m-0 mb-3.5 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
                Domain Kazanımı
              </h2>
              <div className="flex flex-col gap-3.5">
                {gains.map((g) => (
                  <div key={g.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11.5px] font-semibold text-(--color-text-body)">{g.label}</span>
                      <span className="numeral text-[11px] font-semibold" style={{ color: g.color }}>
                        {g.from} → {g.to}
                      </span>
                    </div>
                    {/* Alttaki soluk çubuk "önce", üstteki dolu "sonra" */}
                    <span className="block relative rounded-full overflow-hidden" style={{ height: 7, background: "var(--color-line-strong)" }}>
                      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${g.from}%`, background: `color-mix(in srgb, ${g.color} 34%, transparent)` }} />
                      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${g.to}%`, background: g.color, opacity: 0.85 }} />
                    </span>
                  </div>
                ))}
              </div>
              {nextHint && (
                <div
                  className="mt-auto text-[11px] leading-[1.5]"
                  style={{ padding: "10px 12px", borderRadius: 11, background: "var(--color-primary-light)", color: "var(--color-text-body)" }}
                >
                  {nextHint}
                </div>
              )}
            </div>

            {/* Tur bazında — seansın ritmi, hangi turda düştüğü görünsün */}
            <div
              className="flex flex-col min-h-0"
              style={{ padding: "19px 21px", borderRadius: 18, background: "var(--color-surface)", border: "1px solid var(--color-line)", backdropFilter: "blur(14px)" }}
            >
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="font-display m-0 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
                  Tur Bazında
                </h2>
                {rounds.length > 0 && (
                  <span className="numeral text-[10.5px] font-semibold" style={{ color: "var(--color-accent-green)" }}>
                    {correct} / {rounds.length} doğru
                  </span>
                )}
              </div>
              {/*
                Çubuklar iki durumlu: tur ya doğru ya yanlış. Önceki sürüm
                yüksekliği `44 + (i * 17) % 52` ile üretiyordu — veriyle hiç
                ilgisi olmayan, her seansta aynı çıkan dekoratif bir desen.
                Sahte bir yükseklik, okuyanı "bu turda daha iyiydi" diye
                yanıltır. Doğru/yanlış tek boyda okunur.

                Çubuklar `maxWidth` ile sınırlı: az turlu bir seansta tek
                çubuk ekranı boydan boya kaplayınca veri değil hata gibi
                duruyordu.
              */}
              {rounds.length === 0 ? (
                <div className="flex-1 grid place-items-center min-h-[110px]">
                  <p className="m-0 text-center text-[11.5px] leading-[1.5] text-(--color-text-soft)">
                    Bu seansta tur kaydı oluşmadı.<br />Oyun oynandığında her tur buraya düşer.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex items-end justify-start gap-2 min-h-[110px]">
                  {rounds.map((ok, i) => (
                    <span key={i} className="flex flex-col items-center gap-1.5" style={{ flex: "1 1 0", maxWidth: 44 }}>
                      <span
                        className="w-full rounded-t-md"
                        style={{
                          height: ok ? 78 : 30,
                          background: ok ? "var(--gradient-bar)" : "var(--color-accent-red)",
                        }}
                        title={`${i + 1}. tur — ${ok ? "doğru" : "yanlış"}`}
                      />
                      <span className="numeral text-[9px] text-(--color-text-muted)">{i + 1}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sağ: kayıt ──
            Masaüstünde sol boşluk yok (sonuç sütununa yaslanır). Telefonda
            sütun alta indiği için o asimetri yamuk duruyordu; ayrıca alt
            güvenli alan payı burada verilmeli — bu ekran tam ekran çalışıyor
            ve "Notu Kaydet" düğmesi ana ekran çizgisinin üstünde kalıyordu. */}
        <div className="flex flex-col gap-3.5 overflow-y-auto p-[30px_30px_30px_0] max-lg:p-4 max-lg:pt-0 max-lg:pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div
            className="flex flex-col flex-1 min-h-0"
            style={{ padding: "22px 24px", borderRadius: 20, background: "var(--color-surface)", border: "1px solid var(--color-line)", backdropFilter: "blur(14px)" }}
          >
            <h2 className="font-display m-0 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
              Seans Notu
            </h2>
            <p className="m-0 mb-4 mt-1 text-[11px] text-(--color-text-soft)">SOAP formatı · otomatik ön dolgu</p>

            <div className="flex flex-col gap-3.5">
              {SOAP_FIELDS.map(({ key, letter, label }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="numeral grid place-items-center text-[10px] font-bold shrink-0"
                      style={{ width: 20, height: 20, borderRadius: 6, background: "var(--color-primary-light)", color: "var(--color-primary-ink)" }}
                    >
                      {letter}
                    </span>
                    <span className="text-[11px] font-semibold text-(--color-text-body)">{label}</span>
                  </div>
                  <textarea
                    value={soap[key]}
                    onChange={(e) => onSoapChange({ ...soap, [key]: e.target.value })}
                    rows={2}
                    className="w-full resize-none outline-none text-[11.5px] leading-[1.5] text-(--color-text-strong) placeholder:text-(--color-text-muted)"
                    style={{ padding: "10px 12px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
                  />
                </div>
              ))}
            </div>

            {/*
              Bağımsızlık düzeyi — seansın tek "yargı" alanı. Otomatik
              doldurulmuyor: skordan türetmek klinik olarak yanlış olurdu,
              bunu terapist gözlemiyle işaretler.
            */}
            <div className="mt-5">
              <div className="numeral text-[9.5px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft) mb-2.5">
                Bağımsızlık Düzeyi
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = n === independence;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onIndependenceChange(n)}
                      className={`numeral flex-1 text-[12px] font-semibold cursor-pointer transition-colors ${on ? "text-white border-transparent" : "text-(--color-text-soft) hover:text-(--color-text-body)"}`}
                      style={{
                        padding: "9px 0",
                        borderRadius: 10,
                        background: on ? "var(--gradient-signature-ink)" : "var(--color-surface-strong)",
                        border: `1px solid ${on ? "transparent" : "var(--color-line)"}`,
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10.5px] text-(--color-text-soft) mt-2">
                {independence} · {INDEPENDENCE_STEPS[independence - 1]}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setSaved(true); onSave(); }}
            className="btn-signature flex items-center justify-center gap-2 text-[13px] font-semibold cursor-pointer shrink-0"
            style={{ padding: 13, borderRadius: 13 }}
          >
            {saved ? <Check size={15} strokeWidth={2.4} /> : null}
            {saved ? "Kaydedildi" : "Notu Kaydet ve Kapat"}
          </button>

          <div className="flex gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onReplay}
              className="flex-1 flex items-center justify-center gap-2 text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
              style={{ padding: 12, borderRadius: 12, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            >
              <RotateCcw size={14} /> Tekrar Oyna
            </button>
            <button
              type="button"
              onClick={onAddToReport}
              className="flex-1 flex items-center justify-center gap-2 text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
              style={{ padding: 12, borderRadius: 12, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            >
              <FileBarChart size={14} /> Rapora Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
