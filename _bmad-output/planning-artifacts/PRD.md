# Mimio — Premium UI Dönüşümü PRD

## Yönetici Özeti

Mimio, ergoterapistler için tasarlanmış bir interaktif terapi oyun platformudur. Mevcut durumda fonksiyonel olarak çalışan ancak görsel olarak karmaşık ve "ham" hissettiren bir arayüze sahiptir. Bu PRD, platformu **premium, modern ve profesyonel** bir görsel kimliğe kavuşturmak için gerekli dönüşümü tanımlar.

## Problem Tanımı

1. **Landing Page** düzeni genel ve şablon benzeri; marka kimliği zayıf
2. **MimioApp** 3100+ satırlık tek dosyada; navigasyon karmaşık, bileşenler iç içe
3. Sidebar, dashboard, oyun ekranları arasında görsel tutarlılık eksik
4. Mobil deneyim responsive ama **premium** değil
5. Mikro-animasyonlar ve geçiş efektleri yetersiz
6. Oyun ekranları arasında kimlik farkı yok; hepsi benzer görünüyor

## Vizyon

Mimio, **Apple Health + Notion + Duolingo** estetiğinde, premium glassmorphism ve subtil animasyonlarla zenginleştirilmiş bir ergoterapi platformu olacak.

## Başarı Kriterleri

- Modern, tutarlı ve premium hissiyat
- Responsive tasarım kalitesi artışı (mobil-first)
- Bileşen ayrıştırma ve temiz mimari
- Performans kaybı olmadan animasyon zenginliği

---

## Epic 1: Landing Page Premium Dönüşümü

### Story 1.1: Hero Section Yeniden Tasarımı
**Açıklama:** Hero section'ı animated gradient mesh arka plan, daha büyük ve cesur tipografi, ve floating glassmorphism kartlarla premium hale getir.
**Kabul Kriterleri:**
- Animated gradient mesh background (CSS-only, performant)
- Başlık tipografisi daha büyük ve bold
- Hero mockup kartı yerine gerçek animated UI preview
- Floating stat kartları glassmorphism efektli
- Mobilde stack düzeni, masaüstünde split layout

### Story 1.2: Feature Kartları Yeniden Tasarımı
**Açıklama:** Özellik kartlarını bento-grid layout ile yeniden düzenle, her karta subtil hover animasyonu ve ikonlara gradient ekle.
**Kabul Kriterleri:**
- Bento-grid düzeni (büyük + küçük kartlar karışık)
- Her kart glassmorphism arka plan
- İkon gradient efekti
- Hover'da scale + glow efekti
- Border gradient animation

### Story 1.3: Oyun Showcase Section Premium
**Açıklama:** Oyun kartlarını büyük, interaktif preview'larla göster. Her kartın üzerinde gerçek mini oyun animasyonu olsun.
**Kabul Kriterleri:**
- 3 oyun kartı büyük format
- Her kartta animasyonlu simge/pattern
- Hover'da kart flip veya expand efekti
- Gradient overlay doğru

### Story 1.4: CTA ve Footer Premium
**Açıklama:** CTA section'ına gradient border, glow button ve trust badge'ler ekle. Footer'ı modern ve minimal yap.
**Kabul Kriterleri:**
- CTA butonu animated glow efektli
- Trust badge'ler (güvenlik, hız, ücretsiz)
- Footer minimal, iki sütun
- Sosyal medya ikonları

---

## Epic 2: Navigation & Layout Sistemi

### Story 2.1: Premium Sidebar Tasarımı
**Açıklama:** Sidebar'ı glassmorphism efektli, animasyonlu ikonlarla ve aktif state indicator ile yeniden tasarla.
**Kabul Kriterleri:**
- Glassmorphism sidebar arka plan
- Aktif menü item'ında animated indicator (pill shape)
- İkon + metin, hover tooltip (collapsed mode)
- Collapse/expand animasyonu smooth
- Sidebar alt kısmında user avatar ve settings

### Story 2.2: Top Bar / Header Yeniden Tasarımı
**Açıklama:** Her sayfanın üstünde breadcrumb, arama ve hızlı aksiyonları barındıran premium bir header bar tasarla.
**Kabul Kriterleri:**
- Glassmorphism blur header
- Breadcrumb navigasyon
- Tema toggle butonu premium
- Bildirim ikonu (placeholder)
- Responsive collapse

---

## Epic 3: Dashboard Premium Dönüşümü

### Story 3.1: Dashboard Stat Kartları
**Açıklama:** Dashboard'daki istatistik kartlarını gradient arka planlı, animasyonlu sayaçlı ve ikon vurgulu premium kartlara dönüştür.
**Kabul Kriterleri:**
- 4 ana stat kartı (Toplam Danışan, Aktif Seans, Haftalık Oyun, Ortalama Skor)
- Her kartta animated counter (sayı artış animasyonu)
- Gradient arka plan (her kart farklı renk)
- Sparkline mini grafik (CSS/SVG)
- Hover elevate efekti

### Story 3.2: Aktif Danışanlar Listesi Premium
**Açıklama:** Danışan listesini modern kart tabanlı layout'a çevir, avatar, ilerleme çubuğu ve son aktivite bilgisiyle zenginleştir.
**Kabul Kriterleri:**
- Danışan kartları glassmorphism
- Avatar placeholder (baş harf + gradient)
- İlerleme çubuğu (bağımsızlık seviyesi)
- Son aktivite zaman damgası
- Hızlı aksiyon butonları (seans başlat, profili gör)

### Story 3.3: Son Aktiviteler Timeline
**Açıklama:** Dashboard'a son aktiviteleri gösteren bir timeline/feed componenti ekle.
**Kabul Kriterleri:**
- Vertical timeline layout
- Her entry'de ikon, zaman, açıklama
- Farklı aktivite tipleri farklı renk
- Animasyonlu fade-in

---

## Epic 4: Oyun Ekranları Premium Dönüşümü

### Story 4.1: Oyun Seçim Ekranı
**Açıklama:** Oyun kategorilerini ve oyunları gösteren grid'i premium kartlarla yeniden tasarla.
**Kabul Kriterleri:**
- Kategori tabları animasyonlu
- Oyun kartları büyük format, her birinde benzersiz gradient
- Oyun kartında zorluk seviyesi badge'i
- Hover'da preview animasyonu
- Seçilen oyun kartı highlight

### Story 4.2: Oyun İçi UI Premium
**Açıklama:** Aktif oyun alanını daha immersive bir deneyim haline getir: skor overlay, timer bar, combo animasyonu.
**Kabul Kriterleri:**
- Üstte glassmorphism skor/timer bar
- Combo kazanıldığında pulse animasyonu
- Doğru cevap için yeşil flash overlay
- Yanlış cevap için kırmızı shake
- Oyun tamamlandığında confetti-benzeri parti efekti

### Story 4.3: Oyun Sonuç Ekranı
**Açıklama:** Oyun bittiğinde sonuçları gösteren premium bir modal/overlay tasarla.
**Kabul Kriterleri:**
- Modal glassmorphism arka plan
- Büyük skor animasyonu (sayı artışı)
- En iyi skor karşılaştırması
- Yıldız rating sistemi (performansa göre 1-3 yıldız)
- "Tekrar Oyna" ve "Oyunlara Dön" butonları premium

---

## Epic 5: Danışan Yönetimi Premium

### Story 5.1: Danışan Profil Kartları
**Açıklama:** Danışan listesini modern profil kartlarına dönüştür.
**Kabul Kriterleri:**
- Kart: avatar, ad, yaş grubu, hedef, seviye
- Gradient avatar (ismin ilk harfleriyle)
- Seviye göstergesi animasyonlu progress bar
- Tıkla detay sayfası açılsın

### Story 5.2: Danışan Detay Sayfası
**Açıklama:** Danışan detay sayfasını tab-based, premium layout ile yeniden tasarla.
**Kabul Kriterleri:**
- Üstte büyük profil hero (gradient bg, avatar, bilgiler)
- Tablar: Seans Notları, Haftalık Plan, Skorlar, İlerleme
- Her tab içeriği temiz ve okunabilir
- Seans notu ekleme formu modern

---

## Epic 6: Mikro-Animasyonlar ve Detaylar

### Story 6.1: Page Transition Animasyonları
**Açıklama:** Sayfalar arası geçişlerde fade/slide animasyonları ekle.
**Kabul Kriterleri:**
- Framer Motion AnimatePresence
- Sayfa girişte fade-up
- Çıkışta fade-down
- Sidebar navigasyonunda smooth geçiş

### Story 6.2: Loading States ve Skeleton
**Açıklama:** Veri yüklenirken premium skeleton/shimmer efektleri göster.
**Kabul Kriterleri:**
- Skeleton kartlar (glassmorphism)
- Shimmer animasyonu (gradient sweep)
- Her bileşen için uygun skeleton shape

### Story 6.3: Tooltip ve Popover Sistemi
**Açıklama:** Hover bilgileri için tutarlı tooltip sistemi kur.
**Kabul Kriterleri:**
- Glassmorphism tooltip
- Animasyonlu giriş/çıkış
- Sidebar collapsed mode'da tooltip

---

## Teknik Kararlar

- **Framer Motion** animasyonlar için (zaten yüklü)
- **Tailwind CSS v4** ile tüm stiller
- **CSS custom properties** tema sistemi korunacak
- **Bileşen ayrıştırma**: MimioApp.tsx 3100 satırdan parçalanacak
- **Performans**: will-change, transform kullanımı, animasyon GPU-accelerated

## Öncelik Sırası

1. Story 1.1 → Hero Section (en görünür etki)
2. Story 1.2 → Feature Kartları
3. Story 1.3 → Oyun Showcase
4. Story 1.4 → CTA & Footer
5. Story 3.1 → Dashboard Stats
6. Story 4.1 → Oyun Seçim
7. Story 6.1 → Page Transitions
