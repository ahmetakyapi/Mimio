// ── Structured Activity Recommendation & Support Program System ──
// Evidence-based occupational therapy practice areas, activities, game mappings, and plan templates.

import type { PlatformGameKey } from "./platform-data";

// ── Domain Types ──

export type TherapyDomainKey =
  | "pediatric"
  | "mental-health"
  | "neurological"
  | "neurodiversity"
  | "geriatric"
  | "work-productivity"
  | "community-social";

export type DifficultyLevel = "kolay" | "orta" | "zor";
export type IndependenceLevel = "tam_bağımlı" | "fiziksel_yardım" | "sözel_ipucu" | "gözetim" | "bağımsız";
export type EnvironmentType = "ev" | "okul" | "klinik" | "iş_yeri" | "toplum";
export type AgeGroupKey = "0-3" | "3-6" | "6-12" | "12-18" | "18-30" | "30-50" | "50-65" | "65+";
export type TherapyFrequency = "haftada_1" | "haftada_2" | "haftada_3" | "günlük";
export type GameTherapyPurpose =
  | "dikkat"
  | "hafıza"
  | "yürütücü_işlev"
  | "görsel_algı"
  | "duygu_tanıma"
  | "sıralama"
  | "planlama"
  | "el_göz_koordinasyonu"
  | "tepki_hızı";

export type ProgressMetric = "hedef_tamamlanma" | "katılım_düzeyi" | "bağımsızlık_skoru" | "haftalık_değerlendirme";

// ── Interfaces ──

export interface TherapyGoal {
  id: string;
  label: string;
  description: string;
}

export interface FunctionalChallenge {
  id: string;
  label: string;
}

export interface SubSkill {
  id: string;
  label: string;
  description: string;
}

export interface TherapyActivity {
  id: string;
  label: string;
  subSkill: string;
  activityType: string;
  description: string;
  difficulty: DifficultyLevel;
  sessionMinutes: number;
  materials: string[];
  homeExercise: boolean;
  goals: string[];
}

export interface GameMapping {
  gameKey: PlatformGameKey;
  purposes: GameTherapyPurpose[];
  suitableDomains: TherapyDomainKey[];
  difficultyFit: DifficultyLevel[];
  therapeuticRationale: string;
}

export interface TherapyDomain {
  key: TherapyDomainKey;
  label: string;
  icon: string;
  color: string;
  description: string;
  goals: TherapyGoal[];
  challenges: FunctionalChallenge[];
  subSkills: SubSkill[];
  activities: TherapyActivity[];
  suitableAgeGroups: AgeGroupKey[];
}

export interface WeeklyPlanTemplate {
  mainGoal: string;
  keyActivities: string[];
  digitalGames: PlatformGameKey[];
  homeExercise: string;
  sessionNotes: string;
}

export interface DayPlanTemplate {
  dayLabel: string;
  activity: string;
  game: PlatformGameKey;
  observation: string;
}

export interface TherapyPlanSuggestion {
  domainKey: TherapyDomainKey;
  weeklyPlan: WeeklyPlanTemplate;
  dailyStructure: DayPlanTemplate[];
}

export interface ClientTherapyProfile {
  ageGroup: AgeGroupKey;
  therapyArea: TherapyDomainKey;
  functionalChallenges: string[];
  independenceLevel: IndependenceLevel;
  environment: EnvironmentType[];
  interests: string[];
  therapyFrequency: TherapyFrequency;
}

export interface ProgressEntry {
  id: string;
  clientId: string;
  date: string;
  goalId: string;
  metric: ProgressMetric;
  value: number; // 0-100 scale
  note: string;
}

// ── Game Therapy Mapping ──

export const GAME_THERAPY_MAPPINGS: GameMapping[] = [
  {
    gameKey: "memory",
    purposes: ["hafıza", "sıralama", "dikkat"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "geriatric", "mental-health"],
    difficultyFit: ["kolay", "orta", "zor"],
    therapeuticRationale: "Çalışma belleği, sıralama becerisi ve sürdürülebilir dikkat geliştirmek için ideal. Sekans uzunluğu arttıkça zorluk kademeli olarak yükselir.",
  },
  {
    gameKey: "pairs",
    purposes: ["hafıza", "görsel_algı", "planlama"],
    suitableDomains: ["pediatric", "neurological", "geriatric", "neurodiversity"],
    difficultyFit: ["kolay", "orta"],
    therapeuticRationale: "Görsel-mekansal bellek, eşleştirme ve stratejik düşünme becerilerini geliştirir. Kart konumlarını hatırlama ve sistematik arama stratejisi gerektirir.",
  },
  {
    gameKey: "pulse",
    purposes: ["el_göz_koordinasyonu", "tepki_hızı", "dikkat"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "work-productivity"],
    difficultyFit: ["orta", "zor"],
    therapeuticRationale: "Motor planlama, hedefleme doğruluğu ve tepki zamanlamasını çalıştırır. Ritim ve seri performansı birlikte ölçer.",
  },
  {
    gameKey: "route",
    purposes: ["planlama", "yürütücü_işlev", "el_göz_koordinasyonu"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "geriatric"],
    difficultyFit: ["orta", "zor"],
    therapeuticRationale: "Yön komutu işleme, motor yanıt seçimi ve hızlı karar verme becerilerini geliştirir. Yürütücü işlev bileşenlerini güçlendirir.",
  },
  {
    gameKey: "difference",
    purposes: ["görsel_algı", "dikkat"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "geriatric", "community-social"],
    difficultyFit: ["kolay", "orta"],
    therapeuticRationale: "Görsel ayrım, figür-zemin algısı ve sistematik tarama becerilerini çalıştırır. Detay odaklı dikkat geliştirmede etkilidir.",
  },
  {
    gameKey: "scan",
    purposes: ["dikkat", "görsel_algı", "tepki_hızı"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "work-productivity", "geriatric"],
    difficultyFit: ["orta", "zor"],
    therapeuticRationale: "Seçici dikkat, görsel tarama hızı ve hedef bulma becerilerini geliştirir. Dikkat dağıtıcıları filtreleme kapasitesini artırır.",
  },
];

// ── Therapy Domains ──

export const THERAPY_DOMAINS: TherapyDomain[] = [
  // ─── 1. Pediatrik Ergoterapi ───
  {
    key: "pediatric",
    label: "Pediatrik Ergoterapi",
    icon: "🧒",
    color: "#3b82f6",
    description: "Çocuklarda motor gelişim, duyusal işleme, günlük yaşam becerileri ve oyun katılımını destekleyen terapi yaklaşımı.",
    goals: [
      { id: "ped-g1", label: "İnce motor beceri gelişimi", description: "Kalem tutma, makasla kesme, düğme ilikleme gibi el becerilerini geliştirme" },
      { id: "ped-g2", label: "Duyusal işleme düzenleme", description: "Dokunsal, vestibüler ve proprioseptif duyuları düzenleyerek adaptif yanıtlar oluşturma" },
      { id: "ped-g3", label: "Günlük yaşam aktiviteleri bağımsızlığı", description: "Giyinme, yemek yeme, tuvalet eğitimi gibi öz bakım becerilerinde bağımsızlık kazandırma" },
      { id: "ped-g4", label: "Oyun katılımı ve sosyal etkileşim", description: "Yaşa uygun oyun becerilerini ve akran etkileşimini destekleme" },
      { id: "ped-g5", label: "Görsel-motor entegrasyon", description: "El-göz koordinasyonu ve görsel algı becerilerini uyumlu şekilde çalıştırma" },
    ],
    challenges: [
      { id: "ped-c1", label: "Kalem tutma ve yazı yazma güçlüğü" },
      { id: "ped-c2", label: "Duyusal aşırı/düşük tepki" },
      { id: "ped-c3", label: "Giyinme ve öz bakım becerileri yetersizliği" },
      { id: "ped-c4", label: "Dikkat süresinde kısıtlılık" },
      { id: "ped-c5", label: "Motor koordinasyon bozukluğu" },
      { id: "ped-c6", label: "Akran etkileşiminde zorluk" },
    ],
    subSkills: [
      { id: "ped-s1", label: "İnce motor", description: "Parmak kuvveti, kavrama kalıpları, bimanüel koordinasyon" },
      { id: "ped-s2", label: "Kaba motor", description: "Denge, postüral kontrol, bilateral koordinasyon" },
      { id: "ped-s3", label: "Duyusal işleme", description: "Dokunsal ayrım, vestibüler düzenleme, proprioseptif farkındalık" },
      { id: "ped-s4", label: "Görsel algı", description: "Figür-zemin, şekil sabitliği, mekansal ilişkiler" },
      { id: "ped-s5", label: "Öz bakım", description: "Giyinme, yemek yeme, hijyen rutinleri" },
    ],
    activities: [
      { id: "ped-a1", label: "Boncuk dizme", subSkill: "İnce motor", activityType: "Masa başı aktivite", description: "Farklı boyutlardaki boncukları sıraya dizerek parmak kuvveti ve kavrama geliştirme", difficulty: "kolay", sessionMinutes: 10, materials: ["Boncuklar", "İp", "Tepsi"], homeExercise: true, goals: ["ped-g1", "ped-g5"] },
      { id: "ped-a2", label: "Hamur yoğurma ve şekillendirme", subSkill: "İnce motor", activityType: "Duyusal-motor aktivite", description: "Terapi hamuru ile yoğurma, sıkma, kopartma hareketleri yaparak el kaslarını güçlendirme", difficulty: "kolay", sessionMinutes: 15, materials: ["Terapi hamuru", "Kalıplar"], homeExercise: true, goals: ["ped-g1", "ped-g2"] },
      { id: "ped-a3", label: "Duyusal kutu keşfi", subSkill: "Duyusal işleme", activityType: "Duyusal aktivite", description: "Farklı dokuları barındıran kutularda nesneleri bulma ve tanımlama", difficulty: "kolay", sessionMinutes: 15, materials: ["Plastik kutu", "Pirinç/kum", "Küçük nesneler"], homeExercise: true, goals: ["ped-g2"] },
      { id: "ped-a4", label: "Makas ile kesme parkuru", subSkill: "İnce motor", activityType: "Masa başı aktivite", description: "Kalın çizgilerden ince çizgilere doğru ilerlenen kesme alıştırmaları", difficulty: "orta", sessionMinutes: 10, materials: ["Çocuk makası", "Kesme şablonları"], homeExercise: true, goals: ["ped-g1", "ped-g5"] },
      { id: "ped-a5", label: "Denge tahtasında yürüme", subSkill: "Kaba motor", activityType: "Motor aktivite", description: "Denge tahtası üzerinde nesne taşıyarak bilateral koordinasyon ve postüral kontrol çalışma", difficulty: "orta", sessionMinutes: 15, materials: ["Denge tahtası", "Küçük toplar"], homeExercise: false, goals: ["ped-g4", "ped-g5"] },
      { id: "ped-a6", label: "Giyinme sekansı eğitimi", subSkill: "Öz bakım", activityType: "Günlük yaşam pratiği", description: "Adım adım görsel kartlarla giyinme sıralaması öğretimi", difficulty: "orta", sessionMinutes: 20, materials: ["Görsel kartlar", "Kıyafet seti"], homeExercise: true, goals: ["ped-g3"] },
    ],
    suitableAgeGroups: ["0-3", "3-6", "6-12", "12-18"],
  },

  // ─── 2. Ruh Sağlığı Ergoterapisi ───
  {
    key: "mental-health",
    label: "Ruh Sağlığı Ergoterapisi",
    icon: "🧠",
    color: "#8b5cf6",
    description: "Anksiyete, depresyon, stres ve psikiyatrik durumlarda aktivite katılımı ve yaşam kalitesini artıran terapi yaklaşımı.",
    goals: [
      { id: "mh-g1", label: "Duygu düzenleme becerisi", description: "Duyguları tanıma, ifade etme ve uygun başa çıkma stratejileri geliştirme" },
      { id: "mh-g2", label: "Günlük rutin oluşturma", description: "Yapılandırılmış ve anlamlı günlük aktivite rutinleri kurma" },
      { id: "mh-g3", label: "Stres yönetimi", description: "Gevşeme teknikleri, farkındalık ve başa çıkma stratejileri öğretme" },
      { id: "mh-g4", label: "Sosyal katılım artırma", description: "Toplumsal aktivitelere ve sosyal ilişkilere katılımı destekleme" },
      { id: "mh-g5", label: "Öz yeterlilik geliştirme", description: "Aktivite başarıları üzerinden güven ve motivasyon oluşturma" },
    ],
    challenges: [
      { id: "mh-c1", label: "Motivasyon eksikliği ve atalet" },
      { id: "mh-c2", label: "Uyku düzensizliği" },
      { id: "mh-c3", label: "Sosyal izolasyon" },
      { id: "mh-c4", label: "Konsantrasyon bozukluğu" },
      { id: "mh-c5", label: "Günlük aktivitelerde ilgi kaybı" },
    ],
    subSkills: [
      { id: "mh-s1", label: "Duygu farkındalığı", description: "Duyguları tanıma, isimlendirme ve yoğunluk derecelendirme" },
      { id: "mh-s2", label: "Başa çıkma stratejileri", description: "Stresle başa çıkma, gevşeme ve dikkat yönlendirme teknikleri" },
      { id: "mh-s3", label: "Aktivite planlama", description: "Gün içi aktivite dengeleme ve zaman yönetimi" },
      { id: "mh-s4", label: "Sosyal beceri", description: "İletişim, empati ve grup etkileşimi" },
    ],
    activities: [
      { id: "mh-a1", label: "Duygu termometresi", subSkill: "Duygu farkındalığı", activityType: "Psiko-eğitim", description: "Günlük duygu durumunu 1-10 skalasında değerlendirme ve tetikleyicileri belirleme", difficulty: "kolay", sessionMinutes: 10, materials: ["Duygu kartları", "Günlük defteri"], homeExercise: true, goals: ["mh-g1"] },
      { id: "mh-a2", label: "Haftalık aktivite planı", subSkill: "Aktivite planlama", activityType: "Yapılandırılmış planlama", description: "Anlamlı, haz veren ve zorunlu aktiviteleri dengeleyerek haftalık takvim oluşturma", difficulty: "orta", sessionMinutes: 20, materials: ["Haftalık planlayıcı", "Aktivite kartları"], homeExercise: true, goals: ["mh-g2", "mh-g5"] },
      { id: "mh-a3", label: "Solunum ve gevşeme egzersizi", subSkill: "Başa çıkma stratejileri", activityType: "Gevşeme", description: "4-7-8 solunum tekniği ve kas gevşetme yöntemleri", difficulty: "kolay", sessionMinutes: 15, materials: [], homeExercise: true, goals: ["mh-g3"] },
      { id: "mh-a4", label: "Sanat terapisi — serbest resim", subSkill: "Duygu farkındalığı", activityType: "Yaratıcı aktivite", description: "Duygusal durumu yansıtan serbest çizim ve renk kullanımı", difficulty: "kolay", sessionMinutes: 25, materials: ["Kağıt", "Boya kalemleri", "Pastel boyalar"], homeExercise: true, goals: ["mh-g1", "mh-g5"] },
      { id: "mh-a5", label: "Grup sohbet çemberi", subSkill: "Sosyal beceri", activityType: "Grup aktivitesi", description: "Yapılandırılmış konularda paylaşım ve dinleme pratiği", difficulty: "orta", sessionMinutes: 30, materials: ["Konu kartları"], homeExercise: false, goals: ["mh-g4"] },
    ],
    suitableAgeGroups: ["12-18", "18-30", "30-50", "50-65", "65+"],
  },

  // ─── 3. Nörolojik Rehabilitasyon ───
  {
    key: "neurological",
    label: "Nörolojik Rehabilitasyon",
    icon: "⚡",
    color: "#f59e0b",
    description: "İnme, travmatik beyin hasarı ve nörodejeneratif hastalıklarda fonksiyonel bağımsızlığı yeniden kazandırmayı amaçlayan terapi.",
    goals: [
      { id: "nr-g1", label: "Üst ekstremite fonksiyonunu yeniden kazanma", description: "Etkilenen kol ve el fonksiyonlarını tedavi edici aktivitelerle geri kazandırma" },
      { id: "nr-g2", label: "Bilişsel fonksiyonları iyileştirme", description: "Dikkat, hafıza, yürütücü işlevler ve problem çözme becerilerini güçlendirme" },
      { id: "nr-g3", label: "Günlük yaşam bağımsızlığı", description: "Öz bakım, ev yönetimi ve toplum katılımında bağımsızlık düzeyini artırma" },
      { id: "nr-g4", label: "Görsel-algısal iyileşme", description: "Görsel alan kaybı, ihmal ve algısal bozuklukları rehabilite etme" },
    ],
    challenges: [
      { id: "nr-c1", label: "Tek taraflı ihmal (neglect)" },
      { id: "nr-c2", label: "Üst ekstremite parezi / parezisi" },
      { id: "nr-c3", label: "Bilişsel yavaşlama" },
      { id: "nr-c4", label: "Afazi / iletişim güçlüğü" },
      { id: "nr-c5", label: "Transfer ve mobilite kısıtlılığı" },
    ],
    subSkills: [
      { id: "nr-s1", label: "Kuvvet ve hareket genişliği", description: "Kas gücü, eklem hareket açıklığı ve dayanıklılık" },
      { id: "nr-s2", label: "Bilateral koordinasyon", description: "Her iki elin birlikte kullanımı ve etkilenen tarafın katılımı" },
      { id: "nr-s3", label: "Bilişsel rehabilitasyon", description: "Dikkat, hafıza, problem çözme ve yürütücü işlev çalışmaları" },
      { id: "nr-s4", label: "Görsel-algısal iyileşme", description: "Görsel tarama, mekansal farkındalık ve ihmal tedavisi" },
    ],
    activities: [
      { id: "nr-a1", label: "Kısıtlama kaynaklı hareket terapisi (CIMT)", subSkill: "Kuvvet ve hareket genişliği", activityType: "Motor rehabilitasyon", description: "Etkilenmemiş eli kısıtlayarak etkilenen elin yoğun kullanımını sağlama", difficulty: "zor", sessionMinutes: 30, materials: ["Kısıtlama eldiveni", "Fonksiyonel nesneler"], homeExercise: false, goals: ["nr-g1"] },
      { id: "nr-a2", label: "Masaüstü dikkat eğitimi", subSkill: "Bilişsel rehabilitasyon", activityType: "Bilişsel aktivite", description: "Renkli kartlarla dikkat, sıralama ve kategorizasyon çalışmaları", difficulty: "orta", sessionMinutes: 20, materials: ["Dikkat kartları", "Zamanlayıcı"], homeExercise: true, goals: ["nr-g2"] },
      { id: "nr-a3", label: "Görsel tarama çalışması", subSkill: "Görsel-algısal iyileşme", activityType: "Algısal rehabilitasyon", description: "Soldan sağa sistematik tarama eğitimi; işaretleme ve okuma egzersizleri", difficulty: "orta", sessionMinutes: 15, materials: ["Tarama yaprakları", "İşaretleyici kalem"], homeExercise: true, goals: ["nr-g4"] },
      { id: "nr-a4", label: "Mutfak simülasyonu", subSkill: "Bilateral koordinasyon", activityType: "Günlük yaşam pratiği", description: "Basit yemek hazırlama adımlarını iki elle gerçekleştirme", difficulty: "zor", sessionMinutes: 30, materials: ["Mutfak malzemeleri", "Adaptif ekipman"], homeExercise: true, goals: ["nr-g1", "nr-g3"] },
    ],
    suitableAgeGroups: ["18-30", "30-50", "50-65", "65+"],
  },

  // ─── 4. Nöroçeşitlilik / Otizm / Öğrenme Güçlüğü ───
  {
    key: "neurodiversity",
    label: "Nöroçeşitlilik ve Otizm",
    icon: "🌈",
    color: "#06b6d4",
    description: "Otizm spektrum, DEHB, öğrenme güçlüğü gibi nörogelişimsel farklılıklarda katılım ve bağımsızlığı destekleyen terapi.",
    goals: [
      { id: "nd-g1", label: "Duyusal düzenleme", description: "Duyusal işleme farklılıklarını yönetme ve adaptif yanıtlar geliştirme" },
      { id: "nd-g2", label: "Sosyal iletişim becerisi", description: "Sıra bekleme, paylaşma, göz teması ve konuşma başlatma becerileri" },
      { id: "nd-g3", label: "Yürütücü işlev güçlendirme", description: "Planlama, organizasyon, esnek düşünme ve inhibisyon kontrolü" },
      { id: "nd-g4", label: "Akademik katılım", description: "Sınıf içi dikkat, yazma, okuma ve ödev rutinlerini destekleme" },
      { id: "nd-g5", label: "Geçiş ve rutin yönetimi", description: "Aktiviteler arası geçişleri kolaylaştırma ve değişime uyum" },
    ],
    challenges: [
      { id: "nd-c1", label: "Duyusal aşırı yüklenme" },
      { id: "nd-c2", label: "Sosyal ipuçlarını okuma güçlüğü" },
      { id: "nd-c3", label: "Dikkat dağınıklığı ve dürtüsellik" },
      { id: "nd-c4", label: "Rutin değişikliklerine tepki" },
      { id: "nd-c5", label: "İnce motor ve yazma güçlüğü" },
    ],
    subSkills: [
      { id: "nd-s1", label: "Duyusal diyet uygulaması", description: "Bireysel duyusal ihtiyaçlara uygun aktivite programı" },
      { id: "nd-s2", label: "Görsel destek kullanımı", description: "Görsel takvim, sosyal hikaye ve adım kartları" },
      { id: "nd-s3", label: "Dikkat ve inhibisyon", description: "Seçici dikkat, sürdürülebilir dikkat ve dürtü kontrolü" },
      { id: "nd-s4", label: "Sosyal oyun becerisi", description: "Yapılandırılmış oyun senaryoları ve akran etkileşimi" },
    ],
    activities: [
      { id: "nd-a1", label: "Duyusal devre (sensory circuit)", subSkill: "Duyusal diyet uygulaması", activityType: "Duyusal-motor", description: "Uyarıcı→düzenleyici→sakinleştirici aktivite dizisi: zıplama, ağır yorgan, derin nefes", difficulty: "kolay", sessionMinutes: 15, materials: ["Trambolin", "Ağırlıklı battaniye", "Zamanlayıcı"], homeExercise: true, goals: ["nd-g1"] },
      { id: "nd-a2", label: "Sosyal hikaye oluşturma", subSkill: "Görsel destek kullanımı", activityType: "Psiko-eğitim", description: "Belirli bir sosyal durum için adım adım görsel hikaye kartları hazırlama", difficulty: "orta", sessionMinutes: 20, materials: ["Hikaye şablonları", "Resim kartları"], homeExercise: true, goals: ["nd-g2", "nd-g5"] },
      { id: "nd-a3", label: "Dur ve düşün oyunu", subSkill: "Dikkat ve inhibisyon", activityType: "Bilişsel aktivite", description: "Sinyal kartlarıyla aksiyon al / dur komutları verilen inhibisyon çalışması", difficulty: "orta", sessionMinutes: 15, materials: ["Sinyal kartları", "Ses efektleri"], homeExercise: false, goals: ["nd-g3"] },
      { id: "nd-a4", label: "Lego sosyal kulüp", subSkill: "Sosyal oyun becerisi", activityType: "Grup aktivitesi", description: "Mühendis-tedarikçi-inşaatçı rolleriyle yapılandırılmış işbirliği", difficulty: "orta", sessionMinutes: 30, materials: ["Lego seti", "Rol kartları"], homeExercise: false, goals: ["nd-g2"] },
      { id: "nd-a5", label: "Dijital dikkat çalışması", subSkill: "Dikkat ve inhibisyon", activityType: "Dijital oyun", description: "Platform oyunları ile seçici dikkat ve sürdürülebilir dikkat çalışması", difficulty: "kolay", sessionMinutes: 10, materials: ["Tablet/bilgisayar"], homeExercise: true, goals: ["nd-g3", "nd-g4"] },
    ],
    suitableAgeGroups: ["0-3", "3-6", "6-12", "12-18", "18-30"],
  },

  // ─── 5. Geriatrik Ergoterapi ───
  {
    key: "geriatric",
    label: "Geriatrik Ergoterapi",
    icon: "🏠",
    color: "#10b981",
    description: "Yaşlanmaya bağlı fonksiyonel kayıpları azaltma, düşme riskini yönetme ve yaşam kalitesini korumaya yönelik terapi.",
    goals: [
      { id: "ge-g1", label: "Düşme riskini azaltma", description: "Denge eğitimi, ev düzenlemesi ve güvenli hareket stratejileri" },
      { id: "ge-g2", label: "Bilişsel fonksiyonu koruma", description: "Hafıza, dikkat ve yürütücü işlev egzersizleri ile bilişsel gerilemeyi yavaşlatma" },
      { id: "ge-g3", label: "Günlük yaşam bağımsızlığı", description: "Adaptif ekipman kullanımı ve enerji koruma teknikleri" },
      { id: "ge-g4", label: "Sosyal katılımı sürdürme", description: "Anlamlı aktivitelere ve toplum yaşamına aktif katılımı destekleme" },
    ],
    challenges: [
      { id: "ge-c1", label: "Denge ve koordinasyon kaybı" },
      { id: "ge-c2", label: "Hafıza ve dikkat azalması" },
      { id: "ge-c3", label: "El kuvveti ve kavrama güçlüğü" },
      { id: "ge-c4", label: "Enerji/dayanıklılık azalması" },
      { id: "ge-c5", label: "Sosyal izolasyon" },
    ],
    subSkills: [
      { id: "ge-s1", label: "Denge ve mobilite", description: "Oturma-kalkma, yürüme ve merdiven güvenliği" },
      { id: "ge-s2", label: "Bilişsel stimülasyon", description: "Hafıza oyunları, kelime bulmaca, hesaplama" },
      { id: "ge-s3", label: "Enerji koruma", description: "Aktivite analizi ve yönetimi, tempolu çalışma" },
      { id: "ge-s4", label: "El fonksiyonu", description: "Kavrama kuvveti, manipülasyon ve koordinasyon" },
    ],
    activities: [
      { id: "ge-a1", label: "Sandalyede egzersiz programı", subSkill: "Denge ve mobilite", activityType: "Fiziksel aktivite", description: "Oturarak yapılan güçlendirme ve esneklik egzersizleri", difficulty: "kolay", sessionMinutes: 20, materials: ["Sandalye", "Hafif ağırlıklar"], homeExercise: true, goals: ["ge-g1"] },
      { id: "ge-a2", label: "Dijital hafıza oyunları", subSkill: "Bilişsel stimülasyon", activityType: "Dijital oyun", description: "Kart eşleme, sıra hatırlama ve hedef bulma oyunlarıyla bilişsel çalışma", difficulty: "kolay", sessionMinutes: 15, materials: ["Tablet/bilgisayar"], homeExercise: true, goals: ["ge-g2"] },
      { id: "ge-a3", label: "Mutfak güvenliği eğitimi", subSkill: "Enerji koruma", activityType: "Günlük yaşam pratiği", description: "Güvenli mutfak kullanımı, adaptif ekipman tanıtımı ve enerji yönetimi", difficulty: "orta", sessionMinutes: 25, materials: ["Adaptif ekipman seti"], homeExercise: true, goals: ["ge-g3"] },
      { id: "ge-a4", label: "El kuvveti programı", subSkill: "El fonksiyonu", activityType: "Motor rehabilitasyon", description: "Terapi hamuru, kavrama egzersizleri ve manipülasyon çalışmaları", difficulty: "kolay", sessionMinutes: 15, materials: ["Terapi hamuru", "Kavrama aracı"], homeExercise: true, goals: ["ge-g1", "ge-g3"] },
    ],
    suitableAgeGroups: ["65+", "50-65"],
  },

  // ─── 6. İş/Üretkenlik ve Okul Katılımı ───
  {
    key: "work-productivity",
    label: "İş & Okul Katılımı",
    icon: "💼",
    color: "#ec4899",
    description: "İş yerinde verimlilik, ergonomik düzenleme, akademik performans ve meslek rehabilitasyonunu destekleyen terapi.",
    goals: [
      { id: "wp-g1", label: "İş yeri/okul performansını artırma", description: "Dikkat süresi, organizasyon ve görev tamamlama becerilerini geliştirme" },
      { id: "wp-g2", label: "Ergonomik düzenleme", description: "Çalışma istasyonu, oturma pozisyonu ve enerji yönetimi düzenlemeleri" },
      { id: "wp-g3", label: "Zaman yönetimi", description: "Önceliklendirme, planlama ve son tarih yönetimi stratejileri" },
      { id: "wp-g4", label: "Stres ve yorgunluk yönetimi", description: "İş/okul stresini ve tükenmişliği azaltma teknikleri" },
    ],
    challenges: [
      { id: "wp-c1", label: "Dikkat ve konsantrasyon eksikliği" },
      { id: "wp-c2", label: "Ergonomik sorunlar ve ağrı" },
      { id: "wp-c3", label: "Zaman yönetimi güçlüğü" },
      { id: "wp-c4", label: "İşe/okula devamsızlık" },
    ],
    subSkills: [
      { id: "wp-s1", label: "Görev analizi", description: "Karmaşık görevleri alt adımlara bölme ve önceliklendirme" },
      { id: "wp-s2", label: "Çevre düzenleme", description: "Ergonomik ayarlamalar ve dikkat destekleyici ortam tasarımı" },
      { id: "wp-s3", label: "Planlama ve organizasyon", description: "Ajanda kullanımı, kontrol listeleri ve hatırlatıcı sistemler" },
    ],
    activities: [
      { id: "wp-a1", label: "Pomodoro tekniği uygulaması", subSkill: "Görev analizi", activityType: "Zaman yönetimi", description: "25 dakika odaklı çalışma + 5 dakika mola döngüsü ile görev tamamlama", difficulty: "kolay", sessionMinutes: 30, materials: ["Zamanlayıcı", "Görev listesi"], homeExercise: true, goals: ["wp-g1", "wp-g3"] },
      { id: "wp-a2", label: "İstasyon ergonomisi değerlendirmesi", subSkill: "Çevre düzenleme", activityType: "Ergonomik değerlendirme", description: "Masa, sandalye, ekran pozisyonu ve aydınlatma düzenlemeleri", difficulty: "orta", sessionMinutes: 30, materials: ["Değerlendirme formu", "Ölçüm araçları"], homeExercise: false, goals: ["wp-g2"] },
      { id: "wp-a3", label: "Haftalık planlayıcı oluşturma", subSkill: "Planlama ve organizasyon", activityType: "Yapılandırılmış planlama", description: "Renk kodlu haftalık takvim ile görev/aktivite/mola dengeleme", difficulty: "kolay", sessionMinutes: 20, materials: ["Planlayıcı", "Renkli kalemler"], homeExercise: true, goals: ["wp-g3"] },
    ],
    suitableAgeGroups: ["6-12", "12-18", "18-30", "30-50"],
  },

  // ─── 7. Toplum ve Sosyal Katılım ───
  {
    key: "community-social",
    label: "Toplum ve Sosyal Katılım",
    icon: "🤝",
    color: "#f97316",
    description: "Bireylerin toplumsal yaşama aktif katılımını, sosyal rolleri sürdürmesini ve toplumsal engelleri aşmasını destekleyen terapi.",
    goals: [
      { id: "cs-g1", label: "Toplumsal erişim becerisi", description: "Toplu taşıma, alışveriş, banka işlemleri gibi toplum içi görevleri bağımsız gerçekleştirme" },
      { id: "cs-g2", label: "Sosyal rol performansı", description: "Aile, iş ve toplum içi rolleri sürdürme ve geliştirme" },
      { id: "cs-g3", label: "Boş zaman aktivitesi planlama", description: "İlgi alanlarına uygun anlamlı serbest zaman aktiviteleri belirleme" },
      { id: "cs-g4", label: "Savunuculuk ve öz-belirleme", description: "Kendi ihtiyaçlarını ifade etme ve hak savunuculuğu" },
    ],
    challenges: [
      { id: "cs-c1", label: "Toplumsal ortamlarda kaygı" },
      { id: "cs-c2", label: "Erişim engelleri" },
      { id: "cs-c3", label: "Sosyal beceri eksikliği" },
      { id: "cs-c4", label: "Boş zaman etkinliklerinde kısıtlılık" },
    ],
    subSkills: [
      { id: "cs-s1", label: "Toplum navigasyonu", description: "Toplu taşıma kullanımı, yön bulma ve güvenlik farkındalığı" },
      { id: "cs-s2", label: "Para ve alışveriş yönetimi", description: "Bütçe planlama, alışveriş listesi ve para kullanımı" },
      { id: "cs-s3", label: "Boş zaman keşfi", description: "Yeni hobiler deneme, topluluk gruplarına katılma" },
    ],
    activities: [
      { id: "cs-a1", label: "Toplum dışı gezi planlama", subSkill: "Toplum navigasyonu", activityType: "Toplumsal pratik", description: "Markete gitme senaryosu: liste hazırlama, ulaşım planlama, alışveriş ve ödeme", difficulty: "orta", sessionMinutes: 45, materials: ["Alışveriş listesi", "Para/kart"], homeExercise: true, goals: ["cs-g1"] },
      { id: "cs-a2", label: "Hobi keşif atölyesi", subSkill: "Boş zaman keşfi", activityType: "Yaratıcı aktivite", description: "Farklı hobi alanlarını deneme: resim, müzik, bahçecilik, el sanatları", difficulty: "kolay", sessionMinutes: 30, materials: ["Çeşitli malzeme setleri"], homeExercise: true, goals: ["cs-g3"] },
      { id: "cs-a3", label: "Rol yapma — sosyal senaryolar", subSkill: "Para ve alışveriş yönetimi", activityType: "Sosyal beceri çalışması", description: "Günlük sosyal durumları (restoran, banka, doktor) canlandırarak pratik yapma", difficulty: "orta", sessionMinutes: 25, materials: ["Senaryo kartları"], homeExercise: false, goals: ["cs-g1", "cs-g2"] },
    ],
    suitableAgeGroups: ["12-18", "18-30", "30-50", "50-65", "65+"],
  },
];

// ── Helper Functions ──

export function getDomainByKey(key: TherapyDomainKey): TherapyDomain | undefined {
  return THERAPY_DOMAINS.find((d) => d.key === key);
}

export function getGameMappingsForDomain(domainKey: TherapyDomainKey): GameMapping[] {
  return GAME_THERAPY_MAPPINGS.filter((m) => m.suitableDomains.includes(domainKey));
}

export function getActivitiesForDomain(domainKey: TherapyDomainKey): TherapyActivity[] {
  const domain = getDomainByKey(domainKey);
  return domain?.activities ?? [];
}

export function getActivitiesByDifficulty(domainKey: TherapyDomainKey, difficulty: DifficultyLevel): TherapyActivity[] {
  return getActivitiesForDomain(domainKey).filter((a) => a.difficulty === difficulty);
}

export function getHomeExercises(domainKey: TherapyDomainKey): TherapyActivity[] {
  return getActivitiesForDomain(domainKey).filter((a) => a.homeExercise);
}

export function generateWeeklyPlanSuggestion(domainKey: TherapyDomainKey): TherapyPlanSuggestion | null {
  const domain = getDomainByKey(domainKey);
  if (!domain) return null;

  const gameMappings = getGameMappingsForDomain(domainKey);
  const activities = domain.activities;
  const homeExercises = activities.filter((a) => a.homeExercise);

  // Pick top activities
  const keyActivities = activities.slice(0, 3).map((a) => a.label);
  const digitalGames = gameMappings.slice(0, 2).map((m) => m.gameKey);
  const homeEx = homeExercises.length > 0 ? homeExercises[0].label : "Ev programı belirlenecek";

  const weeklyPlan: WeeklyPlanTemplate = {
    mainGoal: domain.goals[0]?.label ?? "Hedef belirlenecek",
    keyActivities,
    digitalGames,
    homeExercise: homeEx,
    sessionNotes: "Danışanın katılımı ve performansı gözlemlenecek.",
  };

  const dayStructure: DayPlanTemplate[] = [
    {
      dayLabel: "Pazartesi",
      activity: activities[0]?.label ?? "Aktivite",
      game: digitalGames[0] ?? "memory",
      observation: "Dikkat ve katılım düzeyi değerlendirilecek.",
    },
    {
      dayLabel: "Çarşamba",
      activity: activities[1]?.label ?? activities[0]?.label ?? "Aktivite",
      game: digitalGames[1] ?? digitalGames[0] ?? "pairs",
      observation: "Performans ve motivasyon kaydedilecek.",
    },
    {
      dayLabel: "Cuma",
      activity: activities[2]?.label ?? activities[0]?.label ?? "Aktivite",
      game: digitalGames[0] ?? "memory",
      observation: "Haftalık ilerleme ve hedef değerlendirmesi yapılacak.",
    },
  ];

  return {
    domainKey,
    weeklyPlan,
    dailyStructure: dayStructure,
  };
}

export const INDEPENDENCE_LEVELS: { key: IndependenceLevel; label: string; score: number }[] = [
  { key: "tam_bağımlı", label: "Tam Bağımlı", score: 1 },
  { key: "fiziksel_yardım", label: "Fiziksel Yardım", score: 2 },
  { key: "sözel_ipucu", label: "Sözel İpucu", score: 3 },
  { key: "gözetim", label: "Gözetim", score: 4 },
  { key: "bağımsız", label: "Bağımsız", score: 5 },
];

export const AGE_GROUPS: { key: AgeGroupKey; label: string }[] = [
  { key: "0-3", label: "0-3 yaş" },
  { key: "3-6", label: "3-6 yaş" },
  { key: "6-12", label: "6-12 yaş" },
  { key: "12-18", label: "12-18 yaş" },
  { key: "18-30", label: "18-30 yaş" },
  { key: "30-50", label: "30-50 yaş" },
  { key: "50-65", label: "50-65 yaş" },
  { key: "65+", label: "65+ yaş" },
];

export const ENVIRONMENT_OPTIONS: { key: EnvironmentType; label: string }[] = [
  { key: "ev", label: "Ev" },
  { key: "okul", label: "Okul" },
  { key: "klinik", label: "Klinik" },
  { key: "iş_yeri", label: "İş Yeri" },
  { key: "toplum", label: "Toplum" },
];

export const THERAPY_FREQUENCY_OPTIONS: { key: TherapyFrequency; label: string }[] = [
  { key: "haftada_1", label: "Haftada 1" },
  { key: "haftada_2", label: "Haftada 2" },
  { key: "haftada_3", label: "Haftada 3" },
  { key: "günlük", label: "Günlük" },
];

export const GAME_PURPOSE_LABELS: Record<GameTherapyPurpose, string> = {
  dikkat: "Dikkat",
  hafıza: "Hafıza",
  yürütücü_işlev: "Yürütücü İşlev",
  görsel_algı: "Görsel Algı",
  duygu_tanıma: "Duygu Tanıma",
  sıralama: "Sıralama",
  planlama: "Planlama",
  el_göz_koordinasyonu: "El-Göz Koordinasyonu",
  tepki_hızı: "Tepki Hızı",
};
