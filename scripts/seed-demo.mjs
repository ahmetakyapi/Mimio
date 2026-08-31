#!/usr/bin/env node
//
// `ahmetakyapi` terapisti için gerçekçi bir demo veri kümesi yazar:
// altı danışan, ~12 haftalık seans geçmişi, bu haftanın dolu takvimi,
// hedefler ve seans notları.
//
// Amaç boş ekranları doldurmak değil — ekranların çoğu ancak veri varken
// okunabilir bir şey söylüyor: eğilim çizgisi, plato tespiti, alan dengesi,
// bağımsızlık ölçeği. Seans skorları bu yüzden rastgele değil, danışan
// başına bir "öğrenme eğrisi" + gürültüden üretiliyor; kimi platoya girer,
// kimi yükselir, biri ara verir. Öneri motorunun her kuralı en az bir
// danışanda tetiklenir.
//
// Kullanım:
//   DATABASE_URL="postgres://..." node scripts/seed-demo.mjs
//   npm run db:seed
//
// Yeniden çalıştırılabilir: aynı terapistin demo verisi önce silinir.
// `--reset` ile terapist hesabı da yeniden kurulur.

import { existsSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/* ── Env yükleme (db-bootstrap ile aynı davranış) ── */

if (!process.env.DATABASE_URL) {
  try {
    for (const f of [".env.local", ".env"]) {
      if (existsSync(f)) {
        for (const line of readFileSync(f, "utf-8").split("\n")) {
          const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (m && !process.env[m[1]]) {
            let v = m[2] ?? "";
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
            process.env[m[1]] = v;
          }
        }
      }
    }
  } catch { /* env dosyası yoksa sorun değil */ }
}

if (!process.env.DATABASE_URL) {
  console.error("✗  DATABASE_URL tanımlı değil. .env.local dosyasına ekleyin veya değişkeni verin.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const RESET = process.argv.includes("--reset");
/* Şifre yalnızca açıkça istenirse değişir — seed'in yan etkisi olarak değil. */
const SET_PASSWORD = process.argv.includes("--set-password");
/*
 * `--purge-legacy`: arşivlenmiş eski test danışanlarının kayıtlarını siler.
 *
 * Geliştirme sırasında elle açılmış kayıtlar (bkz. 2b) arşive alınıyor ama
 * seansları duruyor ve bu seanslar eski bir puanlama şemasından kalma
 * değerler taşıyor — 100 üzerinden okunan bir ölçekte 711'e kadar. Genel
 * bakış sorguları ne terapiste ne arşiv durumuna göre filtrelediği için bu
 * satırlar "Ortalama Skor" gibi ölçüleri yukarı çekiyor.
 *
 * Silme varsayılan değil: karar veriye sahip olanın.
 */
const PURGE_LEGACY = process.argv.includes("--purge-legacy");

/* ── Sabitler ── */

const THERAPIST = {
  displayName: "Ahmet Akyapı",
  username: "ahmetakyapi",
  password: "mimio2026",
  clinicName: "Serra Klinik",
  specialty: "Ergoterapist",
};

/* Giriş ekranındaki "Demo Hesapla Keşfet" düğmesi demo/demo1234 ile giriş
   yapıyor; hesap yoksa düğme her seferinde "kullanıcı adı veya şifre hatalı"
   üretiyordu. Seed bu hesabı garanti eder. */
const DEMO_THERAPIST = {
  displayName: "Demo Terapist",
  username: "demo",
  password: "demo1234",
  clinicName: "Mimio Demo",
  specialty: "Ergoterapist",
};

const GAMES = {
  memory:     { label: "Sıra Hafızası", domain: "memory" },
  pairs:      { label: "Kart Eşle",     domain: "visual" },
  pulse:      { label: "Mavi Nabız",    domain: "motor" },
  route:      { label: "Komut Rotası",  domain: "motor" },
  difference: { label: "Fark Avcısı",   domain: "visual" },
  scan:       { label: "Hedef Tarama",  domain: "attention" },
  logic:      { label: "Dizi Mantık",   domain: "cognitive" },
};

/*
 * Her danışanın bir "hikâyesi" var; ekranlar bu hikâyeleri okuyor:
 *   · trend "rise"    → gelişim eğrisi yukarı
 *   · trend "plateau" → son üç seans sabit, öneri motoru plato yakalar
 *   · trend "dip"     → yorgunluk / gerileme, zorluk düşürme önerisi
 *   · idleDays        → uzun süredir seans yok, "ara verdi" kuralı
 */
const CLIENTS = [
  {
    displayName: "Ela Selin", ageGroup: "6-8", primaryGoal: "Çalışma belleği",
    supportLevel: "Gözetim", difficultyLevel: "Orta", tags: ["Pediatrik"],
    birthDate: "2019-03-14",
    freeNote: "Aile görüşmesi. Anne, akşam ev programının yatma saatiyle çakıştığını söyledi; program okul sonrasına alındı. Öğretmenden sınıf içi dikkat gözlemi istenecek.",
    games: ["memory", "pairs", "logic"], base: 62, trend: "plateau", sessions: 16, idleDays: 0,
    goals: [
      { title: "Blok Açıklığı 6", description: "Corsi blok testinde 6 birimlik sekans", target: 7, current: 6 },
      { title: "Dikkat Süresi", description: "Kesintisiz odaklanma (dakika)", target: 6, current: 4 },
      { title: "Yürütücü İşlev", description: "3×3 matris örüntü tamamlama", target: 9, current: 4 },
      { title: "İpucusuz Tekrar", description: "Sözel ipucu olmadan 5'li sekans", target: 5, current: 5 },
    ],
    notes: [
      { s: 'Bugün istekliydi, "daha zor olsun" dedi.', o: "6 blok tam seri; 2 turda sözel ipucu gerekti.", a: "Görsel-uzamsal çalışma belleği hedefe ulaştı; skor üç seanstır aynı bantta.", p: "7 blok + Dizi Mantık dönüşümlü; ev programına 1 aktivite." },
      { s: "Seans başında dağınıktı, kısa uyum süreci gerekti.", o: "Sekans uzunluğu 5'te takıldı; görsel ipucuyla 6'ya çıktı.", a: "İpucuna bağımlılık sürüyor.", p: "İpucu silikleştirme denenecek." },
      { s: "Annesi hafta içi ev programını iki kez uyguladıklarını aktardı.", o: "Kart Eşle'de hamle sayısı 18'den 14'e indi.", a: "Görsel yer belleği ev tekrarıyla pekişiyor.", p: "Ev programı aynı yoğunlukta devam." },
    ],
  },
  {
    displayName: "Tuna Akarsu", ageGroup: "9-11", primaryGoal: "El-göz koordinasyonu",
    supportLevel: "Sözel ipucu", difficultyLevel: "Orta", tags: ["Nörolojik"],
    birthDate: "2016-06-02",
    freeNote: "Okul rehberlik servisiyle telefon görüşmesi. Beden eğitimi öğretmeni top yakalama görevlerinde belirgin ilerleme bildirdi. Bir sonraki değerlendirmede bilateral görevler yeniden ölçülecek.",
    games: ["pulse", "route", "scan"], base: 58, trend: "rise", sessions: 18, idleDays: 0,
    goals: [
      { title: "Reaksiyon Süresi", description: "Hedefe dokunma gecikmesi (persentil)", target: 10, current: 9 },
      { title: "Motor Planlama", description: "Yön komutu takibi", target: 8, current: 6 },
      { title: "Bilateral Koordinasyon", description: "Çift el görevlerinde süre farkı", target: 6, current: 3 },
    ],
    notes: [
      { s: "Yorgunluk belirtisi yok, istekli.", o: "Sağ el dominant; sol el görevlerinde 2 kat süre farkı.", a: "Bilateral koordinasyon gelişime açık.", p: "Çift el aktiviteleri eklendi." },
      { s: "Okulda beden eğitimi dersinin iyi geçtiğini anlattı.", o: "Mavi Nabız'da isabet %78'den %86'ya çıktı; seri 9'a ulaştı.", a: "Hız-doğruluk dengesi kuruluyor, yükseliş istikrarlı.", p: "Zorluk bir kademe artırılacak." },
      { s: "Kalem tutuşu hakkında öğretmen geri bildirimi olumlu.", o: "Komut Rotası'nda ardışık 12 doğru yön.", a: "İnhibisyon kontrolü yaş normuna yaklaştı.", p: "Ev programına top yakalama eklendi." },
    ],
  },
  {
    displayName: "Asya Demir", ageGroup: "6-8", primaryGoal: "Seçici dikkat",
    supportLevel: "Fiziksel yardım", difficultyLevel: "Kolay", tags: ["Otizm & DEHB"],
    birthDate: "2018-11-20",
    freeNote: "Kurum yazışması: bireysel eğitim planı toplantısı iki hafta sonra. Duyusal profil formu aileye gönderildi, doldurulup getirilecek.",
    games: ["scan", "difference", "memory"], base: 48, trend: "rise", sessions: 13, idleDays: 0,
    goals: [
      { title: "Tarama Hızı", description: "Izgarada hedef bulma (sn)", target: 12, current: 7 },
      { title: "Oturma Süresi", description: "Masa başında kesintisiz görev", target: 10, current: 6 },
    ],
    notes: [
      { s: "Kalabalık ekranda huzursuzlandı.", o: "8×8 ızgarada tarama süresi iki katına çıktı.", a: "Görsel kalabalık toleransı düşük.", p: "4×4'ten başlanıp kademeli büyütülecek." },
      { s: "Seansa gülümseyerek geldi, geçiş sorunsuzdu.", o: "4×4 ızgarada 10/10 hedef; süre ortalaması 4,2 sn.", a: "Küçük alanda seçici dikkat güçleniyor.", p: "5×5'e geçilecek, süre ölçümü sürecek." },
      { s: "Babası ev rutininde ekran süresinin azaldığını aktardı.", o: "Fark Avcısı'nda ilk kez fiziksel yardım olmadan 6 tur.", a: "Destek düzeyi sözel ipucuya inmeye hazır.", p: "Gelecek seans destek kademesi denenecek." },
    ],
  },
  {
    displayName: "Mina Yıldız", ageGroup: "4-5", primaryGoal: "Görsel ayrım",
    supportLevel: "Bağımsız", difficultyLevel: "Zor", tags: ["Pediatrik"],
    birthDate: "2021-01-09",
    freeNote: "Seans dışı gözlem. Bekleme odasında akranıyla sıra alma davranışı kendiliğinden görüldü; sosyal hedefe veri olarak eklendi.",
    games: ["difference", "pairs"], base: 74, trend: "rise", sessions: 11, idleDays: 1,
    goals: [
      { title: "Figür-Zemin Ayrımı", description: "Benzer kartlar arasında fark bulma", target: 15, current: 13 },
      { title: "Görsel Eşleme", description: "12 kartlık destede hamle verimi", target: 12, current: 12 },
    ],
    notes: [
      { s: "Kendinden emin, ek zorluk istedi.", o: "Zor seviyede %91 doğruluk.", a: "Yaşına göre ileri seviyede.", p: "Zorluk Zor'da tutulacak." },
      { s: "Oyunu kardeşine öğretmek istediğini söyledi.", o: "Kart Eşle 12 hamlede tamamlandı — hedef verime ulaşıldı.", a: "Görsel eşleme hedefi kapandı.", p: "Yeni hedef: karmaşık zeminde figür ayrımı." },
    ],
  },
  {
    displayName: "Kerem Arslan", ageGroup: "9-11", primaryGoal: "Örüntü tamamlama",
    supportLevel: "Gözetim", difficultyLevel: "Orta", tags: ["Nörolojik"],
    birthDate: "2016-02-11",
    freeNote: "Aile, evde ekran süresini günde 40 dakikaya indirdiklerini aktardı. Akşam yorgunluğunun azaldığı, ödev süresinin kısaldığı bildirildi.",
    games: ["logic", "memory", "scan"], base: 55, trend: "dip", sessions: 14, idleDays: 2,
    goals: [
      { title: "Tümevarım", description: "Kural çıkarma", target: 10, current: 5 },
      { title: "Hata Toleransı", description: "Yanlış sonrası göreve dönüş", target: 8, current: 4 },
    ],
    notes: [
      { s: "Yorgun geldi, okul haftası zor geçmiş.", o: "Son iki seansta skor 12 puan düştü.", a: "Performans düşüşü dönemsel görünüyor; uyku düzeni etkisi olası.", p: "Zorluk bir kademe indirildi, aile ile uyku rutini konuşulacak." },
      { s: "Sınav haftasının bittiğini, rahatladığını söyledi.", o: "Dizi Mantık'ta 8/12 doğru — düşüş durdu.", a: "Toparlanma başladı, henüz eski banda dönmedi.", p: "İki seans daha mevcut zorlukta izlenecek." },
    ],
  },
  {
    displayName: "Mert Yiğit", ageGroup: "12-14", primaryGoal: "Yürütücü işlev",
    supportLevel: "Bağımsız", difficultyLevel: "Zor", tags: ["Otizm & DEHB"],
    birthDate: "2013-08-27",
    freeNote: "Ara verme dönemi. Aile yaz tatili nedeniyle üç hafta seans alamayacaklarını bildirdi; dönüşte yeniden değerlendirme planlandı.",
    /* Uzun süredir gelmiyor — "ara verdi" önerisini ve plandaki boş slotu tetikler. */
    games: ["logic", "route"], base: 70, trend: "plateau", sessions: 8, idleDays: 11,
    goals: [{ title: "Görev Değiştirme", description: "Kural değişiminde uyum", target: 8, current: 6 }],
    notes: [
      { s: "—", o: "11 gündür seans kaydı yok.", a: "Devamsızlık ilerlemeyi riske atıyor.", p: "Aile ile iletişime geçilecek." },
      { s: "Son seansında okul projesinden bahsetti, motivasyonu yüksekti.", o: "Dizi Mantık'ta zor seviyede %75 doğruluk.", a: "Plato bandında ama üst sınırda seyrediyor.", p: "Dönüşte kural değiştirmeli setlerle başlanacak." },
    ],
  },
  {
    displayName: "Derin Kaya", ageGroup: "12-14", primaryGoal: "İnce motor kontrol",
    supportLevel: "Sözel ipucu", difficultyLevel: "Orta", tags: ["Nörolojik"],
    birthDate: "2013-04-18",
    freeNote: "Fizyoterapi raporu dosyaya eklendi. Omuz kuşağı stabilitesi çalışmaları sürüyor; ince motor hedefleriyle çakışmayacak şekilde saat ayarlandı.",
    games: ["pulse", "route", "pairs"], base: 52, trend: "rise", sessions: 15, idleDays: 0,
    goals: [
      { title: "Hedefleme Hassasiyeti", description: "Küçük hedefe ilk temasla isabet", target: 10, current: 6 },
      { title: "Yazı Hızı", description: "Dakikada okunaklı kelime", target: 14, current: 9 },
    ],
    notes: [
      { s: "Fizyoterapi seansından sonra geldi, elleri yorgundu.", o: "Mavi Nabız'da isabet %64; ilk 5 turda ısınma etkisi belirgin.", a: "Yorgunluk performansı maskeliyor; ölçüm günü ayrılmalı.", p: "Seans günü fizyoterapiden ayrı güne alındı." },
      { s: "Yeni programdan memnun, kendini daha az yorgun hissediyor.", o: "İsabet %79'a çıktı; seri 7.", a: "Program değişikliği doğru karardı, yükseliş gerçek.", p: "Mevcut düzen korunacak." },
    ],
  },
  {
    displayName: "Zeynep Ada", ageGroup: "4-5", primaryGoal: "Oyun katılımı",
    supportLevel: "Fiziksel yardım", difficultyLevel: "Kolay", tags: ["Pediatrik", "Otizm & DEHB"],
    birthDate: "2021-09-30",
    freeNote: "İlk üç ayın özeti aileyle paylaşıldı. Oyun katılım süresi 4 dakikadan 11 dakikaya çıktı; hedef yukarı revize edilecek.",
    /* 5 gün aradan sonra plan önerisi tetiklenir ama "ara verdi" uyarısına düşmez. */
    games: ["pairs", "difference", "pulse"], base: 44, trend: "rise", sessions: 9, idleDays: 5,
    goals: [
      { title: "Ortak Dikkat", description: "Oyun sırasında göz teması ve sıra alma", target: 8, current: 3 },
      { title: "Yönerge Takibi", description: "Tek adımlı yönergeyi ilk denemede uygulama", target: 10, current: 5 },
    ],
    notes: [
      { s: "Seans odasına girerken tereddüt etti, geçiş kartıyla rahatladı.", o: "Kart Eşle'de 3 çift; fiziksel yönlendirme 4 kez gerekti.", a: "Görsel destekle katılım artıyor.", p: "Geçiş kartları rutine eklenecek." },
      { s: "Annesi evde oyuncak paylaşımının arttığını aktardı.", o: "Sıra alma 5 turda 3 kez bağımsız gerçekleşti.", a: "Ortak dikkat hedefinde erken ilerleme işaretleri var.", p: "Sıra almalı oyunlar iki seans daha sürecek." },
    ],
  },
];

/* ── Yardımcılar ── */

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function startOfWeek(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

/* Tohumlu üretici: her çalıştırmada aynı veri çıksın, ekran görüntüleri kaysın istemiyoruz. */
function rng(seed) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

/**
 * Hedef bitiş tarihi ilerlemeden türer; elle 18 tarih yazmak yerine kural
 * yazıldı ki hedef verisi değişince tarihler kendiliğinden tutarlı kalsın.
 * Amaç her durumu en az bir hedefte göstermek: kapanmış, yaklaşan, geride.
 */
function goalDeadline(goal, index, rand) {
  const ratio = goal.target > 0 ? goal.current / goal.target : 0;
  const d = new Date();
  if (ratio >= 1) d.setDate(d.getDate() - (5 + Math.round(rand() * 20)));      // zamanında kapandı
  else if (ratio >= 0.7) d.setDate(d.getDate() + (7 + Math.round(rand() * 14))); // yaklaşıyor
  else if (index === 2) d.setDate(d.getDate() - (3 + Math.round(rand() * 6)));   // tarihi geçti
  else d.setDate(d.getDate() + (35 + Math.round(rand() * 40)));                  // uzak vadeli
  return isoDate(d);
}

/*
 * Seans sonu tek satırlık gözlem (`session_runs.session_note`).
 *
 * Sütun şemada vardı ama seed hiç doldurmuyordu: Seans Notları ekranı bu
 * satırı seansın yanında gösteriyor, 115 seansın 115'i boştu. Her seansta
 * not olması gerçekçi değil — terapist yalnızca bir şey dikkatini çektiğinde
 * yazar — bu yüzden üçte birine yazılıyor ve metin skorun o seanstaki
 * anlamına göre seçiliyor.
 */
const SESSION_NOTES = {
  high: [
    "Yönergeyi ilk seferde aldı, ipucu gerekmedi.",
    "Kendi hatasını fark edip düzeltti.",
    "Süre dolmadan bitirdi; zorluk artırılabilir.",
    "Seans boyunca oturma pozisyonunu korudu.",
  ],
  mid: [
    "İlk turda ısınma gerekti, sonrasında toparladı.",
    "İki kez sözel ipucu verildi.",
    "Dikkati seansın ortasında bir kez dağıldı.",
    "Tempo iyiydi, isabet dalgalı.",
  ],
  low: [
    "Yorgun geldi, seans kısa tutuldu.",
    "Fiziksel yardım gerekti; frustrasyon belirtisi var.",
    "Yönergeyi tekrar etmek gerekti.",
    "Mola verildi, sonrasında katılım arttı.",
  ],
};

/**
 * Danışanın skor eğrisi. Düz rastgele sayı kullanılmıyor: gelişim eğrisi
 * ekranı ancak bir eğilim varsa anlamlı okunuyor.
 */
function scoreCurve(client, i, total, rand) {
  const t = total > 1 ? i / (total - 1) : 1;
  let v = client.base;

  if (client.trend === "rise") v += 26 * t;
  if (client.trend === "plateau") v += 24 * Math.min(t * 1.9, 1);        // erken yüksel, sonra sabitlen
  if (client.trend === "dip") v += 22 * t - (t > 0.78 ? 16 * (t - 0.78) * 4.5 : 0);

  v += (rand() - 0.5) * 7;                                               // seans içi gürültü
  if (client.trend === "plateau" && t > 0.8) v = client.base + 24 + (rand() - 0.5) * 2.2;

  return Math.max(20, Math.min(99, Math.round(v)));
}

/* ── Çalıştır ── */

console.log("⏳  Demo verisi hazırlanıyor…");

await sql.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

/* 1 — Terapist */
if (RESET) {
  await sql.query("DELETE FROM therapist_profiles WHERE username = $1", [THERAPIST.username]);
}

let [therapist] = await sql.query(
  "SELECT id::text FROM therapist_profiles WHERE username = $1 LIMIT 1",
  [THERAPIST.username],
);
const therapistExisted = Boolean(therapist);

if (!therapist) {
  [therapist] = await sql.query(
    `INSERT INTO therapist_profiles (display_name, clinic_name, specialty, username, password_hash)
     VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 8)))
     RETURNING id::text`,
    [THERAPIST.displayName, THERAPIST.clinicName, THERAPIST.specialty, THERAPIST.username, THERAPIST.password],
  );
  console.log(`   • terapist oluşturuldu: ${THERAPIST.username} / ${THERAPIST.password}`);
} else {
  /* Var olan hesabın kendi bilgilerini ezmiyoruz — yalnızca boş alanları
     dolduruyoruz. Seed demo verisi eklemek için, kimliği değiştirmek için
     değil. */
  await sql.query(
    `UPDATE therapist_profiles
     SET display_name = COALESCE(NULLIF(display_name,''), $2),
         clinic_name  = COALESCE(NULLIF(clinic_name,''), $3),
         specialty    = COALESCE(NULLIF(specialty,''), $4)
     WHERE id = $1`,
    [therapist.id, THERAPIST.displayName, THERAPIST.clinicName, THERAPIST.specialty],
  );
  if (SET_PASSWORD) {
    await sql.query(
      "UPDATE therapist_profiles SET password_hash = crypt($2, gen_salt('bf', 8)) WHERE id = $1",
      [therapist.id, THERAPIST.password],
    );
    console.log(`   • terapist zaten var, şifre ${THERAPIST.password} olarak güncellendi`);
  } else {
    console.log("   • terapist zaten var, mevcut bilgileri ve şifresi korundu");
  }
}

const therapistId = therapist.id;

/* 1b — Demo hesabı (giriş ekranındaki "Demo Hesapla Keşfet" bunu bekler). */
const [existingDemo] = await sql.query(
  "SELECT id::text FROM therapist_profiles WHERE username = $1 LIMIT 1",
  [DEMO_THERAPIST.username],
);
if (!existingDemo) {
  await sql.query(
    `INSERT INTO therapist_profiles (display_name, clinic_name, specialty, username, password_hash)
     VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf', 8)))`,
    [DEMO_THERAPIST.displayName, DEMO_THERAPIST.clinicName, DEMO_THERAPIST.specialty, DEMO_THERAPIST.username, DEMO_THERAPIST.password],
  );
  console.log(`   • demo hesabı oluşturuldu: ${DEMO_THERAPIST.username} / ${DEMO_THERAPIST.password}`);
} else {
  console.log("   • demo hesabı zaten var");
}

/* 2 — Bu terapiste ait eski demo verisini temizle (yeniden çalıştırılabilirlik) */
const existingClients = await sql.query(
  "SELECT id::text FROM client_profiles WHERE display_name = ANY($1)",
  [CLIENTS.map((c) => c.displayName)],
);
const oldIds = existingClients.map((r) => r.id);
if (oldIds.length) {
  await sql.query("DELETE FROM session_runs WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM client_notes  WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM client_goals  WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM weekly_plans  WHERE client_id = ANY($1)", [oldIds]);
  await sql.query("DELETE FROM client_profiles WHERE id = ANY($1)", [oldIds]);
  console.log(`   • önceki demo verisi temizlendi (${oldIds.length} danışan)`);
}

/* 2b — Seed listesinde olmayan aktif danışanları arşivle.
   Geliştirme sırasında elle açılmış test kayıtları ("Deniz", "Kaan T." gibi)
   demo listesinde dolaşıyor, öneri motorunu "140 gündür seans görmedi" gibi
   çöp uyarılarla dolduruyordu. Silmiyoruz — arşiv geri alınabilir; gerçek
   bir kayıt yanlışlıkla yakalanırsa arşivden çıkarmak yeterli. */
const strays = await sql.query(
  "SELECT id::text, display_name FROM client_profiles WHERE archived_at IS NULL AND NOT (display_name = ANY($1))",
  [CLIENTS.map((c) => c.displayName)],
);
if (strays.length) {
  await sql.query(
    "UPDATE client_profiles SET archived_at = NOW() WHERE id = ANY($1)",
    [strays.map((r) => r.id)],
  );
  console.log(`   • seed dışı ${strays.length} danışan arşivlendi: ${strays.map((r) => r.display_name).join(", ")}`);
}

/* 2c — İsteğe bağlı: arşivlenmiş eski test kayıtlarının verisini sil. */
if (PURGE_LEGACY) {
  const legacy = await sql.query(
    `SELECT id::text, display_name FROM client_profiles
     WHERE archived_at IS NOT NULL AND display_name <> ALL($1)`,
    [CLIENTS.map((c) => c.displayName)],
  );
  const ids = legacy.map((r) => r.id);
  if (ids.length) {
    const [{ count: sessions }] = await sql.query(
      "SELECT COUNT(*)::int AS count FROM session_runs WHERE client_id = ANY($1)", [ids],
    );
    await sql.query("DELETE FROM session_runs WHERE client_id = ANY($1)", [ids]);
    await sql.query("DELETE FROM client_notes  WHERE client_id = ANY($1)", [ids]);
    await sql.query("DELETE FROM client_goals  WHERE client_id = ANY($1)", [ids]);
    await sql.query("DELETE FROM weekly_plans  WHERE client_id = ANY($1)", [ids]);
    await sql.query("DELETE FROM client_profiles WHERE id = ANY($1)", [ids]);
    console.log(`   • eski test kayıtları silindi: ${legacy.map((r) => r.display_name).join(", ")} (${sessions} seans)`);
  } else {
    console.log("   • silinecek eski test kaydı yok");
  }
}

/* 3 — Danışanlar, seanslar, hedefler, notlar */
const now = new Date();
const clientIds = new Map();
let sessionCount = 0;

for (let ci = 0; ci < CLIENTS.length; ci += 1) {
  const c = CLIENTS[ci];
  const rand = rng(1000 + ci * 977);

  const [row] = await sql.query(
    `INSERT INTO client_profiles (display_name, age_group, primary_goal, support_level, difficulty_level, tags, birth_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id::text`,
    [c.displayName, c.ageGroup, c.primaryGoal, c.supportLevel, c.difficultyLevel, c.tags, c.birthDate],
  );
  clientIds.set(c.displayName, row.id);

  /* Seanslar — en eskiden yeniye, ~2,5 günde bir. Tarihler saklanıyor ki
     notlar gerçek seans günlerine bağlanabilsin. */
  const sessionDates = [];
  for (let i = 0; i < c.sessions; i += 1) {
    const fromEnd = c.sessions - 1 - i;
    const playedAt = new Date(now.getTime() - (c.idleDays + fromEnd * 2.5) * DAY);
    playedAt.setHours(9 + ((i * 3) % 8), (i % 4) * 15, 0, 0);

    const gameKey = c.games[i % c.games.length];
    const score = scoreCurve(c, i, c.sessions, rand);

    /* Seans sonu ekranındaki yıldız değerlendirmesi ara sıra doldurulmuş
       olsun — her seansta olması gerçekçi değil, hiç olmaması da. */
    const metadata = rand() < 0.4
      ? { satisfactionRating: score >= 75 ? 5 : score >= 60 ? 4 : 3 }
      : {};

    /* Gözlem satırı üç seansta bire yakın; metin skorun bandından seçilir. */
    const band = score >= 78 ? "high" : score >= 58 ? "mid" : "low";
    const pool = SESSION_NOTES[band];
    const sessionNote = rand() < 0.34 ? pool[Math.floor(rand() * pool.length)] : null;

    await sql.query(
      `INSERT INTO session_runs
        (therapist_id, therapist_name, client_id, client_name, game_key, game_label, score, source, played_at, duration_seconds, session_note, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)`,
      [
        therapistId, THERAPIST.displayName, row.id, c.displayName,
        gameKey, GAMES[gameKey].label, score, "seed",
        playedAt.toISOString(), 240 + Math.round(rand() * 360),
        sessionNote,
        JSON.stringify(metadata),
      ],
    );
    sessionDates.push(playedAt);
    sessionCount += 1;
  }

  for (let gi = 0; gi < c.goals.length; gi += 1) {
    const g = c.goals[gi];
    await sql.query(
      `INSERT INTO client_goals (client_id, therapist_id, title, description, target_value, current_value, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.id, therapistId, g.title, g.description, g.target, g.current, goalDeadline(g, gi, rand)],
    );
  }

  /*
   * Notlar SOAP olarak yazılıyor: Seans Sonu ve Seans Notları ekranlarının
   * ikisi de bu formatın üstüne kurulu, demo veri onu göstermeli.
   *
   * Her not gerçek bir seans gününe bağlanır (son seanstan geriye ~3 seans
   * arayla): Seans Notları ekranı notu aynı güne düşen seansın skoru ve
   * oyunuyla eşleştiriyor — havada duran tarihlerle o bağ hiç kurulmuyordu.
   */
  for (let ni = 0; ni < c.notes.length; ni += 1) {
    const sessionIdx = Math.max(0, sessionDates.length - 1 - ni * 3);
    const d = new Date(sessionDates[sessionIdx].getTime() + 30 * 60000);
    const n = c.notes[ni];
    const flat = [n.s, n.o, n.a, n.p].filter((x) => x && x !== "—").join(" ");
    await sql.query(
      `INSERT INTO client_notes (client_id, therapist_id, date, content, note_mode, soap_content, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [row.id, therapistId, isoDate(d), flat, "soap", JSON.stringify(n), d.toISOString()],
    );
  }

  /*
   * Serbest kipli not.
   *
   * Notların 19'unun 19'u SOAP'tı; Seans Notları ekranı iki kipi de
   * destekliyor ama `free` kipini hiçbir kayıt göstermiyordu — kip
   * değiştirici boş bir durumu açıyordu. Her danışana bir serbest not:
   * SOAP'a sığmayan, aile görüşmesi / kurum yazışması gibi kayıtlar.
   */
  if (c.freeNote && sessionDates.length > 1) {
    const fd = new Date(sessionDates[Math.floor(sessionDates.length / 2)].getTime() + 90 * 60000);
    await sql.query(
      `INSERT INTO client_notes (client_id, therapist_id, date, content, note_mode, soap_content, created_at)
       VALUES ($1,$2,$3,$4,'free',NULL,$5)`,
      [row.id, therapistId, isoDate(fd), c.freeNote, fd.toISOString()],
    );
  }
}

console.log(`   • ${CLIENTS.length} danışan, ${sessionCount} seans, hedefler ve notlar yazıldı`);

/* 4 — Bu haftanın takvimi.
   Saatler çakışmasın diye danışan başına sabit bir slot veriliyor; Haftalık
   Plan ekranı bloğu saate göre sıralıyor, Bugün ekranı da çizelgeyi buradan
   kuruyor. Mert Yiğit bilinçli olarak plansız: "boş slot" önerisi görünsün. */
const weekStart = startOfWeek(now);
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const emptyWeek = () => ({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });

const SCHEDULE = {
  "Ela Selin":    [["mon", "09:30", "memory"], ["wed", "09:30", "pairs"], ["fri", "09:30", "logic"]],
  "Tuna Akarsu":  [["mon", "11:00", "pulse"], ["thu", "11:00", "route"]],
  "Asya Demir":   [["tue", "14:00", "scan"], ["fri", "14:00", "difference"]],
  "Mina Yıldız":  [["wed", "13:00", "difference"], ["sat", "10:30", "pairs"]],
  "Kerem Arslan": [["tue", "15:30", "logic"], ["thu", "15:30", "memory"]],
  "Derin Kaya":   [["mon", "14:00", "pulse"], ["wed", "15:30", "route"]],
  "Zeynep Ada":   [["thu", "09:30", "pairs"], ["sat", "11:30", "difference"]],
};

/*
 * Beş hafta yazılıyor: üç geçmiş, bu hafta, bir gelecek.
 *
 * Önce yalnızca bu hafta vardı. Haftalık Plan ekranının hafta gezinme okları
 * her iki yönde de boş bir takvim açıyor, İlerleme Raporu'nun "Son 30 gün /
 * Son 90 gün" aralıkları da plan bağlamı olmadan okunuyordu. Geçmiş
 * haftaların blokları tamamlanmış, gelecek hafta tümüyle planlı.
 *
 * Doluluk haftadan haftaya değişiyor (`drop`): sabit yoğunluk takvimi
 * kopyala-yapıştır gösteriyor, üstelik "kapasite %60" gibi ölçüler her
 * hafta aynı çıkınca anlamsızlaşıyordu.
 *
 * `drop` bir olasılık, sabit sayı değil. Sabit sayıyken iki-üç slotu olan
 * danışanların takvimi tümüyle boşalıyor, hafta 7 danışana 3 blok düşüyordu:
 * bu çeşitlilik değil, bozuk görünüyor. Her danışanda en az bir blok kalır.
 */
const WEEK_PLAN = [
  { offset: -3, drop: 0.25 },
  { offset: -2, drop: 0.1 },
  { offset: -1, drop: 0.2 },
  { offset: 0, drop: 0 },
  { offset: 1, drop: 0.15 },
];

const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let blockCount = 0;
let weekCount = 0;

for (const { offset, drop } of WEEK_PLAN) {
  const ws = new Date(weekStart.getTime() + offset * 7 * DAY);
  const wrand = rng(7000 + offset * 131);

  for (const [name, slots] of Object.entries(SCHEDULE)) {
    const clientId = clientIds.get(name);
    if (!clientId) continue;
    const days = emptyWeek();
    const client = CLIENTS.find((c) => c.displayName === name);

    /* Hangi bloğun düşeceği tohumdan gelir ki her çalıştırmada aynı takvim
       çıksın. En az bir blok her zaman kalır. */
    const skip = new Set();
    slots.forEach((_, si) => {
      if (skip.size < slots.length - 1 && wrand() < drop) skip.add(si);
    });

    slots.forEach(([day, time, gameKey], si) => {
      if (skip.has(si)) return;
      const dayDate = new Date(ws.getTime() + DAY_KEYS.indexOf(day) * DAY);
      const past = dayDate < today;
      days[day].push({ gameKey, goal: client?.primaryGoal ?? "", time, ...(past ? { completed: true } : {}) });
      blockCount += 1;
    });

    await sql.query(
      `INSERT INTO weekly_plans (client_id, therapist_id, week_start_date, days, updated_at)
       VALUES ($1,$2,$3,$4::jsonb,NOW())
       ON CONFLICT (client_id, week_start_date) DO UPDATE SET days = EXCLUDED.days, updated_at = NOW()`,
      [clientId, therapistId, isoDate(ws), JSON.stringify(days)],
    );
  }
  weekCount += 1;
}

console.log(`   • ${weekCount} haftaya ${blockCount} seans bloğu planlandı (${isoDate(new Date(weekStart.getTime() - 21 * DAY))} → ${isoDate(new Date(weekStart.getTime() + 7 * DAY))})`);

console.log("\n🎉  Demo verisi hazır.");
if (therapistExisted) {
  /* Var olan hesabın şifresine dokunmuyoruz; burada sabit bir parola
     yazdırmak yanıltıcı olurdu. */
  console.log(`    Giriş: ${THERAPIST.username} — mevcut şifrenizle (seed şifreyi değiştirmedi).`);
  console.log("    Şifreyi sıfırlamak isterseniz: node scripts/seed-demo.mjs --set-password");
} else {
  console.log(`    Giriş: ${THERAPIST.username} / ${THERAPIST.password}`);
}
if (!PURGE_LEGACY) {
  console.log("    Eski test danışanlarının kayıtlarını temizlemek için: node scripts/seed-demo.mjs --purge-legacy");
}
