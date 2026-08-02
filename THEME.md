# Tema Token Sistemi — "Deniz" (v2)

Tüm renkler, degradeler ve dokular CSS custom property (token) üzerinden
tanımlanır. Bileşenlerde hardcode hex/rgba değeri kullanılmaz.

Kaynak: `src/app/globals.css`.

---

## Konsept

**Klinik ciddiyet, çocuk sıcaklığı.**

Mimio iki kullanıcıya bakar: seansı yöneten terapist ve ekrana bakan çocuk.
Deniz bu iki sesi tek palette birleştirir:

- **Terapist yüzeyleri** sakin ve veri odaklı kalır — cam kart, kılcal çizgi,
  hizalı sayı. Degrade taşımaz.
- **Oyun ve çocuk temaslı anlar** imza degradesiyle ısınır: mavi → cyan.

Her zemin üç katman: **aurora mesh → grain → cam yüzey**. Dark'ta aurora
doygun ve grain soluk; light'ta tersi.

> **Önceki sistemler.** v0 indigo (`#6366f1`) ortak DNA'yı takip ediyordu.
> v1 "Mavi Baskı" bej dosya kâğıdı + oker imza üzerineydi; degrade yoktu.
> Ölçüm tarafını iyi taşıyordu ama ürünün diğer yarısını hiç anmıyordu.
> Deniz, v1'in klinik disiplinini koruyup üstüne tek bir sıcak hamle koyar.

---

## Tema Mimarisi

| Özellik | Değer |
|---------|-------|
| Engine | Tailwind CSS v4 — `@theme` direktifi |
| Tema geçişi | `data-theme="light" \| "dark" \| "high-contrast"` (html attribute) |
| Depolama | `localStorage` → `mimio-theme` |
| Varsayılan | **Light** — terapist gündüz, aydınlık bir odada çalışır |
| Token tabanı | `@theme` bloğu **dark** değerlerini taşır; `html[data-theme='light']` override eder |
| Zemin rengi | `html` üzerinde (`body`de değil — doku katmanı gerekçesi aşağıda) |

---

## Renk Paleti

### Marka

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-primary` | `#4d7dff` | `#2b62f5` | CTA, link, vurgu, ikon |
| `--color-primary-hover` | `#6b93ff` | `#1b4bc4` | Hover state |
| `--color-primary-light` | `rgba(77,125,255,0.14)` | `rgba(43,98,245,0.09)` | Hafif tint zemin |
| `--color-primary-ink` | `#a8c2ff` | `#1b4bc4` | **Tint zemin üstünde metin** — küçük punto etiketler bunu kullanır, doygun ton 4.5:1'i tutmaz |

### İmza degradesi

Ürünün tek "sıcak" hamlesi. Kullanım yeri üçle sınırlıdır (aşağıya bak).

| Token | Dark | Light |
|-------|------|-------|
| `--color-signature-from` | `#4d7dff` | `#2b62f5` |
| `--color-signature-to` | `#2ad6ef` | `#17c2e0` |
| `--gradient-signature` | `linear-gradient(135deg, …)` | aynı |
| `--gradient-signature-soft` | `%18 → %10` opak tint | `%13 → %10` opak tint |
| `--gradient-bar` | `linear-gradient(90deg, …)` | aynı — ölçüm çubuğu soldan sağa dolduğu için yatay |

### Zemin / Yüzey

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-page-bg` | `#050b16` | `#eef3fa` | En dış zemin (`html` üzerinde) |
| `--color-surface` | `rgba(255,255,255,0.048)` | `rgba(255,255,255,0.78)` | Cam kart/panel |
| `--color-surface-strong` | `#0e1a2b` | `#ffffff` | Opak yüzey, modal |
| `--color-surface-elevated` | `rgba(255,255,255,0.075)` | `#ffffff` | Dropdown, elevated panel |

### Metin

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-text-strong` | `#eaf2ff` | `#0f2033` | Başlık, önemli metin |
| `--color-text-body` | `#b9cade` | `#3d5670` | Gövde metni |
| `--color-text-soft` | `#7b91ab` | `#6b83a0` | İkincil metin |
| `--color-text-muted` | `#65809c` | `#94a8bf` | Soluk metin, placeholder |
| `--color-text-disabled` | `#3a5372` | `#b7c6d8` | Disabled eleman |
| `--color-text-inverse` | `#050b16` | `#ffffff` | Ters zemin üstü metin |

### Çizgi / Kenarlık

Light'ta kenarlık nötr griden değil **paletten** türer — mavi kılcal çizgi.

| Token | Dark | Light |
|-------|------|-------|
| `--color-line` | `rgba(255,255,255,0.085)` | `rgba(43,98,245,0.12)` |
| `--color-line-soft` | `rgba(255,255,255,0.048)` | `rgba(43,98,245,0.07)` |
| `--color-line-strong` | `rgba(255,255,255,0.13)` | `rgba(43,98,245,0.20)` |
| `--color-line-focus` | `rgba(77,125,255,0.65)` | `rgba(43,98,245,0.70)` |

### Anlam renkleri

Birincil mavi olduğu için "olumlu" yeşile, "kritik" mercana kaydı; ikisi de
maviden yeterince uzak ve birbirinden ayırt edilebilir. Light değerleri açık
zeminde **metin olarak da** okunacak şekilde koyulaştırılmıştır.

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-accent-green` | `#19d19b` | `#0a7a58` | Gelişme, tamamlanan |
| `--color-accent-amber` | `#f5c26b` | `#a96708` | Dikkat, uyarı |
| `--color-accent-red` | `#f0708a` | `#b8304c` | Kritik, hata |
| `--color-accent-teal` | `#2ad6ef` | `#0b7f95` | Nötr veri |
| `--color-accent-violet` | `#9a80ff` | `#5636d6` | Duyusal, ikincil seri |

### Domain (terapi alanı) renkleri

Bir beceri alanı uygulamanın her yerinde aynı rengi taşır: oyun kartı, rapor
çubuğu ve plan rozeti aynı alanı gösteriyorsa aynı renktedir.

| Token | Dark | Light |
|-------|------|-------|
| `--color-domain-cognitive` (Bilişsel) | `#4d7dff` | `#1b4bc4` |
| `--color-domain-motor` (Motor) | `#19d19b` | `#0a7a58` |
| `--color-domain-visual` (Görsel / Duyusal) | `#9a80ff` | `#5636d6` |
| `--color-domain-memory` (Bellek / Dikkat) | `#f5c26b` | `#a96708` |
| `--color-domain-social` (Sosyal) | `#2ad6ef` | `#0b7f95` |

---

## Doku katmanları

```
canvas (html background)
  └── body::before   — aurora mesh, mim-drift 24s
        └── body::after  — grain, mix-blend-mode: overlay
              └── içerik (cam yüzeyler)
```

| Token | Dark | Light |
|-------|------|-------|
| `--aurora-dark` / `--aurora-light` | 3 radial gradient (mavi + cyan + mor) | daha soluk |
| `--grain` | inline SVG `feTurbulence` | aynı |
| `--grain-opacity` | `0.28` | `0.50` |

**Neden zemin rengi `html`de?** `z-index:-1` taşıyan bir pseudo-element kendi
elemanının arka planının *arkasına* düşer. Renk `body`de kalsaydı aurora hiç
görünmezdi. Bu yüzden `html { background }`, `body { background: transparent }`.

**Neden `position: fixed`?** Sayfa kaydıkça doku sabit kalır, zemin "malzeme"
gibi okunur. Önceki çözüm `background-attachment: fixed` idi; iOS'ta bozuluyor
ve her tema için gradient'i yeniden yazmayı gerektiriyordu.

Mobilde (`hover:none` + `pointer:coarse`) ve `prefers-reduced-motion` altında
aurora sürüklenmesi kapalıdır; doku durur, hareket gider.

---

## Tipografi

Üç aile, üç rol. Tanımlar `src/app/layout.tsx`, kullanım `globals.css`.

| Rol | Aile | Ağırlık | Nerede |
|-----|------|---------|--------|
| Ekran başlığı | **Schibsted Grotesk** | 600 (h1) / 700 (h2, `.figure`) | Sayfanın adını söyleyen tek satır; büyük sayı |
| Arayüz + gövde | **Plus Jakarta Sans** | 400 gövde, 600–700 etiket | h3, h4 ve geri kalan her şey |
| Sayısal okuma | **IBM Plex Mono** | 400–600 | Skor, süre, persentil, span (`.numeral`) |

`h1`/`h2` ağırlığı `globals.css`te **sabitlenir** ve katmansız yazıldığı için
bileşenlerdeki `font-bold` / `font-extrabold` yardımcılarını bastırır.

Aile seçimi tasarım dokümanından değil, ekosistem tipografi etüdünden geliyor
(`~/dev-starter/knowledge/themes/mimio.md` § 3): doküman Space Grotesk
kullanıyordu, Schibsted Grotesk'in haber-editoryal kökeni klinik tona daha
yakın duruyor ve diğer projelerle ortak bir zemin kuruyor.

**Metin düzeni:** başlık, alt başlık, düğme ve sekme etiketleri Title Case
(`Yeni Danışan`); gövde cümleleri ve mono mikro etiketler cümle düzeninde
kalır (`bağımsızlık 4/5`). Gerekçe ve Türkçe tuzakları: global CLAUDE.md.

| Sınıf | Ne yapar |
|-------|---------|
| `.font-display` | Schibsted Grotesk'e geçer (ağırlık dayatmaz) |
| `.figure` | Büyük "manşet" sayı — display ailesi, 700, `-0.035em`, tabular |
| `.numeral` | Hizalı ölçüm değeri — mono, tabular, `zero` özelliği açık |

---

## Bileşen dili

İmza degradesi **yalnızca üç yerde** görünebilir. Bu ayrım korunmazsa ekran
"pazarlama sayfası" tonuna kayar ve seans sırasında okunurluk düşer.

| Sınıf | Nerede |
|-------|--------|
| `.btn-signature` | Sayfadaki birincil eylem — **sayfa başına bir tane** |
| `.nav-active` | Seçili gezinme satırı (dolu degrade değil, `-soft` tint + kenarlık) |
| `.tile-signature` | Marka işareti, avatar, oyun kartı kapağı |

Yardımcılar: `.tile-signature-grain` (degradenin üstüne %30 doku),
`.on-signature` / `.on-signature-soft` (degrade üstü metin — her zaman beyaz
ailesi, asla token değil).

Veri yüzeyleri (kart, tablo, grafik) degrade taşımaz; cam + kılcal çizgiyle
ayrışır: `.glass`, `.glass-strong`.

---

## Shadow Scale

| Token | Dark | Light |
|-------|------|-------|
| `--shadow-sm` / `--shadow-card` | `0 1px 3px rgba(0,0,0,0.4)…` | `0 8px 22px rgba(15,32,51,0.06)` |
| `--shadow-md` | `0 8px 22px rgba(0,0,0,0.42)…` | `0 10px 30px rgba(15,32,51,0.07)` |
| `--shadow-lg` / `--shadow-elevated` | `0 18px 44px rgba(0,0,0,0.5)…` | `0 18px 50px rgba(15,32,51,0.12)` |
| `--shadow-glow` | `0 10px 26px rgba(77,125,255,0.4)` | `0 10px 24px rgba(43,98,245,0.3)` |
| `--shadow-primary` | `0 10px 24px rgba(77,125,255,0.36)` | `0 10px 24px rgba(43,98,245,0.3)` |

---

## Radius Scale

Deniz v1'den daha yumuşak: kartlar 16–18px, kontroller 10–12px.

| Token | Değer | Kullanım |
|-------|-------|---------|
| `--radius-sm` | `0.5rem` | Badge, rozet |
| `--radius-md` | `0.6875rem` | Input, küçük kontrol |
| `--radius-lg` | `0.875rem` | Button |
| `--radius-xl` | `1rem` | Card |
| `--radius-2xl` | `1.125rem` | Panel, modal |

---

## Yüksek kontrast teması

`html[data-theme='high-contrast']` sarı birincil (`#ffff00`) üzerine kuruludur.
Degrade ve doku burada **kapalıdır** (`--gradient-signature: none`,
`--grain-opacity: 0`) — ikisi de kenar bulanıklaştırır.

---

## Nasıl Kullanılır

### ✅ Doğru
```tsx
<div className="glass rounded-2xl p-5">
<div className="text-(--color-text-strong) border border-(--color-line)">
<button className="btn-signature px-4 py-2 rounded-xl">Seansı başlat</button>
<strong className="figure text-3xl">84</strong>
<span className="numeral text-xs">4:12</span>
```

### ❌ Yanlış
```tsx
<div className="bg-white text-gray-900 border border-gray-200">   // hardcode
<div style={{ background: "linear-gradient(135deg,#2b62f5,#17c2e0)" }}>  // --gradient-signature kullan
<button className="btn-signature">…</button> x3                    // sayfa başına bir birincil eylem
<h1 className="font-extrabold">                                    // h1 ağırlığı zaten sabit
<div className="dark:bg-gray-900">                                 // class tabanlı dark mode
```

---

## Game Canvas Notu

`MimioApp.tsx` içindeki oyun canvas alanları (`memory`, `pairs`, `pulse`,
`route`, `difference`) tema değişiminden bağımsız olarak koyu zemin taşır.
Bu bilinçli bir karar: oyunun görsel tutarlılığı terapistin tema tercihine
bağlı olmamalı. `text-white`, `border-white/10` bu bloklarda kasıtlıdır.
