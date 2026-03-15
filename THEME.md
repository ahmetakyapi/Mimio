# Tema Token Sistemi

Bu proje `ahmetakyapi.com` ile ortak bir görsel dili paylaşır.
Tüm renkler ve efektler CSS custom property (token) üzerinden tanımlanır.
Bileşenlerde asla hardcode hex/rgba değeri kullanılmaz.

---

## Tema Mimarisi

| Özellik | Değer |
|---------|-------|
| Engine | Tailwind CSS v4 — `@theme` direktifi |
| Tema geçişi | `data-theme="dark"` / `data-theme="light"` (html attribute) |
| Depolama | `localStorage` → `mimio-theme` key |
| Varsayılan | Dark |
| Geçiş animasyonu | `transition: color 0.3s ease, background-color 0.3s ease` |
| Tailwind dark mode | `data-theme` attribute üzerinden CSS variable override |

---

## Renk Paleti

### Brand

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-primary` | `#6366f1` | `#6366f1` | CTA, link, vurgu, icon |
| `--color-primary-hover` | `#4f46e5` | `#4f46e5` | Hover state |
| `--color-primary-light` | `rgba(99,102,241,0.12)` | `rgba(99,102,241,0.08)` | Hafif tint arka plan |

### Background / Surface

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-page-bg` | `#04070d` | `#eef2ff` | En dış zemin |
| `--color-surface` | `rgba(255,255,255,0.035)` | `rgba(255,255,255,0.65)` | Kart/panel yüzeyi |
| `--color-surface-strong` | `rgba(10,16,28,0.88)` | `rgba(255,255,255,0.92)` | Güçlü yüzey, modal |
| `--color-surface-elevated` | `rgba(255,255,255,0.055)` | `rgba(255,255,255,0.85)` | Dropdown, elevated panel |

### Text

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-text-strong` | `#f1f5f9` | `#1e293b` | Başlık, önemli metin |
| `--color-text-body` | `#cbd5e1` | `#334155` | Gövde metni |
| `--color-text-soft` | `#94a3b8` | `#64748b` | İkincil metin |
| `--color-text-muted` | `#64748b` | `#94a3b8` | Soluk metin, placeholder |
| `--color-text-disabled` | `#334155` | `#cbd5e1` | Disabled eleman |
| `--color-text-inverse` | `#0f172a` | `#f1f5f9` | Ters zemin üstü metin |

### Border / Line

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-line` | `rgba(255,255,255,0.07)` | `rgba(99,102,241,0.10)` | Standart border |
| `--color-line-soft` | `rgba(255,255,255,0.04)` | `rgba(99,102,241,0.05)` | Hafif ayırıcı |
| `--color-line-strong` | `rgba(255,255,255,0.12)` | `rgba(99,102,241,0.25)` | Güçlü border |
| `--color-line-focus` | `rgba(99,102,241,0.60)` | `rgba(99,102,241,0.50)` | Focus ring |

### Chrome / Overlay

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-sidebar` | `rgba(4,8,16,0.92)` | `rgba(237,241,255,0.94)` | Sidebar arka plan |
| `--color-chrome-nav` | `rgba(4,7,13,0.92)` | `rgba(238,242,255,0.93)` | Sticky navbar |
| `--color-chrome-header` | `rgba(4,7,13,0.88)` | `rgba(238,242,255,0.88)` | Sticky header |
| `--color-chrome-section` | `rgba(4,7,13,0.72)` | `rgba(238,242,255,0.78)` | Section overlay |

### Accent Renkler (tema bağımsız)

| Token | Değer | Kullanım |
|-------|-------|---------|
| `--color-accent-green` | `#10b981` | Başarı, tamamlanan |
| `--color-accent-amber` | `#f59e0b` | Uyarı, dikkat |
| `--color-accent-red` | `#ef4444` | Hata, tehlike |
| `--color-accent-teal` | `#06b6d4` | Bilgi, vurgu |

---

## Shadow Scale

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--shadow-sm` / `--shadow-card` | `0 1px 3px rgba(0,0,0,0.35)…` | `0 1px 3px rgba(99,102,241,0.08)…` | Kart, küçük eleman |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.40)…` | `0 4px 16px rgba(99,102,241,0.10)…` | Orta elevated |
| `--shadow-lg` / `--shadow-elevated` | `0 8px 32px rgba(0,0,0,0.50)…` | `0 8px 32px rgba(99,102,241,0.12)…` | Modal, panel |
| `--shadow-glow` / `--shadow-primary` | `0 8px 24px rgba(99,102,241,0.40)…` | `0 8px 24px rgba(99,102,241,0.25)…` | Primary CTA, glow |

---

## Skeleton / Placeholder

| Token | Dark | Light | Kullanım |
|-------|------|-------|---------|
| `--color-skeleton-hi` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.07)` | Belirgin skeleton bar |
| `--color-skeleton-lo` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.04)` | Soluk skeleton bar |

---

## Games Showcase Section (LandingPage)

Games section kendi token setine sahiptir; light modda açık zemine uyum sağlar.

| Token | Dark | Light |
|-------|------|-------|
| `--color-games-section` | `rgba(4,7,13,0.9)` | `#f0f4ff` |
| `--color-games-text` | `#ffffff` | `#1e293b` |
| `--color-games-text-soft` | `#94a3b8` | `#64748b` |
| `--color-games-card-bg` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.80)` |
| `--color-games-card-border` | `rgba(255,255,255,0.08)` | `rgba(99,102,241,0.15)` |
| `--color-games-card-hover` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.95)` |
| `--color-games-tile-from` | `rgba(10,16,30,0.9)` | `rgba(238,242,255,0.95)` |
| `--color-games-tile-to` | `rgba(4,7,13,0.95)` | `rgba(224,231,255,0.90)` |
| `--color-games-badge-bg` | `rgba(255,255,255,0.10)` | `rgba(99,102,241,0.10)` |
| `--color-games-badge-border` | `rgba(255,255,255,0.20)` | `rgba(99,102,241,0.25)` |

---

## Radius Scale

| Token | Değer | Kullanım |
|-------|-------|---------|
| `--radius-sm` | `0.5rem` | Badge, input |
| `--radius-md` | `0.75rem` | Button, small card |
| `--radius-lg` | `1rem` | Card |
| `--radius-xl` | `1.25rem` | Panel |
| `--radius-2xl` | `1.5rem` | Modal, large card |

---

## Reusable CSS Classes

```css
/* Glass morphism yüzey */
.glass { ... }           /* backdrop-blur + surface-elevated + border + shadow-card */
.glass-strong { ... }    /* backdrop-blur(22px) + surface-strong + border + shadow-elevated */

/* Games section arka planı (her iki temada uyumlu) */
.section-games { ... }

/* Oyun kartı preview görseli (LandingPage) */
.game-tile-preview { ... }

/* Oyun canvas tile state'leri (her zaman dark background) */
.game-tile-active
.game-tile-matched
.game-tile-reveal
.game-tile-cursor
```

---

## Nasıl Kullanılır

### ✅ Doğru
```tsx
<div className="bg-(--color-surface) text-(--color-text-strong) border border-(--color-line)">
<div className="shadow-(--shadow-card)">
<div className="bg-(--color-primary) text-white">
<div className="bg-(--color-skeleton-hi)">
```

### ❌ Yanlış
```tsx
<div className="bg-white text-gray-900 border border-gray-200">     // hardcode
<div style={{ background: "rgba(255,255,255,0.04)" }}>              // hardcode
<div className="bg-white/8">                                         // tema bağımsız
<div className="dark:bg-gray-900">                                   // class tabanlı dark mode
```

---

## Game Canvas Notu

`MimioApp.tsx` içindeki oyun canvas alanları (`memory`, `pairs`, `pulse`, `route`, `difference`) her zaman koyu arka plana sahiptir — `background: rgba(8,14,28,0.97)`. Bu intentional tasarım kararıdır: oyunların görsel tutarlılığı tema değişiminden bağımsızdır.

`text-white`, `border-white/10` gibi değerler bu canvas bloklarında bilinçli kullanılmaktadır.

---

## ahmetakyapi.com ↔ Mimio Eşleştirme

| ahmetakyapi.com | Mimio | Not |
|----------------|-------|-----|
| `--bg-dark: #04070d` | `--color-page-bg: #04070d` | Aynı |
| `--bg-light: #f3f1eb` | `--color-page-bg: #eef2ff` | Mimio daha indigo-tinted |
| Indigo-500 `#6366f1` | `--color-primary: #6366f1` | Aynı |
| `.glass` | `.glass` | Aynı konsept, CSS variable ile |
| `dark:text-slate-400` | `text-(--color-text-soft)` | Token'a taşındı |
| `dark:border-white/[0.06]` | `border-(--color-line)` | Token'a taşındı |
| `next-themes` | Custom `ThemeProvider` | `data-theme` attribute |
