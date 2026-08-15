"use client";

/*
 * Yeni Danışan Akışı — tasarım dokümanı 1z/1aa.
 *
 * Tek uzun form yerine üç adım: Kimlik → Hedef → Bağımsızlık.
 *
 * Bölme keyfi değil, alanların ne zaman bilindiğine göre: kimlik kayıt
 * anında bellidir, hedef ilk değerlendirmede konur, bağımsızlık düzeyi
 * gözlem gerektirir. Tek sayfada sorulduğunda terapist henüz bilmediği
 * alanı boş geçiyor ve profil yarım kalıyordu; üç adım "şimdilik buraya
 * kadar" demeyi mümkün kılıyor.
 *
 * Öneri motoru ikinci adımın sonunda devreye giriyor: hedef seçilir
 * seçilmez kaç oyun ve aktivitenin eşleştiği görünüyor, böylece seçim
 * soyut kalmıyor.
 */

import { useMemo, useState } from "react";
import { X, Check, UserPlus } from "lucide-react";
import { GAME_TABS } from "@/lib/game-constants";
import { INDEPENDENCE_STEPS } from "@/lib/deniz-derive";
import { Avatar, Eyebrow } from "./primitives";
import { useScrollLock } from "@/hooks/useScrollLock";

const AREAS = ["Pediatrik", "Nörolojik", "Nöroçeşitlilik & Otizm", "Geriatrik", "İş & Okul"] as const;

/* Hedef alanları — her biri bir oyun kümesine bağlı, öneri sayısı buradan çıkar. */
const GOALS: ReadonlyArray<{ title: string; sub: string; games: readonly string[] }> = [
  { title: "Oyun Katılımı", sub: "Duyusal · sosyal etkileşim", games: ["pulse", "difference"] },
  { title: "İnce Motor", sub: "Kalem tutma, kesme", games: ["pulse", "route"] },
  { title: "Çalışma Belleği", sub: "Sıra ve örüntü hatırlama", games: ["memory", "pairs", "logic"] },
  { title: "Seçici Dikkat", sub: "Görsel tarama, filtreleme", games: ["scan", "difference"] },
];

const AGE_BANDS = ["0-3", "4-5", "6-8", "9-11", "12-14", "15-18", "18+"] as const;
const FREQUENCIES = ["Haftada 1", "Haftada 2", "Haftada 3", "İki haftada 1"] as const;

export interface NewClientDraft {
  displayName: string;
  birthDate: string;
  ageGroup: string;
  area: string;
  primaryGoal: string;
  frequency: string;
  targetDate: string;
  independence: number;
  difficultyLevel: string;
}

const EMPTY: NewClientDraft = {
  displayName: "",
  birthDate: "",
  ageGroup: "6-8",
  area: "Pediatrik",
  primaryGoal: "",
  frequency: "Haftada 2",
  targetDate: "",
  independence: 3,
  difficultyLevel: "Orta",
};

interface Props {
  readonly clinicName: string;
  readonly onClose: () => void;
  readonly onSubmit: (draft: NewClientDraft) => void;
}

export function NewClientFlow({ clinicName, onClose, onSubmit }: Props) {
  /* Modal açıkken arkadaki kabuk kaymasın. */
  useScrollLock(true);
  const [step, setStep] = useState(1);
  const [d, setD] = useState<NewClientDraft>(EMPTY);

  const set = <K extends keyof NewClientDraft>(k: K, v: NewClientDraft[K]) => setD((c) => ({ ...c, [k]: v }));

  /* Eşleşen oyun/aktivite sayısı — seçim soyut kalmasın. */
  const match = useMemo(() => {
    const g = GOALS.find((x) => x.title === d.primaryGoal);
    if (!g) return null;
    const games = GAME_TABS.filter((t) => g.games.includes(t.key)).length;
    return { games, activities: games * 2 };
  }, [d.primaryGoal]);

  const canNext = step === 1 ? d.displayName.trim().length > 1 : step === 2 ? Boolean(d.primaryGoal) : true;

  const field = "w-full text-[13px] text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted)";
  const fieldStyle = {
    padding: "11px 13px",
    borderRadius: 12,
    background: "var(--color-surface-strong)",
    border: "1px solid var(--color-line)",
  } as const;

  const stepTitle = step === 1 ? "Danışanı Tanımla" : step === 2 ? "Terapi Hedefini Belirle" : "Bağımsızlık Düzeyini İşaretle";

  /*
   * Kenar payı 16px + çentik/ana ekran çubuğu payı.
   *
   * Modal `.app-shell` dışında render edildiği için kabuğun `--chrome-*`
   * payları buraya ulaşmıyor; güvenli alanı kendisi hesaplamak zorunda.
   * Masaüstünde `env()` sıfır döner, dolayısıyla eski `p-4` ile birebir
   * aynı sonuç çıkar.
   */
  const inset = {
    paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
    paddingRight: "calc(16px + env(safe-area-inset-right, 0px))",
    paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
    paddingLeft: "calc(16px + env(safe-area-inset-left, 0px))",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={inset} role="dialog" aria-modal="true" aria-label="Yeni danışan">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 cursor-default border-none"
        style={{ background: "rgba(5,11,22,0.5)", backdropFilter: "blur(4px)" }}
      />

      {/*
       * Genişlik artık sınıfla veriliyor.
       *
       * Önceki hâl `width: 700` + `maxWidth: "100%"` idi ve kap
       * `grid place-items-center` olduğu için örtük sütun ögenin
       * max-content ölçüsüne (700px) genişliyordu: `100%` de 700px'e
       * çözülüyor, telefonda kutu ekranın 380px sağına taşıyordu. Alt
       * eylem çubuğundaki "Devam" düğmesi tamamen görünmez oluyor,
       * akış telefonda ilk adımda kilitleniyordu. Flex + `w-full`
       * yüzdeyi gerçek kap genişliğine bağlar.
       *
       * `vh` yerine `dvh`: iOS'ta adres çubuğu açıkken 90vh ekrandan taşar.
       */}
      <div
        className="relative flex flex-col w-full max-w-[700px] min-w-0 max-h-[90dvh]"
        style={{
          borderRadius: 26,
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-line-strong)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Başlık + adım göstergesi */}
        <div className="flex items-start justify-between gap-4 max-lg:gap-2 px-[26px] pt-6 max-lg:px-4 max-lg:pt-4">
          <div className="min-w-0">
            <Eyebrow>Adım {step} / 3</Eyebrow>
            {/* 18px başlık dar ekranda iki satıra kırılıp kapatma düğmesini
                aşağı itiyordu; telefonda 16px tek satırda kalıyor. */}
            <h2 className="font-display m-0 mt-1.5 text-[18px] max-lg:text-[16px] font-bold tracking-[-0.025em] text-(--color-text-strong)">
              {stepTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-text-strong) shrink-0"
            style={{ width: 34, height: 34, borderRadius: 11 }}
          >
            <X size={16} />
          </button>
        </div>

        {/*
         * Adım göstergesi.
         *
         * Üç rakam + üç etiket + iki bağlantı çizgisi 320px'de ~400px
         * tutuyordu: "3 Bağımsızlık" ekranın dışında kalıyor, terapist
         * kaçıncı adımda olduğunu göremiyordu. Telefonda yalnızca içinde
         * bulunulan adımın etiketi yazılır (hangi adımda olunduğu zaten
         * "Adım n / 3" satırında da var), bağlantı çizgileri kısalır.
         */}
        <div className="flex items-center gap-2 max-lg:gap-1.5 flex-wrap px-[26px] py-[18px] max-lg:px-4 max-lg:py-3.5">
          {[
            { n: 1, label: "Kimlik" },
            { n: 2, label: "Hedef" },
            { n: 3, label: "Bağımsızlık" },
          ].map((s, i) => {
            const done = step > s.n;
            const on = step === s.n;
            return (
              <span key={s.n} className="flex items-center gap-2 max-lg:gap-1.5">
                <span
                  className="numeral grid place-items-center text-[11px] font-bold shrink-0 w-7 h-7"
                  style={{
                    borderRadius: 10,
                    background: done || on ? "var(--gradient-signature)" : "var(--color-surface)",
                    color: done || on ? "#fff" : "var(--color-text-soft)",
                    border: done || on ? "none" : "1px solid var(--color-line)",
                  }}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : s.n}
                </span>
                <span
                  className={`text-[12px] ${on ? "font-semibold text-(--color-text-strong)" : "font-medium text-(--color-text-soft) max-lg:hidden"}`}
                >
                  {s.label}
                </span>
                {i < 2 && <span className="mx-1.5 max-lg:mx-1 h-px w-[26px] max-lg:w-2 shrink-0" style={{ background: "var(--color-line-strong)" }} />}
              </span>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-[26px] pb-1 max-lg:px-4">
          {/* ── Adım 1: Kimlik ── */}
          {step === 1 && (
            <div className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Ad Soyad</span>
                <input
                  autoFocus
                  value={d.displayName}
                  onChange={(e) => set("displayName", e.target.value)}
                  placeholder="ör. Poyraz Aydın"
                  className={field}
                  style={fieldStyle}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Doğum Tarihi</span>
                  <input type="date" value={d.birthDate} onChange={(e) => set("birthDate", e.target.value)} className={field} style={fieldStyle} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Yaş Grubu</span>
                  <select value={d.ageGroup} onChange={(e) => set("ageGroup", e.target.value)} className={field} style={fieldStyle}>
                    {AGE_BANDS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
              </div>

              <div>
                <span className="block text-[11.5px] font-semibold text-(--color-text-soft) mb-2">Uygulama Alanı</span>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => {
                    const on = d.area === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => set("area", a)}
                        aria-pressed={on}
                        className={`text-[12px] font-semibold cursor-pointer border transition-colors ${on ? "text-white border-transparent" : "text-(--color-text-body) hover:border-(--color-line-strong)"}`}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 10,
                          background: on ? "var(--gradient-signature)" : "var(--color-surface)",
                          borderColor: on ? "transparent" : "var(--color-line)",
                        }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Adım 2: Hedef ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Özet satırı — az önce girilen kimlik, düzeltmek için geri dönülebilsin */}
              <div
                className="flex items-center gap-3"
                style={{ padding: "12px 14px", borderRadius: 14, background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
              >
                <Avatar name={d.displayName || "?"} id={d.displayName} size={36} radius={12} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold text-(--color-text-strong) truncate">{d.displayName || "—"}</span>
                  <span className="block text-[11px] text-(--color-text-soft) truncate">
                    {[d.ageGroup + " yaş", d.birthDate ? new Date(d.birthDate).toLocaleDateString("tr-TR") : null, clinicName]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11.5px] font-semibold text-(--color-primary) bg-transparent border-none cursor-pointer hover:underline shrink-0"
                >
                  Düzenle
                </button>
              </div>

              <div>
                <span className="block text-[11.5px] font-semibold text-(--color-text-soft) mb-2">Birincil Hedef Alanı</span>
                <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
                  {GOALS.map((g) => {
                    const on = d.primaryGoal === g.title;
                    return (
                      <button
                        key={g.title}
                        type="button"
                        onClick={() => set("primaryGoal", g.title)}
                        aria-pressed={on}
                        className="flex items-start gap-2.5 text-left cursor-pointer transition-colors"
                        style={{
                          padding: "13px 14px",
                          borderRadius: 14,
                          background: on ? "var(--gradient-signature-soft)" : "var(--color-surface)",
                          border: `1px solid ${on ? "var(--color-line-strong)" : "var(--color-line)"}`,
                        }}
                      >
                        <span
                          className="grid place-items-center shrink-0 mt-0.5"
                          style={{
                            width: 17,
                            height: 17,
                            borderRadius: "50%",
                            background: on ? "var(--gradient-signature)" : "transparent",
                            border: on ? "none" : "1.5px solid var(--color-line-strong)",
                          }}
                        >
                          {on && <Check size={10} strokeWidth={3.5} color="#fff" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-bold text-(--color-text-strong)">{g.title}</span>
                          <span className="block text-[10.5px] text-(--color-text-soft) mt-0.5">{g.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Seans Sıklığı</span>
                  <select value={d.frequency} onChange={(e) => set("frequency", e.target.value)} className={field} style={fieldStyle}>
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Hedef Tarihi</span>
                  <input type="date" value={d.targetDate} onChange={(e) => set("targetDate", e.target.value)} className={field} style={fieldStyle} />
                </label>
              </div>

              {match && (
                <div
                  className="text-[12px] text-(--color-text-body)"
                  style={{ padding: "12px 14px", borderRadius: 13, background: "var(--gradient-signature-soft)", border: "1px solid var(--color-line-strong)" }}
                >
                  Öneri motoru bu profile <strong className="font-bold text-(--color-text-strong)">{match.games} oyun</strong> ve{" "}
                  <strong className="font-bold text-(--color-text-strong)">{match.activities} aktivite</strong> eşleştirdi.
                </div>
              )}
            </div>
          )}

          {/* ── Adım 3: Bağımsızlık ── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <span className="block text-[11.5px] font-semibold text-(--color-text-soft) mb-2.5">Bağımsızlık Düzeyi</span>
                <div className="flex flex-col gap-2">
                  {INDEPENDENCE_STEPS.map((label, i) => {
                    const n = i + 1;
                    const on = d.independence === n;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => set("independence", n)}
                        aria-pressed={on}
                        className="flex items-center gap-3 text-left cursor-pointer transition-colors"
                        style={{
                          padding: "11px 14px",
                          borderRadius: 12,
                          background: on ? "var(--gradient-signature-soft)" : "var(--color-surface)",
                          border: `1px solid ${on ? "var(--color-line-strong)" : "var(--color-line)"}`,
                        }}
                      >
                        <span
                          className="numeral grid place-items-center shrink-0 text-[11px] font-bold"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            background: on ? "var(--gradient-signature)" : "var(--color-surface-strong)",
                            color: on ? "#fff" : "var(--color-text-soft)",
                          }}
                        >
                          {n}
                        </span>
                        <span className={`text-[12.5px] ${on ? "font-bold text-(--color-text-strong)" : "font-medium text-(--color-text-body)"}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Başlangıç Zorluğu</span>
                <select value={d.difficultyLevel} onChange={(e) => set("difficultyLevel", e.target.value)} className={field} style={fieldStyle}>
                  {["Kolay", "Orta", "Zor"].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>

        {/* Alt eylem çubuğu */}
        <div className="flex items-center gap-2.5" style={{ padding: "18px 26px 24px" }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((x) => x - 1)}
              className="text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
              style={{ padding: "12px 18px", borderRadius: 12, background: "var(--color-surface)", border: "1px solid var(--color-line)" }}
            >
              Geri
            </button>
          )}
          <button
            type="button"
            disabled={!canNext}
            onClick={() => (step < 3 ? setStep((x) => x + 1) : onSubmit(d))}
            className="btn-signature ml-auto flex items-center gap-2 text-[12.5px] font-semibold cursor-pointer"
            style={{ padding: "12px 22px", borderRadius: 12 }}
          >
            {step === 3 ? <UserPlus size={15} /> : null}
            {step === 3 ? "Danışanı Oluştur" : "Devam"}
          </button>
        </div>
      </div>
    </div>
  );
}
