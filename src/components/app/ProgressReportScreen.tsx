"use client";

/*
 * İlerleme Raporu — tasarım dokümanı 1r/1s.
 *
 * Üç sütun: solda bölüm seçimi ve dönem, ortada raporun kendisi, sağda
 * paylaşım.
 *
 * Ortadaki sütun bilinçli olarak "belge" gibi duruyor — klinik antet,
 * rapor numarası, dönem. Çünkü bu ekranın çıktısı aileye ya da kuruma
 * gidiyor; ekranda gördüğü şeyle elindeki PDF'in aynı olduğuna terapistin
 * güvenmesi gerekiyor. Bölüm listesi bir "içindekiler" değil, açma/kapama:
 * her klinik her bölümü paylaşmak istemiyor.
 *
 * ── Mobil kırılma noktaları: neden iki tane ──
 *
 * Ekranın geri kalanı gibi kabuk `lg` (1024px) kırılıyor. Ama orta sütun
 * yalnızca ekrana değil kâğıda da basılıyor: `@media print` kabuğu ve yan
 * sütunları düşürüp `.report-document`u tek başına bırakıyor, kâğıdın CSS
 * genişliği ise A4 + 14mm kenar boşluğunda ~690px. Belgenin içindeki
 * dönüşümler `lg`de yapılsaydı yazdırılan rapor da telefon düzenine
 * düşerdi — dört sütunlu tablo kâğıtta kart listesine dönerdi.
 *
 * Bu yüzden kural şu:
 *   · `.report-document` içi  → `max-[560px]:`  (kâğıt masaüstü düzenini korur)
 *   · Kontrol / paylaşım / başlık → `max-lg:`   (bunlar zaten yazdırmada gizli)
 */

import { useMemo, useState } from "react";
import { Download, FileText, Share2 } from "lucide-react";
import type { ClientProfile, RecentSessionEntry, ClientGoal } from "@/lib/platform-data";
import { gameTitle, metricsFor, INDEPENDENCE_STEPS, independenceOf } from "@/lib/deniz-derive";
import { normalizeScore } from "@/lib/game-constants";
import { Avatar, Eyebrow, ScreenHeader, Sparkline, StepBar, btnGhost } from "./primitives";
import { BlockMark } from "@/components/brand/BlockMark";

type SectionKey = "summary" | "curve" | "games" | "goals" | "independence" | "raw" | "family";

const SECTIONS: ReadonlyArray<{ key: SectionKey; label: string }> = [
  { key: "summary", label: "Özet ve Dönem" },
  { key: "curve", label: "Gelişim Eğrisi" },
  { key: "games", label: "Oyun Bazında Tablo" },
  { key: "goals", label: "Hedef Durumu" },
  { key: "independence", label: "Bağımsızlık Ölçeği" },
  { key: "raw", label: "Ham Seans Verisi" },
  { key: "family", label: "Aile Önerileri" },
];

const PERIODS = [
  { key: "30", label: "Son 30 Gün", days: 30 },
  { key: "90", label: "Son 90 Gün", days: 90 },
  { key: "all", label: "Tüm Zaman", days: null as number | null },
] as const;

/* Belge kartlarının kutu ölçüsü tek yerde: masaüstünde ferah, dar ekranda
   daralır ama yapışmaz. Telefonda 21px'lik yan pay 320px'te içeriğe kalan
   genişliğin %13'ünü yiyordu — tablo başlıkları kart kenarına değiyordu. */
const CARD_PAD = "p-[19px_21px] max-[560px]:p-[16px_15px]";
const PANEL_PAD = "p-[18px_20px] max-lg:p-[15px]";
/* Oyun tablosunun masaüstü sütun tarifi; başlık ve satırlar aynı olmalı. */
const GAME_COLS = "[grid-template-columns:1.6fr_0.8fr_0.8fr_1fr]";

interface Props {
  readonly client: ClientProfile | null;
  readonly clients: readonly ClientProfile[];
  readonly onSelectClient: (id: string) => void;
  readonly sessions: readonly RecentSessionEntry[];
  readonly goals: readonly ClientGoal[];
  readonly clinicName: string;
  readonly onExportCsv: () => void;
  readonly onExportPdf: () => void;
  /** Ayarlar'daki "danışan adlarını maskele" tercihi */
  readonly maskNames: boolean;
}

export function ProgressReportScreen({
  client,
  clients,
  onSelectClient,
  sessions,
  goals,
  clinicName,
  onExportCsv,
  onExportPdf,
  maskNames,
}: Props) {
  /* Maskeleme raporun her yerinde aynı olmalı; tek yerde türetiliyor. */
  const shown = (full: string) =>
    maskNames ? full.trim().split(/\s+/).map((w) => `${w[0]?.toLocaleUpperCase("tr-TR") ?? ""}.`).join(" ") : full;
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("90");
  const [enabled, setEnabled] = useState<readonly SectionKey[]>(SECTIONS.map((s) => s.key));

  const days = PERIODS.find((p) => p.key === period)?.days ?? null;

  const scoped = useMemo(() => {
    if (!client) return [];
    const cut = days ? Date.now() - days * 86400000 : 0;
    return sessions
      .filter((s) => s.clientId === client.id && (cut ? new Date(s.playedAt).getTime() >= cut : true))
      .slice()
      .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());
  }, [sessions, client, days]);

  const m = client ? metricsFor(client, scoped) : null;
  const first = scoped[0];
  const last = scoped[scoped.length - 1];
  /* Büyüme yüzdesi normalize skorlar üzerinden: dönemin ilk seansı Kart Eşle,
     sonuncusu Sıra Hafızası olduğunda ham puan farkı (280 → 9) "%97 azalış"
     gibi anlamsız bir sonuç veriyordu. */
  const firstNorm = first ? Math.round(normalizeScore(first.gameKey as never, first.score) * 100) : 0;
  const lastNorm = last ? Math.round(normalizeScore(last.gameKey as never, last.score) * 100) : 0;
  const growth = first && last && firstNorm > 0 ? Math.round(((lastNorm - firstNorm) / firstNorm) * 100) : null;

  /* Oyun bazında tablo — eğilim son iki ölçümün farkından. */
  const perGame = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const s of scoped) {
      const arr = map.get(s.gameKey) ?? [];
      /* Normalize: tablodaki "Ort." sütunu oyunlar arasında kıyaslanabilir
         olmalı; ham puanla Kart Eşle hep en yüksek görünüyordu. */
      arr.push(Math.round(normalizeScore(s.gameKey as never, s.score) * 100));
      map.set(s.gameKey, arr);
    }
    return Array.from(map.entries()).map(([key, xs]) => {
      const avg = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
      let trend = "— yeni";
      if (xs.length >= 3) {
        const d = xs[xs.length - 1] - xs[0];
        trend = d > 4 ? "↑ artıyor" : d < -4 ? "↓ düşüyor" : "→ stabil";
      }
      return { key, label: gameTitle(key as never), count: xs.length, avg, trend };
    }).sort((a, b) => b.count - a.count);
  }, [scoped]);

  const on = (k: SectionKey) => enabled.includes(k);
  const toggle = (k: SectionKey) =>
    setEnabled((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  const periodLabel = first && last
    ? `${new Date(first.playedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })} – ${new Date(last.playedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}`
    : "—";

  return (
    /*
     * `h-full` + `flex-1 min-h-0` masaüstünde doğru: kabuk sabit yükseklikte,
     * üç sütun kalan alanı paylaşır. Telefonda yükseklik içerikten gelmeli,
     * yoksa ızgara sıfır yükseklikli bir kutuya inip içeriğini dışarı taşır.
     *
     * Alttaki `pb`: rapor "kendi kaydırıcısını yöneten" ekranlardan biri,
     * bu yüzden kaydırma kabı `flex flex-col` kalıyor ve `.app-shell` bir
     * flex ögesi olarak görünür alana (449px) kadar büzülüyor. Büzülen
     * kutunun ardına düşen `--chrome-bottom` payı içeriğin altına gelmiyor,
     * raporun son kartı alt sekme çubuğunun arkasında kalıyordu. Pay burada,
     * taşan içeriğin kendi içinde veriliyor. Kabuk tarafında
     * `.app-scroll > .app-shell { flex: none }` uygulanırsa bu satır düşer.
     */
    <div className="flex flex-col gap-5 max-lg:gap-4 h-full max-lg:h-auto min-h-0 max-lg:pb-[var(--chrome-bottom)]">
      <ScreenHeader
        eyebrow={client ? `${shown(client.displayName)} · ${periodLabel}` : "Danışan seçilmedi"}
        title="İlerleme Raporu"
        sub="Aileyle paylaşılabilir · yazdırmaya hazır · CSV eki dahil"
        actions={
          <span className="print-hide flex items-center gap-2.5">
            {clients.length > 0 && (
              /* `min-w-0` şart: uzun danışan adı select'in min-content
                 tabanını 320px ekranda başlık satırının dışına taşıyordu. */
              <select
                value={client?.id ?? ""}
                onChange={(e) => onSelectClient(e.target.value)}
                className="text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer outline-none min-w-0 max-w-full"
                style={{ padding: "10px 12px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            )}
            <button type="button" className={btnGhost} onClick={onExportCsv} disabled={!client}>
              <span className="inline-flex items-center justify-center gap-2"><FileText size={14} /> CSV</span>
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={!client}
              className="btn-signature flex items-center justify-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
            >
              <Download size={15} /> PDF İndir
            </button>
          </span>
        }
      />

      {!client ? (
        /* Telefonda kabuk yüksekliği içerikten geldiği için `flex-1` sıfıra
           çöküyordu; boş durum kutusu görünmez oluyordu. */
        <div className="glass rounded-[18px] flex-1 max-lg:min-h-[180px] grid place-items-center p-6">
          <p className="m-0 text-[12.5px] text-(--color-text-soft) text-center">Rapor için bir danışan seç.</p>
        </div>
      ) : (
        <div
          className="grid gap-4 flex-1 max-lg:flex-none min-h-0 deniz-split report-split"
          style={{ ["--split" as string]: "236px minmax(0,1fr) 250px" }}
        >
          {/* ── Sol: bölümler + dönem ──
              Telefonda bu sütun (bir ayar paneli) ekranı kaplayıp asıl raporu
              aşağı itiyordu; `report-controls` mobilde onu belgenin altına
              alır. Ekranın konusu rapor, raporun ayarları değil. */}
          <div className="report-controls flex flex-col gap-3.5 max-lg:gap-3 overflow-y-auto min-h-0">
            <div className={`glass rounded-[18px] ${PANEL_PAD}`}>
              <Eyebrow className="mb-3">Bölümler</Eyebrow>
              <div className="flex flex-col gap-1">
                {SECTIONS.map((sec) => (
                  /* Telefonda vurulabilir alan kutunun 22px'i değil satırın
                     tamamı: `min-h-11` (44px) satır yüksekliğini garantiler,
                     negatif yan pay hedefi kartın kenarına kadar genişletir.
                     Dikey pay sıfırlanıyor — 44px zaten nefes payını veriyor,
                     üstüne 7px eklenince yedi satırlık liste ekranı doldurup
                     dönem seçimini görünmez kılıyordu. */
                  <label
                    key={sec.key}
                    className="flex items-center gap-2.5 cursor-pointer select-none text-[12px] font-medium text-(--color-text-body) py-[7px] max-lg:py-0 max-lg:min-h-11 max-lg:-mx-2 max-lg:px-2 max-lg:rounded-[10px]"
                  >
                    <input
                      type="checkbox"
                      checked={on(sec.key)}
                      onChange={() => toggle(sec.key)}
                      className="appearance-none shrink-0 cursor-pointer grid place-items-center"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 5,
                        background: on(sec.key) ? "var(--gradient-signature-ink)" : "transparent",
                        border: `1px solid ${on(sec.key) ? "transparent" : "var(--color-line-strong)"}`,
                      }}
                    />
                    {sec.label}
                  </label>
                ))}
              </div>
            </div>

            <div className={`glass rounded-[18px] ${PANEL_PAD}`}>
              <Eyebrow className="mb-3">Dönem</Eyebrow>
              <div className="flex flex-col gap-1.5">
                {PERIODS.map((p) => {
                  const sel = p.key === period;
                  return (
                    /* `min-h-11`: 9px dikey pay + 12px punto = 35px'lik bir
                       düğme; parmakla dönem değiştirmek için yetersizdi. */
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPeriod(p.key)}
                      aria-pressed={sel}
                      className={`text-left text-[12px] font-semibold cursor-pointer border transition-colors px-3 py-[9px] max-lg:min-h-11 rounded-[10px] ${sel ? "text-(--color-primary-ink)" : "text-(--color-text-body) border-transparent hover:text-(--color-primary)"}`}
                      style={{
                        background: sel ? "var(--gradient-signature-soft)" : "transparent",
                        borderColor: sel ? "var(--color-line-strong)" : "transparent",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Orta: belge ──
              `pr-1` masaüstündeki iç kaydırma çubuğuna pay bırakıyor;
              telefonda iç kaydırıcı yok, o payı içeriğe geri veriyoruz. */}
          <div className="report-document flex flex-col gap-3.5 max-lg:gap-3 overflow-y-auto min-h-0 lg:pr-1">
            {on("summary") && (
              <div className="glass rounded-[18px] p-[22px_24px] max-[560px]:p-[16px_15px]">
                {/* Antet — çıktı ile ekranın aynı olduğuna güven buradan gelir.
                    Dar ekranda iki blok yan yana durmuyordu: klinik adı üç
                    satıra bölünürken sağdaki rapor numarası "MIM-2026-\n0184"
                    diye kırılıyordu. Telefonda alt alta, ikisi de sola dayalı. */}
                <div className="flex items-start justify-between gap-4 mb-4 pb-3.5 border-b border-(--color-line) max-[560px]:flex-col max-[560px]:gap-2">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="tile-signature grid place-items-center shrink-0" style={{ width: 30, height: 30, borderRadius: 9 }}>
                      <BlockMark size={16} color="#ffffff" />
                    </span>
                    <span className="text-[12.5px] font-bold text-(--color-text-strong)">{clinicName}</span>
                  </span>
                  <span className="text-right shrink-0 max-[560px]:text-left">
                    <span className="numeral block text-[9.5px] text-(--color-text-soft)">
                      Rapor no MIM-{new Date().getFullYear()}-{String(scoped.length * 7 + 100).padStart(4, "0")}
                    </span>
                    <span className="numeral block text-[9.5px] text-(--color-text-soft) mt-0.5">Dönem {periodLabel}</span>
                  </span>
                </div>

                <h2 className="font-display m-0 mb-2.5 text-[15.5px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
                  {shown(client.displayName)} — Gelişim Özeti
                </h2>
                <p className="m-0 text-[12px] leading-[1.65] text-(--color-text-body)">
                  Dönem boyunca <strong className="font-bold text-(--color-text-strong)">{scoped.length} yapılandırılmış seans</strong> gerçekleştirildi.
                  {growth !== null && (
                    <>
                      {" "}Normalize skorda{" "}
                      <strong className="font-bold" style={{ color: growth >= 0 ? "var(--color-accent-green)" : "var(--color-accent-red)" }}>
                        %{Math.abs(growth)} {growth >= 0 ? "artış" : "azalış"}
                      </strong>{" "}gözlendi.
                    </>
                  )}
                  {client.supportLevel && (
                    <> Bağımsızlık düzeyi <strong className="font-bold text-(--color-text-strong)">{INDEPENDENCE_STEPS[independenceOf(client.supportLevel) - 1]}</strong> olarak kaydedildi.</>
                  )}
                </p>

                {/* Dört ölçüm telefonda 2×2. Tek satırda dördü, 320px'te kutu
                    başına ~76px bırakıyordu: "Ort. Skor" iki satıra bölünüyor,
                    sayı etiketle aynı hizaya sıkışıyordu. */}
                <div className="grid gap-[9px] mt-4 [grid-template-columns:repeat(4,minmax(0,1fr))] max-[560px]:[grid-template-columns:repeat(2,minmax(0,1fr))]">
                  {[
                    { l: "Seans", v: String(scoped.length) },
                    { l: "Ort. Skor", v: m?.averageScore != null ? String(m.averageScore) : "—" },
                    { l: "Son Skor", v: last ? String(lastNorm) : "—" },
                    { l: "Hedef", v: "85" },
                  ].map((x) => (
                    <div
                      key={x.l}
                      className="rounded-[13px] p-[12px_14px] max-[560px]:p-[11px_12px] bg-(--color-surface-strong) border border-(--color-line)"
                    >
                      <div className="numeral text-[9px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft) mb-1.5">{x.l}</div>
                      <div className="figure text-[20px] text-(--color-text-strong) leading-none">{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {on("curve") && m && m.series.length >= 3 && (
              <div className={`glass rounded-[18px] ${CARD_PAD}`}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Gelişim Eğrisi</h3>
                {/* Sparkline `preserveAspectRatio="none"` çiziyor: 620 birimlik
                    viewBox 250px'lik telefon kabına oturunca yatay ölçek 0,4'e
                    düşüyor, uç noktadaki daire ince bir dikey çizgiye
                    dönüşüyordu. Dar ekranda kabına yakın bir viewBox veriliyor;
                    grafik iki durumda da kabına sığar, oranı bozulmaz. */}
                <div className="max-[560px]:hidden">
                  <Sparkline series={m.series} id="report-curve" width={620} height={90} />
                </div>
                <div className="hidden max-[560px]:block">
                  <Sparkline series={m.series} id="report-curve-sm" width={300} height={74} />
                </div>
              </div>
            )}

            {on("games") && perGame.length > 0 && (
              <div className={`glass rounded-[18px] ${CARD_PAD}`}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Oyun Bazında Performans</h3>
                {/* Başlık satırı yalnızca tablo düzeninde anlam taşır; telefonda
                    satırlar kendi etiketini yanında taşıyan kartlara döndüğü
                    için gizleniyor. Dört sütun 320px'te oyun adına 90px
                    bırakıyordu — "Hedef Tara…" diye kesiliyordu. */}
                <div className={`grid gap-2.5 pb-1.5 border-b border-(--color-line) ${GAME_COLS} max-[560px]:hidden`}>
                  {["Oyun", "Seans", "Ort.", "Eğilim"].map((h) => (
                    <Eyebrow key={h}>{h}</Eyebrow>
                  ))}
                </div>
                {perGame.map((g) => (
                  <div
                    key={g.key}
                    className={`grid gap-2.5 items-center py-[9px] border-b border-(--color-line-soft) ${GAME_COLS} max-[560px]:flex max-[560px]:flex-wrap max-[560px]:items-baseline max-[560px]:gap-x-2.5 max-[560px]:gap-y-1 max-[560px]:py-2.5`}
                  >
                    <span className="text-[12px] font-semibold text-(--color-text-strong) truncate max-[560px]:basis-full max-[560px]:overflow-visible max-[560px]:whitespace-normal">
                      {g.label}
                    </span>
                    <span className="numeral text-[12px] text-(--color-text-body)">
                      {g.count}
                      <span className="hidden max-[560px]:inline font-medium text-(--color-text-soft)"> seans</span>
                    </span>
                    <span className="numeral text-[12px] font-semibold text-(--color-primary)">
                      <span className="hidden max-[560px]:inline font-medium text-(--color-text-soft)">ort. </span>
                      {g.avg}
                    </span>
                    <span
                      className="numeral text-[11px] font-semibold max-[560px]:ml-auto"
                      style={{ color: g.trend.startsWith("↑") ? "var(--color-accent-green)" : g.trend.startsWith("↓") ? "var(--color-accent-red)" : "var(--color-text-soft)" }}
                    >
                      {g.trend}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {on("goals") && goals.length > 0 && (
              <div className={`glass rounded-[18px] ${CARD_PAD}`}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Hedef Durumu</h3>
                <div className="flex flex-col gap-3">
                  {goals.map((g) => {
                    const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
                    return (
                      <div key={g.id}>
                        {/* Uzun hedef başlığı sayıyı ezmesin: başlık sarar,
                            "12 / 20" hiçbir genişlikte kırılmaz. */}
                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                          <span className="text-[11.5px] font-semibold text-(--color-text-body) min-w-0">{g.title}</span>
                          <span className="numeral text-[11px] font-semibold shrink-0" style={{ color: "var(--color-primary)" }}>
                            {g.currentValue} / {g.targetValue}
                          </span>
                        </div>
                        <span className="block rounded-full overflow-hidden" style={{ height: 6, background: "var(--color-line-strong)" }}>
                          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: "var(--gradient-bar)" }} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {on("independence") && m && (
              <div className={`glass rounded-[18px] ${CARD_PAD}`}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Bağımsızlık Ölçeği</h3>
                {/* Beş adım × 38px = 202px; 320px ekranda bu ölçek etiketi iki
                    satıra bölüyor, "3 / 5" değerini kartın dışına itiyordu.
                    Dar ekranda adımlar daralır, satır tek satır kalır. */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex shrink-0 max-[560px]:hidden">
                    <StepBar value={m.independence} width={38} height={7} />
                  </span>
                  <span className="hidden shrink-0 max-[560px]:inline-flex">
                    <StepBar value={m.independence} width={18} height={7} />
                  </span>
                  <span className="text-[12px] font-semibold text-(--color-text-strong) min-w-0">{m.independenceLabel}</span>
                  <span className="numeral ml-auto shrink-0 text-[11px] text-(--color-text-soft)">{m.independence} / 5</span>
                </div>
              </div>
            )}

            {on("raw") && scoped.length > 0 && (
              <div className={`glass rounded-[18px] ${CARD_PAD}`}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Ham Seans Verisi</h3>
                <div className="flex flex-col gap-1">
                  {scoped.slice().reverse().slice(0, 12).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 max-[560px]:gap-2 text-[11.5px] py-1.5 border-b border-(--color-line-soft)"
                    >
                      {/* Tarih sütunu masaüstünde 68px; dar ekranda "15/08"
                          için 46px yetiyor, artan pay oyun adına gidiyor. */}
                      <span className="numeral text-(--color-text-soft) shrink-0 w-[68px] max-[560px]:w-[46px]">
                        {new Date(s.playedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <span className="flex-1 min-w-0 text-(--color-text-body) truncate">{gameTitle(s.gameKey)}</span>
                      {/* Ham veri bölümü: puan kendi biriminde, yanında normalize karşılığı. */}
                      <span className="numeral text-(--color-text-soft) shrink-0">{s.score}</span>
                      <span className="numeral font-semibold text-(--color-text-strong) shrink-0 w-[38px] text-right">
                        %{Math.round(normalizeScore(s.gameKey as never, s.score) * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sağ: paylaşım ── */}
          <div className="report-share flex flex-col gap-3.5 max-lg:gap-3 overflow-y-auto min-h-0">
            <div className={`glass rounded-[18px] ${PANEL_PAD}`}>
              <div className="flex items-center gap-2 mb-2.5">
                <Share2 size={15} strokeWidth={1.9} style={{ color: "var(--color-primary)" }} />
                <span className="font-display text-[13.5px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Aileyle Paylaş</span>
              </div>
              {/* Paylaşım bağlantısı altyapısı yok; olmayan bir özelliği
                  vadetmek yerine gerçek yolu sunuyoruz: yazdır ya da PDF
                  olarak kaydet, aileye o dosyayı ilet. */}
              <p className="m-0 mb-3.5 text-[11px] leading-[1.5] text-(--color-text-soft)">
                Raporu PDF olarak kaydet, aileyle ya da kurumla dosya olarak paylaş.
                İsim maskeleme Ayarlar&apos;dan açılır.
              </p>
              {/* Birincil eylem başlıktaki "PDF İndir"; burada aynı eylemin
                  ikincil tekrarı var — sayfada tek imza düğmesi kuralı bozulmasın. */}
              <button
                type="button"
                onClick={onExportPdf}
                className="w-full text-[12px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary) p-2.5 max-lg:min-h-11 rounded-[11px] bg-(--color-surface-strong) border border-(--color-line)"
              >
                PDF Olarak Kaydet
              </button>
            </div>

            {on("family") && (
              <div
                className={`rounded-[18px] flex-1 ${PANEL_PAD}`}
                style={{ background: "var(--gradient-signature-soft)", border: "1px solid var(--color-line-strong)" }}
              >
                <Eyebrow className="!text-(--color-primary-ink) mb-2.5">Aile Önerileri</Eyebrow>
                <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                  {[
                    "Ev programındaki aktiviteyi haftada 3 kez, 10'ar dakika uygulayın.",
                    "Seans sonrası çocuğun kendi değerlendirmesini sorun.",
                    "Yorgunluk belirtisinde süreyi kısaltın, sıklığı koruyun.",
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-[11.5px] leading-[1.5] text-(--color-text-body)">
                      <span className="shrink-0 mt-1.5" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-primary)" }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass rounded-[18px] flex items-center gap-2.5 p-[14px_16px]">
              {client && <Avatar name={client.displayName} id={client.id} size={30} radius={10} />}
              <span className="min-w-0">
                <span className="block text-[12px] font-bold text-(--color-text-strong) truncate">{shown(client.displayName)}</span>
                <span className="numeral block text-[9.5px] text-(--color-text-soft)">{scoped.length} seans · {periodLabel}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
