<div align="center">

<img src="https://img.shields.io/badge/Mimio-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzYzNjZmMSIvPjx0ZXh0IHg9IjE2IiB5PSIyMiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI4MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIj5NPC90ZXh0Pjwvc3ZnPg==&logoColor=white" alt="Mimio" />

# Mimio

**Ergoterapistler için interaktif terapi oyun platformu**

Danışan takibi · İnteraktif oyun seansları · Haftalık plan · Seans notları · İlerleme analizi

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![Neon](https://img.shields.io/badge/Neon_Postgres-00E699?style=flat-square&logo=postgresql&logoColor=black)](https://neon.tech)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Nedir?

Mimio, çocuklar ve yetişkinlerle çalışan ergoterapistlerin klinik süreçlerini dijitalleştirmelerine yardımcı olan bir web platformudur. Danışan profilleri oluşturabilir, seanslarda kanıta dayalı interaktif oyunlar oynayabilir, haftalık terapi programları planlayabilir ve ilerlemeyi grafik üzerinden takip edebilirsiniz.

Tüm oyunlar **AOTA Uygulama Çerçevesi (4. Baskı)** ve **WHO ICF** referans alınarak, bilimsel literatürde desteklenmiş bilişsel ve motor beceri paradigmalarına göre tasarlanmıştır.

---

## Özellikler

| Alan | Açıklama |
|---|---|
| **Danışan Yönetimi** | Profil oluşturma, yaş grubu, birincil hedef ve bağımsızlık düzeyi takibi |
| **İnteraktif Oyunlar** | 6 farklı oyun — her biri belirli bir bilişsel veya motor alanı hedefler |
| **Haftalık Plan** | Danışan bazında kişisel terapi programı, günlük aktivite ataması |
| **Seans Notları** | Oyun sonrası veya bağımsız seans gözlemi kayıt sistemi |
| **İlerleme Analizi** | Oyun skorları ve seans verileri üzerinden danışan gelişimi |
| **Terapi Domainleri** | 7 uzmanlık alanı, kanıt temelli aktivite önerileri |
| **Bağımsızlık Ölçeği** | 5 kademe: Tam Bağımlı → Fiziksel Yardım → Sözel İpucu → Gözetim → Bağımsız |
| **Karanlık / Açık Tema** | `data-theme` tabanlı sistem, sistem tercihi ile uyumlu |
| **Güvenli Giriş** | Username + password, bcrypt hash, localStorage oturum kalıcılığı |

---

## Terapi Oyunları

Mimio'daki her oyun, ergoterapi literatüründe doğrulanmış bir bilişsel ya da motor paradigmaya dayanmaktadır.

| Oyun | Alan | Paradigma | Zorluk |
|---|---|---|---|
| **Sıra Hafızası** | Hafıza | Corsi Blok Testi — çalışma belleği ve sıralama | Kolay → Zor |
| **Kart Eşle** | Görsel-Uzamsal Bellek | Görsel eşleştirme, sistematik arama stratejisi | Kolay → Orta |
| **Mavi Nabız** | Motor Beceri | Fitts Yasası — hedefleme doğruluğu ve zamanlama | Orta → Zor |
| **Komut Rotası** | Yürütücü İşlev | Yön komutu işleme, motor yanıt seçimi, inhibisyon | Orta → Zor |
| **Fark Avcısı** | Görsel Algı | Figür-zemin ayrımı, hemineglect rehabilitasyonu | Kolay → Orta |
| **Hedef Tarama** | Seçici Dikkat | Visual Search paradigması, dikkat dağıtıcılar arası hedef seçimi | Orta → Zor |

---

## Terapi Alanları

Platform **7 uzmanlık alanı** için kanıta dayalı aktivite önerileri ve oyun eşleştirmeleri içerir:

| Alan | Hedef Grup |
|---|---|
| **Pediatrik Ergoterapi** | Motor gelişim, duyusal işleme, oyun katılımı |
| **Ruh Sağlığı Ergoterapisi** | Bilişsel rehabilitasyon, günlük yaşam becerileri |
| **Nörolojik Rehabilitasyon** | İnme, TBI, MS sonrası işlevsel toparlanma |
| **Nöroçeşitlilik ve Otizm** | DEHB, ASD — dikkat, yürütücü işlev, sosyal katılım |
| **Geriatrik Ergoterapi** | Yaşlanmayla ilişkili bilişsel düşüş, denge, bağımsızlık |
| **İş & Okul Katılımı** | Mesleki performans, okul ortamına uyum |
| **Toplum ve Sosyal Katılım** | Sosyal beceriler, toplum entegrasyonu |

---

## Teknoloji Yığını

```
Next.js 15 (App Router)      — Framework
TypeScript 5.8 strict         — Dil
Tailwind CSS v4 (@theme {})  — Stil — tailwind.config.ts yok, globals.css içinde
Framer Motion 11             — Animasyon
@neondatabase/serverless      — Neon Postgres HTTP bağlantısı (Vercel uyumlu)
lucide-react                 — İkonlar
clsx + tailwind-merge        — cn() utility
Playwright                   — UI smoke testleri
```

> **Neden `@neondatabase/serverless`?** Vercel'in serverless ortamında standart `pg` paketi TCP bağlantı havuzu açamaz. Neon'un HTTP sürücüsü soğuk başlatmalarda timeout vermez.

---

## Proje Yapısı

```
mimio/
├── src/
│   ├── app/
│   │   ├── layout.tsx              Root layout — font, metadata, ThemeProvider
│   │   ├── page.tsx                Entry point — ClientRoot
│   │   ├── globals.css             Tailwind v4 @theme{} + dark/light token'lar
│   │   ├── icon.tsx                Favicon — Next.js ImageResponse (M logosu, 32px)
│   │   ├── apple-icon.tsx          Apple touch icon — 180px
│   │   ├── sitemap.ts              Otomatik sitemap.xml
│   │   ├── robots.ts               robots.txt
│   │   └── api/
│   │       ├── og/route.tsx        Dinamik OG image — edge runtime
│   │       └── platform/
│   │           ├── overview/       GET — platform istatistikleri
│   │           ├── profiles/       GET/POST — terapist & danışan profilleri
│   │           └── sessions/       GET/POST — seans kayıt ve sorgulama
│   ├── components/
│   │   ├── ClientRoot.tsx          Landing ↔ App geçiş mantığı
│   │   ├── LandingPage.tsx         Tanıtım sayfası — Hero, Özellikler, Oyunlar, CTA
│   │   ├── MimioApp.tsx            Ana uygulama — dashboard, oyunlar, plan, notlar
│   │   └── ThemeProvider.tsx       data-theme context, localStorage persist
│   └── lib/
│       ├── platform-data.ts        Tip tanımları, GAME_LABELS sabitleri
│       ├── therapy-program-data.ts AOTA/ICF kanıt temelli aktivite & oyun eşleştirmeleri
│       └── server/
│           └── platform-db.ts      Neon bağlantısı, schema queries, CRUD
├── scripts/
│   ├── db-bootstrap.mjs            Tablo ve indeksleri oluşturur
│   └── ui-smoke.mjs                Playwright smoke testleri
├── .env.example                    Gerekli env değişkenleri (değersiz)
├── vercel.json                     Bölge: fra1, vercel-build script
└── next.config.js
```

---

## Başlangıç

### 1. Kurulum

```bash
git clone https://github.com/ahmetakyapi/mimio.git
cd mimio
npm install
```

### 2. Environment Değişkenleri

```bash
cp .env.example .env.local
```

`.env.local` içini doldurun:

```env
# Neon PostgreSQL (https://neon.tech → yeni proje → bağlantı dizesi)
DATABASE_URL="postgresql://USER:PASSWORD@ep-XXXX-pooler.REGION.aws.neon.tech/neondb?sslmode=require"

# Uygulama URL'si
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Veritabanı Şeması

```bash
npm run db:bootstrap
```

Tabloları ve indeksleri oluşturur. Idempotent — birden fazla kez çalıştırılabilir.

### 4. Geliştirme Sunucusu

```bash
npm run dev
# → http://localhost:3000
```

---

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Next.js geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run start` | Production sunucusu |
| `npm run db:bootstrap` | Neon şemasını oluştur / güncelle |

---

## API Endpoint'leri

Tüm endpoint'ler `src/app/api/platform/` altında tanımlıdır.

### `GET /api/platform/overview`

Platform istatistiklerini döner: toplam seans, aktif terapist/danışan sayısı, oyun başına skor özeti, son seanslar.

```ts
// Yanıt tipi: PlatformOverviewPayload
{
  database: { configured, status, provider, message },
  totals: { sessionCount, totalScore },
  sessionInsight: { averageScore, activeTherapists, activeClients, lastPlayedAt },
  remoteScores: { memory, pairs, pulse, route, difference, scan },
  therapists: TherapistProfile[],
  clients: ClientProfile[],
  recentSessions: RecentSessionEntry[]
}
```

### `GET /api/platform/profiles`

Terapist ve danışan profil listelerini döner.

### `POST /api/platform/profiles`

Yeni terapist veya danışan profili oluşturur.

```ts
// Terapist
{ type: "therapist", displayName, username, password, clinicName?, specialty? }

// Danışan
{ type: "client", displayName, ageGroup, primaryGoal, supportLevel }
```

### `GET /api/platform/sessions`

Son seans kayıtlarını döner.

### `POST /api/platform/sessions`

Seans kaydı ekler.

```ts
{
  gameKey: "memory" | "pairs" | "pulse" | "route" | "difference" | "scan",
  score: number,
  therapistId?: string,
  therapistName?: string,
  clientId?: string,
  clientName?: string,
  sessionNote?: string,
  durationSeconds?: number,
  playedAt?: string   // ISO 8601
}
```

### `GET /api/og`

Dinamik OpenGraph görseli. Edge runtime.

```
/api/og?title=Mimio&subtitle=Ergoterapistler+için+platform
→ 1200×630 PNG
```

---

## Veritabanı Şeması

```sql
-- Terapist profilleri
CREATE TABLE therapist_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  TEXT NOT NULL UNIQUE,
  username      TEXT UNIQUE,
  password_hash TEXT,
  clinic_name   TEXT,
  specialty     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Danışan profilleri
CREATE TABLE client_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  TEXT NOT NULL UNIQUE,
  age_group     TEXT,
  primary_goal  TEXT,
  support_level TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seans kayıtları
CREATE TABLE session_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id     UUID,
  therapist_name   TEXT NOT NULL DEFAULT 'Mimio Demo',
  client_id        UUID,
  client_name      TEXT NOT NULL DEFAULT 'Demo Danışan',
  game_key         TEXT NOT NULL,
  game_label       TEXT NOT NULL,
  score            INTEGER NOT NULL CHECK (score >= 0),
  source           TEXT NOT NULL DEFAULT 'web-app',
  played_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER,
  session_note     TEXT
);
```

---

## Tema Sistemi

Mimio, `next-themes` yerine özel bir `data-theme` tabanlı tema sistemi kullanır.

```ts
// ThemeProvider — tema geçişi
document.documentElement.setAttribute('data-theme', 'light' | 'dark')
localStorage.setItem('mimio-theme', 'light' | 'dark')
```

Tüm renkler `globals.css` içindeki `@theme {}` bloğunda CSS değişkeni olarak tanımlıdır:

```css
/* Dark (varsayılan) */
--color-page-bg: #04070d;
--color-primary:  #6366f1;
--color-surface:  rgba(255, 255, 255, 0.035);

/* Light override */
html[data-theme='light'] {
  --color-page-bg: #eef2ff;
  --color-surface:  rgba(255, 255, 255, 0.65);
}
```

**Kurallı:** Bileşenlerde hardcoded renk kullanılmaz — her zaman `var(--color-*)` veya Tailwind'in `text-(--color-*)` syntax'ı kullanılır.

---

## Vercel Deploy

```bash
vercel --prod
```

`vercel.json` konfigürasyonu:

```json
{
  "buildCommand": "npm run vercel-build",
  "framework": "nextjs",
  "regions": ["fra1"]
}
```

`vercel-build` şemayı otomatik çalıştırır:

```bash
node scripts/db-bootstrap.mjs && next build
```

**Deploy öncesi kontrol listesi:**

- [ ] `DATABASE_URL` Vercel env'e eklenmiş
- [ ] `NEXT_PUBLIC_APP_URL` production URL'i ile ayarlanmış
- [ ] `npm run build` lokal başarılı
- [ ] Neon dashboard'da bağlantı aktif

---

## Teknik Kararlar

| Karar | Tercih | Neden |
|---|---|---|
| DB sürücüsü | `@neondatabase/serverless` | Vercel serverless'ta `pg` timeout verir |
| Tema sistemi | `data-theme` (custom) | next-themes'in hydration uyarısı olmadan daha temiz |
| Animasyon | Framer Motion | React-native, deklaratif, GSAP lisans gerektirmez |
| CSS | Tailwind v4 `@theme {}` | Tailwind config dosyası gerektirmez, CSS değişkenleri ile tam uyum |
| Auth | Custom (bcrypt) | Clerk/Auth.js'e gerek duymadan tam kontrol |
| Deployment bölgesi | `fra1` (Frankfurt) | Türkiye'ye en yakın Vercel bölgesi — düşük latency |

---

## Geliştirme Notları

### Yeni oyun eklerken

1. `platform-data.ts` → `GAME_LABELS`'a key ekle
2. `therapy-program-data.ts` → `GAME_THERAPY_MAPPINGS`'e eşleştirme ekle
3. `MimioApp.tsx` → oyun render mantığını ekle
4. `POST /api/platform/sessions` — `gameKey` validasyonu otomatik güncellenir

### Yeni terapi alanı eklerken

1. `therapy-program-data.ts` → `TherapyDomainKey` tipine ekle
2. `THERAPY_DOMAINS` dizisine alan tanımı ekle
3. İlgili aktivitelere `suitableDomains` içinde alan key'ini ekle

---

*Ergoterapistler için, ergoterapistlerle birlikte yapılandırıldı.*
