"use client";

/*
 * Giriş / Kayıt — tasarım dokümanı 1x/1y.
 *
 * Bölünmüş düzen: solda 560px marka paneli, sağda form.
 *
 * Sol panel dekorasyon değil, cevap: giriş ekranını gören kişi ya ürünü
 * ilk kez deniyor ya da uzun süredir uğramamış. İkisi de "bu ne yapıyor?"
 * sorusunu taşıyor; üç sayı (oyun, aktivite, protokol) bunu bir cümleden
 * hızlı cevaplıyor. Sistem durumu satırı ise klinik bir araçta güven
 * meselesi — veri nerede duruyor sorusunun ilk yanıtı.
 */

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { BlockMark } from "@/components/brand/BlockMark";

export type AuthMode = "login" | "register";

interface Props {
  readonly mode: AuthMode;
  readonly onModeChange: (m: AuthMode) => void;
  readonly error: string;
  readonly busy: boolean;
  readonly greeting: string;
  readonly subline: string;
  readonly stats: readonly { value: string; label: string }[];
  readonly dbOnline: boolean;
  readonly onLogin: (username: string, password: string, remember: boolean) => void;
  readonly onRegister: (v: { username: string; password: string; displayName: string; clinicName: string }) => void;
  readonly onDemo: () => void;
  readonly onHome: () => void;
}

export function AuthScreen({
  mode, onModeChange, error, busy, greeting, subline, stats, dbOnline,
  onLogin, onRegister, onDemo, onHome,
}: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [remember, setRemember] = useState(true);
  const [reveal, setReveal] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLocaleLowerCase("tr-TR");
    if (mode === "login") onLogin(u, password, remember);
    else onRegister({ username: u, password, displayName: displayName.trim(), clinicName: clinicName.trim() });
  };

  const field =
    "w-full text-[13px] text-(--color-text-strong) outline-none placeholder:text-(--color-text-muted) transition-colors focus:border-(--color-primary)";
  const fieldStyle = {
    padding: "13px 14px",
    borderRadius: 13,
    background: "var(--color-surface-strong)",
    border: "1px solid var(--color-line)",
  } as const;

  return (
    <div className="min-h-dvh flex">
      {/* ── Sol: marka paneli ── */}
      <div
        className="hidden lg:flex flex-col shrink-0 relative overflow-hidden"
        style={{ width: 560, padding: "48px 52px", borderRight: "1px solid var(--color-line)" }}
      >
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-3 bg-transparent border-none cursor-pointer p-0 self-start"
        >
          <span className="tile-signature grid place-items-center shrink-0" style={{ width: 34, height: 34, borderRadius: 11 }}>
            <BlockMark size={18} color="#ffffff" />
          </span>
          <span className="text-left">
            <span className="font-display block text-[15px] font-bold tracking-[-0.02em] text-(--color-text-strong) leading-tight">Mimio</span>
            <span className="numeral block text-[9.5px] text-(--color-text-soft) leading-tight">Ölçüm temelli ergoterapi</span>
          </span>
        </button>

        {/* Tanıtım manşeti destekleyici içerik; sayfanın h1'i formda. */}
        <h2 className="m-0 mt-auto mb-4 text-[clamp(1.75rem,2.9vw,2.25rem)] leading-[1.08] text-(--color-text-strong)">
          Terapi seanslarını<br />
          <span style={{ color: "var(--color-primary)" }}>oyuna dönüştür.</span>
        </h2>
        <p className="m-0 mb-9 text-[13.5px] leading-[1.65] text-(--color-text-body)" style={{ maxWidth: 420 }}>
          Danışan takibi, haftalık plan, kanıta dayalı oyunlar ve yazdırılabilir raporlar — tek platformda.
        </p>

        <div className="flex gap-8 mb-auto">
          {stats.map((s) => (
            <span key={s.label}>
              <span className="figure block text-[26px] text-(--color-text-strong) leading-none">{s.value}</span>
              <span className="numeral block text-[10px] text-(--color-text-soft) mt-1.5">{s.label}</span>
            </span>
          ))}
        </div>

        {/* Sistem durumu — klinik araçta veri nerede sorusunun ilk yanıtı */}
        <span className="flex items-center gap-2.5 mt-9">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: dbOnline ? "var(--color-accent-green)" : "var(--color-accent-amber)",
            }}
          />
          <span className="numeral text-[10.5px] text-(--color-text-soft)">
            {dbOnline ? "Tüm sistemler çalışıyor · TLS şifreli" : "Yerel mod · veriler bu tarayıcıda"}
          </span>
        </span>
      </div>

      {/*
        ── Sağ: form ──
        Telefonda dikey ortalama yerine üstten hizalama: klavye açılınca
        görünür alan yarıya iniyor, ortalanmış blok yukarı kayıp başlığı
        ekranın dışına atıyordu. Üstten hizalı blokta klavye yalnızca alt
        kısmı örtüyor, tarayıcı odaklı alanı kendi kaydırmasıyla getiriyor.
        Kenar boşluğu 24px'ten 20px'e iniyor (320px'te form 272 → 280px)
        ve güvenli alan payı ekleniyor — yatay çevrilen çentikli telefonda
        form kenarın altına giriyordu.
      */}
      <div className="flex-1 flex items-start lg:items-center justify-center min-w-0 pt-[max(26px,env(safe-area-inset-top))] pb-[max(30px,env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] lg:pt-10 lg:pb-10 lg:pl-6 lg:pr-6">
        <div className="w-full" style={{ maxWidth: 380 }}>
          {/*
            Marka satırı yalnızca telefonda. Sol tanıtım sütunu `hidden
            lg:flex` olduğu için mobilde ekranda ne marka ne de tanıtım
            sayfasına dönüş kalıyordu; form kimliksiz bir kutu olarak
            boşlukta duruyordu. `p-0` yok, böylece dokunmatikte ortak
            44px kuralı satırı vurulabilir yapıyor.
          */}
          <button
            type="button"
            onClick={onHome}
            /* Marka kilidi aynı zamanda "ana sayfaya dön" düğmesi; 30px'lik
               döşemeyle birlikte satır 31px kalıyor ve parmakla vurulamıyordu.
               Dikey pay hedefi 44px'e taşır, negatif yatay pay hizayı korur. */
            className="lg:hidden flex items-center gap-2.5 self-start bg-transparent border-none cursor-pointer mb-5 -mx-2 px-2 py-1.5 rounded-xl"
          >
            <span className="tile-signature grid place-items-center shrink-0" style={{ width: 30, height: 30, borderRadius: 10 }}>
              <BlockMark size={16} color="#ffffff" />
            </span>
            <span className="text-left">
              <span className="font-display block text-[14px] font-bold tracking-[-0.02em] text-(--color-text-strong) leading-tight">Mimio</span>
              <span className="numeral block text-[9.5px] text-(--color-text-soft) leading-tight">Ölçüm temelli ergoterapi</span>
            </span>
          </button>

          {/* Sekmeler */}
          <div
            className="flex p-[3px] rounded-xl mb-5 lg:mb-7"
            style={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
            role="tablist"
            /* Sekmenin adı ("Giriş Yap") formun gönder düğmesiyle birebir
               aynıydı; ekran okuyucu iki farklı kontrolü ayıramıyordu.
               Grubun adı sekmeyi kendi bağlamına yerleştirir. */
            aria-label="Giriş yap veya kayıt ol"
          >
            {(["login", "register"] as const).map((m) => {
              const on = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => onModeChange(m)}
                  className={`flex-1 text-[12.5px] font-semibold cursor-pointer border-none transition-colors ${on ? "text-white" : "text-(--color-text-soft) bg-transparent hover:text-(--color-text-body)"}`}
                  style={{ padding: "9px 0", borderRadius: 9, background: on ? "var(--gradient-signature)" : undefined }}
                >
                  {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
                </button>
              );
            })}
          </div>

          {/* Sayfanın h1'i bu: ekranın işi "giriş yap / kayıt ol". Soldaki
              tanıtım sütunu `hidden lg:flex` olduğu için telefonda hiç
              basılmıyor ve sayfa h1'siz kalıyordu — ekran okuyucu başlık
              listesinde ekranın ne olduğunu söyleyen bir satır yoktu. */}
          <h1 className="font-display m-0 mb-1.5 text-[21px] font-bold tracking-[-0.03em] text-(--color-text-strong)">
            {mode === "login" ? greeting : "Hesabını oluştur."}
          </h1>
          <p className="m-0 mb-6 text-[12.5px] text-(--color-text-soft)">
            {mode === "login" ? subline : "Bir dakikada başla; danışanları sonra ekleyebilirsin."}
          </p>

          {error && (
            <div
              role="alert"
              className="text-[12.5px] mb-4"
              style={{
                padding: "11px 13px",
                borderRadius: 12,
                background: "color-mix(in srgb, var(--color-accent-red) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-accent-red) 26%, transparent)",
                color: "var(--color-accent-red)",
              }}
            >
              {error}
            </div>
          )}

          {/* Kayıt formunda dört alan var; telefonda 12px'lik aralık alanları
              tek bir gri bloğa dönüştürüyordu. Mobilde 16px, masaüstünde
              eski ritim. */}
          <form className="flex flex-col gap-4 lg:gap-3" onSubmit={submit}>
            {mode === "register" && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Ad Soyad</span>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={field} style={fieldStyle} required autoComplete="name" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Klinik</span>
                  <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Bağımsız çalışıyorsan boş bırak" className={field} style={fieldStyle} autoComplete="organization" />
                </label>
              </>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Kullanıcı Adı</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLocaleLowerCase("tr-TR"))}
                className={`${field} numeral`}
                style={fieldStyle}
                required
                autoComplete="username"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-semibold text-(--color-text-soft)">Şifre</span>
              <span className="relative flex items-center">
                <input
                  type={reveal ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={field}
                  style={{ ...fieldStyle, paddingRight: 44 }}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                {/* Göz düğmesi masaüstünde ikon boyu kadardı (17px); parmakla
                    vurulamıyordu. Telefonda 44×44 ve alanın sağ kenarına
                    yaslı — kutu tam olarak inputun 44px'lik sağ boşluğunu
                    kaplıyor, yazının üstüne binmiyor. Masaüstü ölçüsü `lg:`
                    ile aynen geri alınıyor. */}
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-0 h-11 w-11 lg:right-3 lg:h-auto lg:w-auto grid place-items-center cursor-pointer border-none bg-transparent text-(--color-text-soft) hover:text-(--color-text-body)"
                >
                  {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {mode === "login" && (
              <div className="flex items-center justify-between mt-0.5">
                {/* `p-0` ortak 44px kuralının dışında bıraktığı için bu onay
                    kutusunun vurulabilir kutusu 88×18'di. Telefonda satır
                    yüksekliğini elle 44'e çekiyor, kareyi de 17 → 20px
                    büyütüyoruz; masaüstünde ikisi de eski ölçüsünde. */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember((r) => !r)}
                  className="flex items-center gap-2 min-h-11 lg:min-h-0 text-[11.5px] font-medium text-(--color-text-body) cursor-pointer bg-transparent border-none p-0"
                >
                  <span
                    className="grid place-items-center shrink-0 w-5 h-5 lg:w-[17px] lg:h-[17px]"
                    style={{
                      borderRadius: 5,
                      background: remember ? "var(--gradient-signature)" : "transparent",
                      border: remember ? "none" : "1px solid var(--color-line-strong)",
                    }}
                  >
                    {remember && <Check size={11} strokeWidth={3.5} color="#fff" />}
                  </span>
                  Beni Hatırla
                </button>
                {/* "Şifremi unuttum" burada tıklanamaz bir süs olarak duruyordu;
                    sıfırlama altyapısı yok. Seed'in şifre komutuna işaret eden
                    dürüst bir ipucu bırakıyoruz. */}
                <span
                  className="text-[11.5px] text-(--color-text-muted) cursor-help"
                  title="Şifre sıfırlama e-postası henüz yok. Demo kurulumunda: node scripts/seed-demo.mjs --set-password"
                >
                  Şifremi unuttum
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-signature w-full text-[13px] font-semibold cursor-pointer mt-2"
              style={{ padding: 14, borderRadius: 13 }}
            >
              {busy ? "…" : mode === "login" ? "Giriş Yap" : "Hesabı Oluştur"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1" style={{ height: 1, background: "var(--color-line)" }} />
            <span className="numeral text-[10px] text-(--color-text-muted)">veya</span>
            <span className="flex-1" style={{ height: 1, background: "var(--color-line)" }} />
          </div>

          <button
            type="button"
            onClick={onDemo}
            className="w-full text-[12.5px] font-semibold cursor-pointer transition-colors text-(--color-text-body) hover:text-(--color-primary)"
            style={{ padding: 13, borderRadius: 13, background: "var(--color-surface-strong)", border: "1px solid var(--color-line)" }}
          >
            Demo Hesapla Keşfet
          </button>

          <p className="m-0 mt-5 text-[10.5px] leading-[1.55] text-(--color-text-muted) text-center">
            Devam ederek <span className="text-(--color-text-soft)">Kullanım Koşulları</span> ve{" "}
            <span className="text-(--color-text-soft)">Gizlilik Politikası</span>'nı kabul etmiş olursun.
          </p>

          {/* Sistem durumu yalnızca sol panelde duruyordu, o da mobilde
              gizli — "verim nerede duruyor" sorusu telefonda da soruluyor.
              Tek satırlık karşılığını forma ekliyoruz. */}
          <span className="lg:hidden flex items-center justify-center gap-2 mt-4">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: dbOnline ? "var(--color-accent-green)" : "var(--color-accent-amber)",
              }}
            />
            <span className="numeral text-[10px] text-(--color-text-soft)">
              {dbOnline ? "Tüm sistemler çalışıyor · TLS şifreli" : "Yerel mod · veriler bu tarayıcıda"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
