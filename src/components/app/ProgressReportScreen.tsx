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
 */

import { useMemo, useState } from "react";
import { Download, FileText, Share2 } from "lucide-react";
import type { ClientProfile, RecentSessionEntry, ClientGoal } from "@/lib/platform-data";
import { gameTitle, metricsFor, INDEPENDENCE_STEPS, independenceOf } from "@/lib/deniz-derive";
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
  const growth = first && last && first.score > 0 ? Math.round(((last.score - first.score) / first.score) * 100) : null;

  /* Oyun bazında tablo — eğilim son iki ölçümün farkından. */
  const perGame = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const s of scoped) {
      const arr = map.get(s.gameKey) ?? [];
      arr.push(s.score);
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
    <div className="flex flex-col gap-5 h-full min-h-0">
      <ScreenHeader
        eyebrow={client ? `${shown(client.displayName)} · ${periodLabel}` : "Danışan seçilmedi"}
        title="İlerleme Raporu"
        sub="Aileyle paylaşılabilir · yazdırmaya hazır · CSV eki dahil"
        actions={
          <>
            {clients.length > 0 && (
              <select
                value={client?.id ?? ""}
                onChange={(e) => onSelectClient(e.target.value)}
                className="text-[12.5px] font-semibold text-(--color-text-body) cursor-pointer outline-none"
                style={{ padding: "10px 12px", borderRadius: 11, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            )}
            <button type="button" className={btnGhost} onClick={onExportCsv} disabled={!client}>
              <span className="inline-flex items-center gap-2"><FileText size={14} /> CSV</span>
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={!client}
              className="btn-signature flex items-center gap-2 px-[19px] py-[11px] rounded-xl text-[12.5px] font-semibold cursor-pointer"
            >
              <Download size={15} /> PDF İndir
            </button>
          </>
        }
      />

      {!client ? (
        <div className="glass rounded-[18px] flex-1 grid place-items-center">
          <p className="m-0 text-[12.5px] text-(--color-text-soft)">Rapor için bir danışan seç.</p>
        </div>
      ) : (
        <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: "236px minmax(0,1fr) 250px" }}>
          {/* ── Sol: bölümler + dönem ── */}
          <div className="flex flex-col gap-3.5 overflow-y-auto min-h-0">
            <div className="glass rounded-[18px]" style={{ padding: "18px 20px" }}>
              <Eyebrow className="mb-3">Bölümler</Eyebrow>
              <div className="flex flex-col gap-1">
                {SECTIONS.map((sec) => (
                  <label
                    key={sec.key}
                    className="flex items-center gap-2.5 cursor-pointer text-[12px] font-medium text-(--color-text-body)"
                    style={{ padding: "7px 0" }}
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
                        background: on(sec.key) ? "var(--gradient-signature)" : "transparent",
                        border: `1px solid ${on(sec.key) ? "transparent" : "var(--color-line-strong)"}`,
                      }}
                    />
                    {sec.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="glass rounded-[18px]" style={{ padding: "18px 20px" }}>
              <Eyebrow className="mb-3">Dönem</Eyebrow>
              <div className="flex flex-col gap-1.5">
                {PERIODS.map((p) => {
                  const sel = p.key === period;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPeriod(p.key)}
                      aria-pressed={sel}
                      className={`text-left text-[12px] font-semibold cursor-pointer border transition-colors ${sel ? "text-(--color-primary-ink)" : "text-(--color-text-body) border-transparent hover:text-(--color-primary)"}`}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 10,
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

          {/* ── Orta: belge ── */}
          <div className="flex flex-col gap-3.5 overflow-y-auto min-h-0 pr-1">
            {on("summary") && (
              <div className="glass rounded-[18px]" style={{ padding: "22px 24px" }}>
                {/* Antet — çıktı ile ekranın aynı olduğuna güven buradan gelir */}
                <div className="flex items-start justify-between gap-4 mb-4" style={{ paddingBottom: 14, borderBottom: "1px solid var(--color-line)" }}>
                  <span className="flex items-center gap-2.5">
                    <span className="tile-signature grid place-items-center shrink-0" style={{ width: 30, height: 30, borderRadius: 9 }}>
                      <BlockMark size={16} color="#ffffff" />
                    </span>
                    <span className="text-[12.5px] font-bold text-(--color-text-strong)">{clinicName}</span>
                  </span>
                  <span className="text-right">
                    <span className="numeral block text-[9.5px] text-(--color-text-soft)">
                      Rapor no MIM-{new Date().getFullYear()}-{String(scoped.length * 7 + 100).padStart(4, "0")}
                    </span>
                    <span className="numeral block text-[9.5px] text-(--color-text-soft) mt-0.5">Dönem {periodLabel}</span>
                  </span>
                </div>

                <h2 className="font-display m-0 mb-2.5 text-[17px] font-bold tracking-[-0.02em] text-(--color-text-strong)">
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

                <div className="grid gap-[9px] mt-4" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
                  {[
                    { l: "Seans", v: String(scoped.length) },
                    { l: "Ort. Skor", v: m?.averageScore != null ? String(m.averageScore) : "—" },
                    { l: "Son Skor", v: last ? String(last.score) : "—" },
                    { l: "Hedef", v: "85" },
                  ].map((x) => (
                    <div key={x.l} style={{ padding: "12px 14px", borderRadius: 13, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}>
                      <div className="numeral text-[9px] font-semibold uppercase tracking-[0.08em] text-(--color-text-soft) mb-1.5">{x.l}</div>
                      <div className="figure text-[20px] text-(--color-text-strong) leading-none">{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {on("curve") && m && m.series.length >= 3 && (
              <div className="glass rounded-[18px]" style={{ padding: "19px 21px" }}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Gelişim Eğrisi</h3>
                <Sparkline series={m.series} id="report-curve" width={620} height={90} />
              </div>
            )}

            {on("games") && perGame.length > 0 && (
              <div className="glass rounded-[18px]" style={{ padding: "19px 21px" }}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Oyun Bazında Performans</h3>
                <div className="grid gap-2.5" style={{ gridTemplateColumns: "1.6fr .8fr .8fr 1fr", paddingBottom: 6, borderBottom: "1px solid var(--color-line)" }}>
                  {["Oyun", "Seans", "Ort.", "Eğilim"].map((h) => (
                    <Eyebrow key={h}>{h}</Eyebrow>
                  ))}
                </div>
                {perGame.map((g) => (
                  <div key={g.key} className="grid gap-2.5 items-center" style={{ gridTemplateColumns: "1.6fr .8fr .8fr 1fr", padding: "9px 0", borderBottom: "1px solid var(--color-line-soft)" }}>
                    <span className="text-[12px] font-semibold text-(--color-text-strong) truncate">{g.label}</span>
                    <span className="numeral text-[12px] text-(--color-text-body)">{g.count}</span>
                    <span className="numeral text-[12px] font-semibold" style={{ color: "var(--color-primary)" }}>{g.avg}</span>
                    <span
                      className="numeral text-[11px] font-semibold"
                      style={{ color: g.trend.startsWith("↑") ? "var(--color-accent-green)" : g.trend.startsWith("↓") ? "var(--color-accent-red)" : "var(--color-text-soft)" }}
                    >
                      {g.trend}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {on("goals") && goals.length > 0 && (
              <div className="glass rounded-[18px]" style={{ padding: "19px 21px" }}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Hedef Durumu</h3>
                <div className="flex flex-col gap-3">
                  {goals.map((g) => {
                    const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
                    return (
                      <div key={g.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11.5px] font-semibold text-(--color-text-body)">{g.title}</span>
                          <span className="numeral text-[11px] font-semibold" style={{ color: "var(--color-primary)" }}>
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
              <div className="glass rounded-[18px]" style={{ padding: "19px 21px" }}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Bağımsızlık Ölçeği</h3>
                <div className="flex items-center gap-3">
                  <StepBar value={m.independence} width={38} height={7} />
                  <span className="text-[12px] font-semibold text-(--color-text-strong)">{m.independenceLabel}</span>
                  <span className="numeral ml-auto text-[11px] text-(--color-text-soft)">{m.independence} / 5</span>
                </div>
              </div>
            )}

            {on("raw") && scoped.length > 0 && (
              <div className="glass rounded-[18px]" style={{ padding: "19px 21px" }}>
                <h3 className="font-display m-0 mb-3 text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Ham Seans Verisi</h3>
                <div className="flex flex-col gap-1">
                  {scoped.slice().reverse().slice(0, 12).map((s) => (
                    <div key={s.id} className="flex items-center gap-3 text-[11.5px]" style={{ padding: "6px 0", borderBottom: "1px solid var(--color-line-soft)" }}>
                      <span className="numeral text-(--color-text-soft) shrink-0" style={{ width: 68 }}>
                        {new Date(s.playedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <span className="flex-1 text-(--color-text-body) truncate">{gameTitle(s.gameKey)}</span>
                      <span className="numeral font-semibold text-(--color-text-strong)">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sağ: paylaşım ── */}
          <div className="flex flex-col gap-3.5 overflow-y-auto min-h-0">
            <div className="glass rounded-[18px]" style={{ padding: "18px 20px" }}>
              <div className="flex items-center gap-2 mb-2.5">
                <Share2 size={15} strokeWidth={1.9} style={{ color: "var(--color-primary)" }} />
                <span className="font-display text-[13.5px] font-bold tracking-[-0.02em] text-(--color-text-strong)">Aileyle Paylaş</span>
              </div>
              <p className="m-0 mb-3.5 text-[11px] leading-[1.5] text-(--color-text-soft)">
                Rapor bağlantısı 14 gün geçerli olur, klinik verisi maskelenir.
              </p>
              <button
                type="button"
                onClick={onExportPdf}
                className="btn-signature w-full text-[12px] font-semibold cursor-pointer"
                style={{ padding: 10, borderRadius: 11 }}
              >
                Bağlantı Oluştur
              </button>
            </div>

            {on("family") && (
              <div
                className="rounded-[18px] flex-1"
                style={{ padding: "18px 20px", background: "var(--gradient-signature-soft)", border: "1px solid var(--color-line-strong)" }}
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

            <div className="glass rounded-[18px] flex items-center gap-2.5" style={{ padding: "14px 16px" }}>
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
