// ── Structured Activity Recommendation & Support Program System ──
// Evidence-based occupational therapy practice areas, activities, game mappings, and plan templates.
// References: AOTA Practice Framework (4th Ed.), WHO ICF, peer-reviewed OT literature.

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
  /** Kısa kanıt temeli özeti – seans notlarında kaynak olarak kullanılabilir */
  evidenceBase?: string;
  /** Ergoterapist için pratik uygulama önerileri */
  therapistTips?: string[];
}

export interface SessionDosage {
  minutesPerSession: number;
  sessionsPerWeek: number;
  progressionNote: string;
}

export interface GameMapping {
  gameKey: PlatformGameKey;
  purposes: GameTherapyPurpose[];
  suitableDomains: TherapyDomainKey[];
  difficultyFit: DifficultyLevel[];
  therapeuticRationale: string;
  /** Kanıt tabanı: ilgili araştırma / standart değerlendirme aracı referansı */
  researchBasis: string;
  /** Önerilen seans dozu ve ilerleme rehberi */
  sessionDosage: SessionDosage;
  /** Seansta somut kullanım önerileri */
  howToUseInSession: string;
  /** Ergoterapistin takip etmesi gereken çıktı göstergeleri */
  outcomeIndicators: string[];
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
// Kaynak: AOTA (2020), Klingberg (2010) Nat Rev Neurosci, Schmidt & Lee (2011) Motor Control,
// Warren (1993) AJOT, Cicerone et al. (2019) Arch Phys Med Rehabil, Spector et al. (2003) BJPT

export const GAME_THERAPY_MAPPINGS: GameMapping[] = [
  {
    gameKey: "memory",
    purposes: ["hafıza", "sıralama", "dikkat"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "geriatric", "mental-health"],
    difficultyFit: ["kolay", "orta", "zor"],
    therapeuticRationale: "Çalışma belleği (working memory) kapasitesini ve sıralama becerisini doğrudan çalıştırır. Sekans uzunluğu kademeli artırılarak zorluk yönetilir; bu yaklaşım kognitif yük teorisiyle örtüşür.",
    researchBasis: "Corsi Blok Testi'nden türetilen sıralı hafıza paradigması (Milner, 1971). Klingberg ve ark. (2005, JCNS) çalışma belleği eğitiminin nöroplastisiteyi artırdığını, DEHB'de prefrontal aktivasyonu iyileştirdiğini göstermiştir. Cicerone ve ark. (2019) nörolojik rehabilitasyonda bilişsel antrenmanı Kanıt Düzeyi A olarak destekler.",
    sessionDosage: {
      minutesPerSession: 10,
      sessionsPerWeek: 3,
      progressionNote: "Hedef seri uzunluğu: 3→4→5→6 adım. %80 başarı oranına ulaşıldığında bir adım ilerleyin. Hata oranı %40'ı geçerse bir adım geri inin.",
    },
    howToUseInSession: "Seans başında bilişsel ısınma olarak 5-10 dk kullanın. Danışandan her deneme sonrasında sırayı sözel olarak tekrar etmesini isteyin. Seans notuna hedef seri uzunluğu, başarı yüzdesi ve dikkat süresini kaydedin.",
    outcomeIndicators: ["Maksimum doğru seri uzunluğu (span)", "Toplam doğru deneme yüzdesi", "Hata başına tepki süresi değişimi", "Seanstan seansa seri uzunluğu artışı"],
  },
  {
    gameKey: "pairs",
    purposes: ["hafıza", "görsel_algı", "planlama"],
    suitableDomains: ["pediatric", "neurological", "geriatric", "neurodiversity"],
    difficultyFit: ["kolay", "orta"],
    therapeuticRationale: "Görsel-uzamsal bellek, eşleştirme stratejisi ve sistematik arama planlamasını çalıştırır. Danışanın stratejik yaklaşım geliştirmesini – rastgele değil sistematik tarama – destekler.",
    researchBasis: "Bilişsel stimülasyon terapisinde kart eşleme görevleri Alzheimer erken dönemde etkin olarak kullanılmaktadır (Spector et al., 2003, BJPT). Nöropsikiyatrik değerlendirmelerde (WAIS-IV, MoCA) yüz-isim eşleştirme görevleri standarttır. Pediatrik alanda görsel bellek oyunları ince motor ve bilişsel gelişimi destekler (Case-Smith & O'Brien, 2015).",
    sessionDosage: {
      minutesPerSession: 15,
      sessionsPerWeek: 2,
      progressionNote: "6 çift → 10 çift → 15 çift. Süre baskısı eklenerek dikkat bileşeni güçlendirilebilir. Yaşlı danışanlarda 6-8 çift sabit tutulabilir.",
    },
    howToUseInSession: "Oyun öncesinde 'Kartları nasıl takip edeceksin?' sorusuyla strateji tartışın. Oyun sonrasında stratejinin işe yarayıp yaramadığını değerlendirin. Strateji geliştirme sürecini seans notuna aktarın.",
    outcomeIndicators: ["Eşleştirme tamamlama süresi", "Açılan toplam kart sayısı (verimlilik)", "Çift bulma yüzdesi", "Strateji kullanımı (sistematik vs. rastgele)"],
  },
  {
    gameKey: "pulse",
    purposes: ["el_göz_koordinasyonu", "tepki_hızı", "dikkat"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "work-productivity"],
    difficultyFit: ["orta", "zor"],
    therapeuticRationale: "Motor planlama, hedefleme doğruluğu ve zamanlama becerilerini çalıştırır. Fitts Yasası'na göre hedef boyutu ve mesafesi ayarlanarak motor zorluğu bilimsel olarak yönetilebilir.",
    researchBasis: "Fitts (1954) hız-doğruluk değiş tokuşu (speed-accuracy tradeoff) teorisi hedef yönelimli motor öğrenmenin temelini oluşturur. Schmidt & Lee (2011, Motor Control) tekrarlı hedef odaklı pratiklerin nöromusküler plastisiteyi artırdığını gösterir. Ritimli vuruş görevleri inme sonrası üst ekstremite rehabilitasyonunda desteklenmiştir (Thaut, 2005, RAS).",
    sessionDosage: {
      minutesPerSession: 10,
      sessionsPerWeek: 3,
      progressionNote: "Başlangıçta büyük/yavaş hedefler; %70 isabetlilik sağlandığında hız artırılır. Zamanla hedef boyutu küçültülerek motor hassasiyet geliştirilir.",
    },
    howToUseInSession: "Üst ekstremite seanslarda fonksiyonel motor aktivite sonrasında koordinasyon çalışması olarak 8-10 dk kullanın. Seans başı ve sonu skoru kaydedin; görsel grafik gelişimi motive edici olur. Hafif tremoru olan danışanlarda masaya oturarak destekli pozisyonda oynayın.",
    outcomeIndicators: ["İsabetli vuruş yüzdesi", "Ortalama tepki süresi (ms)", "Tutarlılık skoru (SD)", "Seans içi yorgunma etkisi (skor değişimi)"],
  },
  {
    gameKey: "route",
    purposes: ["planlama", "yürütücü_işlev", "el_göz_koordinasyonu"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "geriatric"],
    difficultyFit: ["orta", "zor"],
    therapeuticRationale: "Yön komutu işleme, motor yanıt seçimi ve hızlı karar verme süreçlerini aynı anda çalıştırır. Yürütücü işlevin 'planlama ve inhibisyon' bileşenlerini doğrudan hedefler.",
    researchBasis: "Luria'nın frontal lob işlev modeli (1973) yön-eylem planlamasının prefrontal kortekste işlendiğini ortaya koyar. Tower of London testi gibi planlama görevlerinin nörorehabilitasyonda etkinliği gösterilmiştir (Cicerone et al., 2019). DEHB'de yürütücü işlev eğitimi meta-analizlerde olumlu etkiler gösterir (Cortese et al., 2015, Lancet Psychiatry).",
    sessionDosage: {
      minutesPerSession: 15,
      sessionsPerWeek: 2,
      progressionNote: "3 komutluk rota → 5 komut → 7 komut. Dönüş sayısı artırılır; geriye dönük komutlar eklenerek inhibisyon bileşeni güçlendirilebilir.",
    },
    howToUseInSession: "Danışandan komutu sesli tekrar etmesini isteyin (verbal rehearsal). Hata yaptığında durdurup 'Şimdi nerede duruyorsun?' sorusu ile öz-izleme becerisi geliştirin. Yürütücü işlev hedefi olan danışanlarda seans notu şablonuna ekleyin.",
    outcomeIndicators: ["Doğru rota tamamlama yüzdesi", "Komut işleme süresi", "Hata tipi analizi (planlama / inhibisyon / yön hatası)", "Seans başına tamamlanan adım sayısı"],
  },
  {
    gameKey: "difference",
    purposes: ["görsel_algı", "dikkat"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "geriatric", "community-social"],
    difficultyFit: ["kolay", "orta"],
    therapeuticRationale: "Figür-zemin ayrımı ve sistematik görsel tarama becerilerini çalıştırır. Hemineglect ve görsel dikkat bozukluklarının rehabilitasyonunda kullanılabilir; görsel ayrım kapasitesini niceliksel olarak değerlendirmeye olanak sağlar.",
    researchBasis: "Warren (1993, AJOT) görsel algı hiyerarşi modelinde figür-zemin ayrımı temel bir bileşendir. Motor Free Visual Perception Test (MVPT) ve Test of Visual Perceptual Skills (TVPS) gibi standart OT değerlendirmelerinde fark bulma görevi kullanılır. İhmal rehabilitasyonunda görsel tarama eğitimi Kanıt Düzeyi B desteklidir (Cicerone et al., 2019).",
    sessionDosage: {
      minutesPerSession: 10,
      sessionsPerWeek: 2,
      progressionNote: "Az fark → çok fark içeren görüntüler. Süre kısıtlaması eklenerek dikkat baskısı artırılabilir. İhmal olan danışanlarda sol alan takibine özel dikkat.",
    },
    howToUseInSession: "Soldan sağa tarama stratejisi öğretin. Görsel alan kaybı / ihmal olan danışanlarda etkilenen tarafı zorlamak için ekranı o tarafa konumlandırın. Fark bulma süresi ve sırası kayıt altına alınabilir.",
    outcomeIndicators: ["Fark bulma doğruluğu (%)", "Ortalama bulma süresi", "Kaçırılan fark sayısı", "Tarama paterninin sistematikliği (sol→sağ / rastgele)"],
  },
  {
    gameKey: "scan",
    purposes: ["dikkat", "görsel_algı", "tepki_hızı"],
    suitableDomains: ["pediatric", "neurological", "neurodiversity", "work-productivity", "geriatric"],
    difficultyFit: ["orta", "zor"],
    therapeuticRationale: "Seçici dikkat, görsel tarama hızı ve hedef bulma becerilerini çalıştırır; dikkat dağıtıcılar arasından hedef seçimi (target-among-distractors) paradigması kullanır. Bu paradigma günlük yaşam dikkat gereksinimlerini simüle eder.",
    researchBasis: "Visual Search paradigması (Treisman & Gelade, 1980) seçici dikkatin temel mekanizmasını açıklar. Robertson ve ark. (1994, Neuropsychologia) hasarlı dikkat fonksiyonlarının onarılabilir olduğunu göstermiştir. Attention Process Training (APT; Sohlberg & Mateer, 2001) görsel tarama hızını temel bir çıktı ölçütü olarak kullanır.",
    sessionDosage: {
      minutesPerSession: 10,
      sessionsPerWeek: 3,
      progressionNote: "Az dikkat dağıtıcı → çok dikkat dağıtıcı. Hedef benzerliği artırılarak özellik arama → birleştirici arama aşamalarına geçilir. Süre baskısı kademeli eklenir.",
    },
    howToUseInSession: "Seans başında dikkat ısınması veya seans sonunda bilişsel değerlendirme olarak kullanın. Tarama hızını ve hata sayısını not edin. Dikkat dalgalanması günlük görüntü karşılaştırmasıyla izlenebilir.",
    outcomeIndicators: ["Hedef bulma doğruluğu (%)", "Ortalama tarama süresi (sn)", "Yanlış alarm (hatalı basma) sayısı", "Dikkat dağıtıcı etkisi (skor düşüşü)"],
  },
];

// ── Therapy Domains ──

export const THERAPY_DOMAINS: TherapyDomain[] = [
  // ─── 1. Pediatrik Ergoterapi ───
  {
    key: "pediatric",
    label: "Pediatrik Ergoterapi",
    icon: "baby",
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
      {
        id: "ped-a1",
        label: "Boncuk dizme",
        subSkill: "İnce motor",
        activityType: "Masa başı aktivite",
        description: "Farklı boyutlardaki boncukları sıraya dizerek parmak kuvveti, üç nokta kavraması (tripod) ve bilateral koordinasyon geliştirme.",
        difficulty: "kolay",
        sessionMinutes: 10,
        materials: ["Boncuklar (farklı boyutlarda)", "İp/boncuk ipi", "Tepsi"],
        homeExercise: true,
        goals: ["ped-g1", "ped-g5"],
        evidenceBase: "Manipülasyon görevleri ince motor gelişimde etkindir (Case-Smith & O'Brien, 2015). Tripod kavrama erken yazı yazma temelini oluşturur.",
        therapistTips: [
          "Başlangıçta büyük boncuklar kullanın; gelişimle 5 mm'ye kadar küçültün.",
          "Renk-desen sıralaması ekleyerek bilişsel bileşen ekleyin (ped-g5 için).",
          "Süre kaydedin ve grafik tutun – çocuk motivasyonu için yararlı.",
        ],
      },
      {
        id: "ped-a2",
        label: "Hamur yoğurma ve şekillendirme",
        subSkill: "İnce motor",
        activityType: "Duyusal-motor aktivite",
        description: "Terapi hamuru ile yoğurma, sıkma, kopartma ve şekil oluşturma hareketleri yaparak el intrinsik kaslarını güçlendirme ve duyusal düzenleme desteği sağlama.",
        difficulty: "kolay",
        sessionMinutes: 15,
        materials: ["Terapi hamuru (farklı sertlikler)", "Kalıplar", "Plastik bıçak"],
        homeExercise: true,
        goals: ["ped-g1", "ped-g2"],
        evidenceBase: "Proprioseptif girdi sağlayan hamur aktiviteleri duyusal düzenleme ve ince motor gelişimi destekler (Ayres, 1979, Sensory Integration). El kası kuvveti yazı yazma performansıyla korelasyon gösterir.",
        therapistTips: [
          "Duyusal savunması olan çocuklara önce kuru malzemelerle başlayın.",
          "Hamur sertliğini kuvvet düzeyine göre ayarlayın; sert hamur daha fazla proprioseptif girdi sağlar.",
          "Şekil oluşturma sırasında adım açıklamaları ile sıralama becerisi de çalışılır.",
        ],
      },
      {
        id: "ped-a3",
        label: "Duyusal kutu keşfi",
        subSkill: "Duyusal işleme",
        activityType: "Duyusal aktivite",
        description: "Pirinç, kum veya fasulye gibi farklı dokuları barındıran kutularda gömülü nesneleri bulup isimlendirme; dokunsal ayrım ve duyusal tolerans çalışması.",
        difficulty: "kolay",
        sessionMinutes: 15,
        materials: ["Plastik kutu", "Pirinç / kum / fasulye", "Küçük nesneler (oyuncak, düğme)"],
        homeExercise: true,
        goals: ["ped-g2"],
        evidenceBase: "Duyusal entegrasyon terapisinin (SI; Ayres, 1972) temel aktivitelerinden biridir. Dokunsal ayrım görevleri duyusal işleme bozukluğunda iyileşmeyle ilişkilendirilmiştir (Schaaf et al., 2018, AJOT).",
        therapistTips: [
          "Duyusal aşırı tepki gösteren çocuklarda kuru, taneli malzemeyle başlayın.",
          "Nesneyi önce görerek bulduktan sonra gözleri kapalı bulmaya geçin.",
          "Bulduğu nesneyi isimlendirmesi dil gelişimini de destekler.",
        ],
      },
      {
        id: "ped-a4",
        label: "Makas ile kesme parkuru",
        subSkill: "İnce motor",
        activityType: "Masa başı aktivite",
        description: "Kalın çizgilerden ince kıvrımlı çizgilere ilerleyen, kademeli kesme şablonlarıyla makas kullanımı ve bimanüel koordinasyon geliştirme.",
        difficulty: "orta",
        sessionMinutes: 10,
        materials: ["Çocuk makası (yay yaylı veya standart)", "Kademeli kesme şablonları"],
        homeExercise: true,
        goals: ["ped-g1", "ped-g5"],
        evidenceBase: "Makas kesme becerisi ince motor gelişim değerlendirmelerinde temel milestonelardan biridir (4 yaş: düz çizgi; 5 yaş: eğri; Folio & Fewell, 2000).",
        therapistTips: [
          "Kapalı-açık parmak sıkıştırma düzeni için sıkma egzersizi ile başlayın.",
          "Kesme şablonları: düz → dalgalı → zigzag → kare → daire → karmaşık şekil.",
          "Yay yaylı makas el kuvveti yetersizliğinde kullanılabilir.",
        ],
      },
      {
        id: "ped-a5",
        label: "Denge tahtasında yürüme ve nesne taşıma",
        subSkill: "Kaba motor",
        activityType: "Motor aktivite",
        description: "Denge tahtası üzerinde nesne taşıyarak postüral kontrol, bilateral koordinasyon ve vestibüler işleme çalışması.",
        difficulty: "orta",
        sessionMinutes: 15,
        materials: ["Denge tahtası / tahterevalli", "Küçük toplar veya nesneler"],
        homeExercise: false,
        goals: ["ped-g4", "ped-g5"],
        evidenceBase: "Vestibüler uyarım postüral tonus, dikkat düzenleme ve motor planlamayı olumlu etkiler (Ayres, 1979). Denge eğitimi motor koordinasyon bozukluğunda (DCD) etkindir (Zwicker et al., 2012, Dev Med Child Neurol).",
        therapistTips: [
          "Güvenlik için serbest denge öncesi el desteği ile başlayın.",
          "Nesne taşıma görevi dual-task bileşeni ekleyerek yürütücü işlevi çalıştırır.",
          "Ritimli müzik eklemek vestibüler ve işitsel entegrasyonu artırır.",
        ],
      },
      {
        id: "ped-a6",
        label: "Giyinme sekansı eğitimi",
        subSkill: "Öz bakım",
        activityType: "Günlük yaşam pratiği",
        description: "Adım adım görsel kartlarla giyinme sıralaması öğretimi; düğme, fermuar ve cırt bant çalışmaları.",
        difficulty: "orta",
        sessionMinutes: 20,
        materials: ["Görsel sekans kartları", "Kıyafet pratiği seti (düğmeli, fermuarlı)"],
        homeExercise: true,
        goals: ["ped-g3"],
        evidenceBase: "Görev analizi ve görsel ipucu sistemleri öz bakım becerisi edinimini hızlandırır (AOTA, 2020). Görsel sekans desteği bilişsel yük teorisiyle uyumludur.",
        therapistTips: [
          "Geri zincirleme (backward chaining) ile son adımdan başlayın; çocuk her adımı bağımsız tamamladığında önceki adıma geçin.",
          "Aile eğitimini mutlaka dahil edin; evde tutarlı uygulama kritik.",
          "Görsel kartları çocuk seviyesinde bir yere asın, günlük pratik için.",
        ],
      },
      {
        id: "ped-a7",
        label: "Kalem tutuş ve öncesi yazı çalışması",
        subSkill: "İnce motor",
        activityType: "Masa başı aktivite",
        description: "Düzgün tripod kavrama ve kalem baskısı için kısa kaleme kalın üçgen adaptör ile yavaş çizgi/şekil egzersizleri.",
        difficulty: "orta",
        sessionMinutes: 15,
        materials: ["Kısa kalem / üçgen adaptör", "Çizgi parkur kağıtları", "Grafit kağıt"],
        homeExercise: true,
        goals: ["ped-g1", "ped-g5"],
        evidenceBase: "Uygun kalem tutuşu yazı performansı ve dayanıklılık üzerinde doğrudan etkiye sahiptir (Feder & Majnemer, 2007, Dev Med Child Neurol). Handwriting Without Tears programı kanıt temelli bir yaklaşımdır.",
        therapistTips: [
          "Parmak gücü yetersizse önce klip ve mandal egzersizleri yapın.",
          "Dirsek yüksekliği masa seviyesinde olmalı; sandalye ve masa yüksekliğini kontrol edin.",
          "Kısa kalem kullanımı tripod kavramayı otomatik olarak destekler.",
        ],
      },
    ],
    suitableAgeGroups: ["0-3", "3-6", "6-12", "12-18"],
  },

  // ─── 2. Ruh Sağlığı Ergoterapisi ───
  {
    key: "mental-health",
    label: "Ruh Sağlığı Ergoterapisi",
    icon: "brain",
    color: "#8b5cf6",
    description: "Anksiyete, depresyon, stres ve psikiyatrik durumlarda aktivite katılımı ve yaşam kalitesini artıran ergoterapi yaklaşımı.",
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
      {
        id: "mh-a1",
        label: "Duygu termometresi",
        subSkill: "Duygu farkındalığı",
        activityType: "Psiko-eğitim",
        description: "Günlük duygu durumunu 1-10 skalasında değerlendirme, tetikleyicileri belirleme ve duygular ile beden tepkileri arasındaki bağı keşfetme.",
        difficulty: "kolay",
        sessionMinutes: 10,
        materials: ["Duygu termometresi şablonu", "Duygu kartları", "Günlük defteri"],
        homeExercise: true,
        goals: ["mh-g1"],
        evidenceBase: "Duygu tanıma ve isimlendirme (affect labeling) duygusal düzenlemeyi kolaylaştırır; prefrontal-limbik aktivasyon değişimi gösterilmiştir (Lieberman et al., 2007, Psychol Sci). DBT tabanlı duygu düzenleme becerileri OT uygulamaları için uyarlanmıştır.",
        therapistTips: [
          "Beden haritası (hangi duygu bedende nerede hissediliyor) ekleyin.",
          "Tetikleyici listesi oluşturun: 'Bu duyguyu en çok ne tetikliyor?'",
          "Ev ödevi olarak günde 2 kez (sabah-akşam) doldurmasını isteyin.",
        ],
      },
      {
        id: "mh-a2",
        label: "Davranışsal aktivasyon – haftalık plan",
        subSkill: "Aktivite planlama",
        activityType: "Yapılandırılmış planlama",
        description: "Haz veren (pleasurable), başarı hissettiren (mastery) ve zorunlu aktiviteleri dengeli şekilde planlayarak depresyon ile ataletle mücadele etme.",
        difficulty: "orta",
        sessionMinutes: 20,
        materials: ["Haftalık planlayıcı şablonu", "Aktivite kartları", "Renkli kalemler"],
        homeExercise: true,
        goals: ["mh-g2", "mh-g5"],
        evidenceBase: "Davranışsal aktivasyon (BA) depresyon tedavisinde en güçlü kanıt tabanlarından birine sahiptir (Ekers et al., 2014, PLOS ONE meta-analiz). OT'nin occupation-based yaklaşımıyla doğal örtüşüm sağlar.",
        therapistTips: [
          "Önce 'haz veren aktiviteler' listesini oluşturun – danışanın kendi değerlerinden türetin.",
          "Planı küçük, başarılabilir adımlara bölün; 'neden yapmalıyım' değil 'nasıl başlarım' odağı.",
          "Her aktivite sonrasında duygu termometresiyle ruh halindeki değişimi ölçün.",
        ],
      },
      {
        id: "mh-a3",
        label: "Diyafram nefesi ve kas gevşetme",
        subSkill: "Başa çıkma stratejileri",
        activityType: "Gevşeme",
        description: "4-7-8 nefes tekniği ve progresif kas gevşetme (PMR) yöntemiyle otonom sinir sistemi düzenlemesi ve anksiyete yönetimi.",
        difficulty: "kolay",
        sessionMinutes: 15,
        materials: ["Nefes tekniği kartı", "Sessiz ortam"],
        homeExercise: true,
        goals: ["mh-g3"],
        evidenceBase: "Diyafram nefesi vagal aktivasyonu artırarak parasempatik sistemi uyarır (Zaccaro et al., 2018, Front Human Neurosci). PMR anksiyete ve stres yönetiminde meta-analiz düzeyinde desteklenmiştir (Conrad & Roth, 2007, J Anxiety Disord).",
        therapistTips: [
          "Önce nefes tekniğini fısıltıyla sayarak öğretin; yazılı kart verin.",
          "Kas gevşetme için ayak parmaklarından başlayarak baş-boyun bölgesine ilerleyin.",
          "Günde 2 kez 5 dakika uygulama hedefi koyun; alarm hatırlatıcı önerin.",
        ],
      },
      {
        id: "mh-a4",
        label: "Sanat terapisi – duygu ifadesi",
        subSkill: "Duygu farkındalığı",
        activityType: "Yaratıcı aktivite",
        description: "Sözel ifadesi zor olan duyguları görsel araçlarla (çizim, renk, kolaj) ifade etme; serbest çizim veya yapılandırılmış temalar kullanılabilir.",
        difficulty: "kolay",
        sessionMinutes: 25,
        materials: ["A4 kağıt", "Boya kalemleri", "Pastel boyalar", "Dergi görselleri (kolaj için)"],
        homeExercise: true,
        goals: ["mh-g1", "mh-g5"],
        evidenceBase: "Sanat terapisi psikiyatrik bozukluklarda duygu düzenleme ve öz ifadeyi destekler (Slayton et al., 2010, J Am Art Ther Assoc). Kanıt temeli anksiyete ve depresyonda anlamlı etkiler gösterir.",
        therapistTips: [
          "Sonucu değerlendirmeyin; 'güzel mi?' değil 'ne hissettin?' sorusu sorun.",
          "Renk seçimlerini ve baskı gücünü gözlemleyin – duygu yoğunluğuna dair ipuçları verir.",
          "Seans sonunda çalışmayı birlikte inceleyin ve hikayesini anlatmasını isteyin.",
        ],
      },
      {
        id: "mh-a5",
        label: "Yapılandırılmış grup sohbet çemberi",
        subSkill: "Sosyal beceri",
        activityType: "Grup aktivitesi",
        description: "Belirli konularda sırayla konuşma ve aktif dinleme pratiği; sosyal bağlantı, empati ve iletişim becerileri çalışması.",
        difficulty: "orta",
        sessionMinutes: 30,
        materials: ["Konu başlığı kartları", "Konuşma topu"],
        homeExercise: false,
        goals: ["mh-g4"],
        evidenceBase: "Grup terapisi sosyal izolasyonu azaltma ve anlamlı katılımı artırmada bireysel terapiye eşdeğer etki gösterir (Burlingame et al., 2013, Psychotherapy). OT grup formatları katılım ve sosyal kimliği güçlendirir.",
        therapistTips: [
          "Kural listesi belirleyin: dinleme süresi, yargılamama, gizlilik.",
          "Sohbet topunu konuşan kişiye verin; netlik ve sıra beklemesini kolaylaştırır.",
          "İzleme (observer) rolünden aktif konuşmaya kademeli geçiş planlayın.",
        ],
      },
      {
        id: "mh-a6",
        label: "Farkındalık temelli aktivite (mindful cooking/craft)",
        subSkill: "Başa çıkma stratejileri",
        activityType: "Anlamlı aktivite",
        description: "Basit bir yemek tarifi veya el sanatı aktivitesini tam dikkatle gerçekleştirme; duyusal detaylara odaklanarak şimdiki anda kalmayı pratiği.",
        difficulty: "kolay",
        sessionMinutes: 20,
        materials: ["Basit tarif malzemeleri veya el sanatı seti"],
        homeExercise: true,
        goals: ["mh-g3", "mh-g2"],
        evidenceBase: "MBSR (Mindfulness-Based Stress Reduction) anksiyete ve depresyonda meta-analiz düzeyinde kanıt içerir (Khoury et al., 2015, Clin Psychol Rev). OT'de anlamlı aktivite yoluyla mindfulness uygulaması kanıt kazanmaktadır.",
        therapistTips: [
          "Aktiviteye başlamadan 1 dakika sessiz nefes egzersizi yapın.",
          "Her adımda 'Şu an ne duyuyorsun? Ne hissediyorsun?' soruları sorun.",
          "Sonucu paylaşmak sosyal bağlantı ve öz yeterlilik duygusunu pekiştirir.",
        ],
      },
    ],
    suitableAgeGroups: ["12-18", "18-30", "30-50", "50-65", "65+"],
  },

  // ─── 3. Nörolojik Rehabilitasyon ───
  {
    key: "neurological",
    label: "Nörolojik Rehabilitasyon",
    icon: "zap",
    color: "#f59e0b",
    description: "İnme, travmatik beyin hasarı ve nörodejeneratif hastalıklarda fonksiyonel bağımsızlığı yeniden kazandırmayı amaçlayan ergoterapi.",
    goals: [
      { id: "nr-g1", label: "Üst ekstremite fonksiyonunu yeniden kazanma", description: "Etkilenen kol ve el fonksiyonlarını tedavi edici aktivitelerle geri kazandırma" },
      { id: "nr-g2", label: "Bilişsel fonksiyonları iyileştirme", description: "Dikkat, hafıza, yürütücü işlevler ve problem çözme becerilerini güçlendirme" },
      { id: "nr-g3", label: "Günlük yaşam bağımsızlığı", description: "Öz bakım, ev yönetimi ve toplum katılımında bağımsızlık düzeyini artırma" },
      { id: "nr-g4", label: "Görsel-algısal iyileşme", description: "Görsel alan kaybı, ihmal ve algısal bozuklukları rehabilite etme" },
    ],
    challenges: [
      { id: "nr-c1", label: "Tek taraflı ihmal (neglect)" },
      { id: "nr-c2", label: "Üst ekstremite parezi / spastisitesi" },
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
      {
        id: "nr-a1",
        label: "Kısıtlama kaynaklı hareket terapisi (CIMT)",
        subSkill: "Kuvvet ve hareket genişliği",
        activityType: "Motor rehabilitasyon",
        description: "Etkilenmemiş eli kısıtlama eldiveniyle kısıtlayarak etkilenen elin yoğun ve tekrarlı işlevsel kullanımını sağlama.",
        difficulty: "zor",
        sessionMinutes: 30,
        materials: ["Kısıtlama eldiveni veya splint", "Fonksiyonel nesneler (kaşık, kalem, top)"],
        homeExercise: false,
        goals: ["nr-g1"],
        evidenceBase: "CIMT inme rehabilitasyonunda en güçlü kanıt tabanlarından birine sahiptir (Taub et al., 2006, Stroke; EXCITE trial, Wolf et al., 2006, JAMA). Günlük 6 saat uygulama üst ekstremite motor fonksiyonunu anlamlı iyileştirir.",
        therapistTips: [
          "Protokol: günde 6 saat kısıtlama + 3 saat massed practice. Modifiye CIMT daha az süre ile uygulanabilir.",
          "FIM veya Wolf Motor Function Test ile başlangıç düzeyini kaydedin.",
          "Transfer paketini kullanın: günlük yaşam görevlerini terapiye entegre edin.",
        ],
      },
      {
        id: "nr-a2",
        label: "Dikkat ve çalışma belleği eğitimi",
        subSkill: "Bilişsel rehabilitasyon",
        activityType: "Bilişsel aktivite",
        description: "Renkli kartlar veya dijital araçlarla sürdürülebilir dikkat, bölünmüş dikkat ve çalışma belleği çalışmaları.",
        difficulty: "orta",
        sessionMinutes: 20,
        materials: ["Dikkat kartları", "Zamanlayıcı", "Tablet/bilgisayar"],
        homeExercise: true,
        goals: ["nr-g2"],
        evidenceBase: "Attention Process Training (APT; Sohlberg & Mateer, 2001) beyin hasarı sonrası dikkat rehabilitasyonu için standart bir yaklaşımdır. Cicerone ve ark. (2019) Arch Phys Med Rehabil sistemik incelemesi bilişsel rehabilitasyonu Kanıt Düzeyi A ile destekler.",
        therapistTips: [
          "Dikkat hiyerarşisi: sürdürülebilir → seçici → bölünmüş → alternating dikkat.",
          "Yorgunluk takibi yapın; bilişsel çalışmayı seans başında planlayın.",
          "Dijital oyunlarla entegrasyon (Sıra Hafızası, Hedef Tarama) nesnel ilerleme verisi sağlar.",
        ],
      },
      {
        id: "nr-a3",
        label: "Görsel tarama ve ihmal rehabilitasyonu",
        subSkill: "Görsel-algısal iyileşme",
        activityType: "Algısal rehabilitasyon",
        description: "Sol-sağ sistematik tarama stratejisi eğitimi; işaretleme, okuma ve tarama yaprakları ile görsel ihmal rehabilitasyonu.",
        difficulty: "orta",
        sessionMinutes: 15,
        materials: ["Tarama yaprakları", "Renkli işaretleyici kalem", "Çizgi ve okuma egzersizleri"],
        homeExercise: true,
        goals: ["nr-g4"],
        evidenceBase: "Görsel tarama eğitimi hemineglect rehabilitasyonunda kanıtlanmış etkiye sahiptir (Robertson et al., 1990, J Neurol). Kırmızı çizgi ipucu yöntemi (red line cue) sol ihmal tedavisinde etkindir.",
        therapistTips: [
          "Sol kenara kırmızı dikey çizgi çizin; taramaya hep bu çizgiden başlatın.",
          "Baş çevirme + göz hareketi kombinasyonunu teşvik edin.",
          "TV izleme, yemek yeme gibi ADL'lerde ihmal stratejilerini genelleştirin.",
        ],
      },
      {
        id: "nr-a4",
        label: "Mutfak simülasyonu – bilateral koordinasyon",
        subSkill: "Bilateral koordinasyon",
        activityType: "Günlük yaşam pratiği",
        description: "Basit yemek hazırlama (meyve kesme, şişe açma, karıştırma) adımlarını iki eli kullanarak gerçekleştirme; etkilenen tarafın asistan el olarak aktif kullanımı.",
        difficulty: "zor",
        sessionMinutes: 30,
        materials: ["Mutfak malzemeleri", "Adaptif kesme tahtası", "Kaymaz altlık"],
        homeExercise: true,
        goals: ["nr-g1", "nr-g3"],
        evidenceBase: "Görev odaklı terapi (Task-Oriented Approach; Mathiowetz & Bass Haugen, 1994) inme rehabilitasyonunda işlevsel aktiviteleri ön plana çıkarır. ADL'lere özgü pratik en yüksek transfer değerini sağlar.",
        therapistTips: [
          "Adaptif ekipman ile başlayın; bağımsızlık arttıkça kaldırın.",
          "Etkilenen elin asistan görev üstlenmesini zorunlu kılın (nesne tutma, stabilize etme).",
          "Güvenlik değerlendirmesini seans öncesinde mutlaka yapın.",
        ],
      },
      {
        id: "nr-a5",
        label: "Ayna terapisi",
        subSkill: "Kuvvet ve hareket genişliği",
        activityType: "Motor rehabilitasyon",
        description: "Ayna kutusunda sağlam elin hareketinin etkilenen ele yanılsamasını oluşturarak motor imaj ve kortikal reorganizasyon destekleme.",
        difficulty: "kolay",
        sessionMinutes: 20,
        materials: ["Ayna kutusu (mirror box)", "Masa"],
        homeExercise: true,
        goals: ["nr-g1"],
        evidenceBase: "Ayna terapisi inme sonrası üst ekstremite motor fonksiyonunda meta-analizlerle desteklenmiştir (Thieme et al., 2018, Cochrane). Hemiplejik ağrı ve ihmal üzerinde de olumlu etkileri gösterilmiştir.",
        therapistTips: [
          "15-30 dakika günlük ev programı olarak verilebilir.",
          "Sağlam elde açma-kapama, yumruk yapma, yön hareketleri uygulatın.",
          "Seans başında ve sonunda el şişliğini ve ağrıyı kaydedin.",
        ],
      },
    ],
    suitableAgeGroups: ["18-30", "30-50", "50-65", "65+"],
  },

  // ─── 4. Nöroçeşitlilik / Otizm / Öğrenme Güçlüğü ───
  {
    key: "neurodiversity",
    label: "Nöroçeşitlilik ve Otizm",
    icon: "puzzle",
    color: "#06b6d4",
    description: "Otizm spektrum, DEHB, öğrenme güçlüğü gibi nörogelişimsel farklılıklarda katılım ve bağımsızlığı destekleyen ergoterapi.",
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
      {
        id: "nd-a1",
        label: "Duyusal devre (sensory circuit)",
        subSkill: "Duyusal diyet uygulaması",
        activityType: "Duyusal-motor",
        description: "Uyarıcı → düzenleyici → sakinleştirici aktivite dizisi: zıplama, ağırlıklı yorgan, derin baskı masajı, derin nefes.",
        difficulty: "kolay",
        sessionMinutes: 15,
        materials: ["Trambolin / zıplama platformu", "Ağırlıklı battaniye", "Tenis topu"],
        homeExercise: true,
        goals: ["nd-g1"],
        evidenceBase: "Duyusal entegrasyon terapisi (Ayres, 1972) ve duyusal diyet konsepti (Wilbarger, 1991) OT alanında yaygın kullanılır. Güncel sistematik inceleme (Bodison & Parham, 2018, AJOT) duyusal devre uygulamasının davranış düzenlemesine katkısını destekler.",
        therapistTips: [
          "Her çocuğa özel sensory diet profili çıkarın: hangi aktivite uyarıcı, hangisi düzenleyici?",
          "Sınıf öncesi duyusal devre konsantrasyon ve davranış düzenlemesini artırabilir.",
          "Aile ve öğretmenlerle duyusal devre bilgisini paylaşın; ortamlar arası tutarlılık önemli.",
        ],
      },
      {
        id: "nd-a2",
        label: "Sosyal hikaye oluşturma",
        subSkill: "Görsel destek kullanımı",
        activityType: "Psiko-eğitim",
        description: "Belirli bir sosyal durum için bireyselleştirilmiş adım adım görsel hikaye kartları hazırlama ve uygulama.",
        difficulty: "orta",
        sessionMinutes: 20,
        materials: ["Sosyal hikaye şablonu", "Resim kartları veya çizimler"],
        homeExercise: true,
        goals: ["nd-g2", "nd-g5"],
        evidenceBase: "Social Stories™ (Gray, 1993) otizm spektrumunda sosyal anlayışı artırmak için kanıt temelli bir stratejidir. Çoklu sistematik inceleme sosyal hikayenin sosyal becerilere etkisini destekler (Karkhaneh et al., 2010, Pediatrics).",
        therapistTips: [
          "Hikayeyi olumlu, birinci şahıs ve geniş zaman kullanarak yazın.",
          "Çocukla birlikte hikayeyi oluşturun – katılım anlayışı artırır.",
          "Görsel destek: fotoğraf, çizim veya sembol tabanlı iletişim (PECS uyumlu).",
        ],
      },
      {
        id: "nd-a3",
        label: "Dur ve düşün – inhibisyon oyunu",
        subSkill: "Dikkat ve inhibisyon",
        activityType: "Bilişsel aktivite",
        description: "Sinyal kartlarıyla 'aksiyon al / dur' komutları verilen inhibisyon kontrolü çalışması; dürtüsellik ve tepki kontrolü hedeflenir.",
        difficulty: "orta",
        sessionMinutes: 15,
        materials: ["Kırmızı / yeşil sinyal kartları", "Ses efektleri veya zil"],
        homeExercise: false,
        goals: ["nd-g3"],
        evidenceBase: "Go/No-Go paradigması yürütücü işlev araştırmalarında temel inhibisyon ölçütü olarak kullanılır (Aron, 2007). DEHB'de inhibisyon eğitiminin yürütücü işlev üzerindeki etkisi desteklenmiştir (Cortese et al., 2015, Lancet Psychiatry).",
        therapistTips: [
          "Başlangıçta belirgin sinyal farkı (kırmızı/yeşil); ilerleme ile daha ince ayrımlar ekleyin.",
          "Oyun ortamını neşeli tutun; hata anksiyetesini azaltmak için 'beyin yanılgısı' çerçevesi kullanın.",
          "Dijital oyunlar (Route, Scan) aynı beceriyi farklı formatta çalıştırarak genelleme sağlar.",
        ],
      },
      {
        id: "nd-a4",
        label: "Lego sosyal kulüp",
        subSkill: "Sosyal oyun becerisi",
        activityType: "Grup aktivitesi",
        description: "Mühendis (plan okur), tedarikçi (parça verir) ve inşaatçı (yapı kurar) rolleriyle yapılandırılmış işbirliği; sıra bekleme ve iletişim becerileri.",
        difficulty: "orta",
        sessionMinutes: 30,
        materials: ["Lego seti", "Görsel rol kartları"],
        homeExercise: false,
        goals: ["nd-g2"],
        evidenceBase: "LegoTherapy™ (LeGoff, 2004, J Autism Dev Disord) otizm spektrumunda sosyal becerileri geliştiren kanıt temelli bir grup yaklaşımıdır. Çok merkezli çalışmalarda sosyal etkileşim ve iletişim artışı gösterilmiştir.",
        therapistTips: [
          "3 kişilik sabit grup tercih edin; rol dönüşümü her seansta yapılsın.",
          "Yanlış anlaşılma durumlarını problem çözme fırsatı olarak kullanın.",
          "Sonraki seansa bağlantı için tamamlanmamış yapı bırakın.",
        ],
      },
      {
        id: "nd-a5",
        label: "Görsel takvim ve geçiş hazırlığı",
        subSkill: "Görsel destek kullanımı",
        activityType: "Günlük yaşam pratiği",
        description: "Gün akışının görsel sembollerle planlanması; geçiş öncesi sayaç veya zamanlayıcı kullanarak rutinlerdeki değişime uyumu kolaylaştırma.",
        difficulty: "kolay",
        sessionMinutes: 15,
        materials: ["Görsel takvim panosu", "Sembol/fotoğraf kartlar", "Görsel zamanlayıcı"],
        homeExercise: true,
        goals: ["nd-g5"],
        evidenceBase: "Görsel destek sistemleri otizmde davranış yönetimi ve bağımsızlık için kanıt temelli bir uygulamadır (Mesibov & Shea, TEACCH metodolojisi; Hume et al., 2021, AJOT). Görsel zamanlayıcı geçiş tepkisini azaltır.",
        therapistTips: [
          "Takvimi çocuğun göz hizasına yerleştirin.",
          "Her etkinlik öncesi 5-2-1 dakika sayaç uyarısı yapın.",
          "Okul ve ev takvimlerini senkronize edin; tutarlılık kritik.",
        ],
      },
    ],
    suitableAgeGroups: ["0-3", "3-6", "6-12", "12-18", "18-30"],
  },

  // ─── 5. Geriatrik Ergoterapi ───
  {
    key: "geriatric",
    label: "Geriatrik Ergoterapi",
    icon: "person-standing",
    color: "#10b981",
    description: "Yaşlanmaya bağlı fonksiyonel kayıpları azaltma, düşme riskini yönetme ve yaşam kalitesini korumaya yönelik ergoterapi.",
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
      {
        id: "ge-a1",
        label: "Sandalyede güçlendirme ve esneklik programı",
        subSkill: "Denge ve mobilite",
        activityType: "Fiziksel aktivite",
        description: "Oturarak yapılan kalça, diz ve ayak bileği güçlendirme egzersizleri ile esneklik hareketleri; oturma-kalkma fonksiyonunu destekleme.",
        difficulty: "kolay",
        sessionMinutes: 20,
        materials: ["Sandalye", "Hafif direnç bandı", "Kısa ağırlık yastığı"],
        homeExercise: true,
        goals: ["ge-g1"],
        evidenceBase: "Kuvvet eğitimi yaşlı bireylerde düşme riskini azaltır (Sherrington et al., 2019, Cochrane – 159 çalışma, güçlü kanıt). OT'nin düşme önleme programları ev değerlendirmesiyle entegre edildiğinde etki artar.",
        therapistTips: [
          "Oturma-kalkma fonksiyonu (sit-to-stand) düşme riski için kritik; haftada 2x pratik yapın.",
          "Demir bir sandalye veya yüksek koltuk tercih edin.",
          "Egzersiz günlüğü tutarak kendi ilerlemeyi izlemelerini sağlayın.",
        ],
      },
      {
        id: "ge-a2",
        label: "Bilişsel stimülasyon – dijital oyunlar",
        subSkill: "Bilişsel stimülasyon",
        activityType: "Dijital oyun",
        description: "Kart eşleme, sıra hatırlama ve hedef tarama oyunlarıyla hafıza, dikkat ve görsel işleme çalışması.",
        difficulty: "kolay",
        sessionMinutes: 15,
        materials: ["Tablet / bilgisayar (büyük ekran tercih)"],
        homeExercise: true,
        goals: ["ge-g2"],
        evidenceBase: "Bilişsel stimülasyon terapisi (CST; Spector et al., 2003) demans erken dönemde anlamlı bilişsel faydalar sağlar. Dijital bilişsel egzersizler sağlıklı yaşlılarda bilişsel gerilemeyi yavaşlatabilir (Lampit et al., 2014, PLOS Med meta-analiz).",
        therapistTips: [
          "Ekranı 14 punto veya üzeri ayarlayın; gerekirse büyütme kullanın.",
          "Kontrastı artırın; yaşlı görme için düşük kontrast zorlaştırıcıdır.",
          "İlerlemeyi 4-6 haftalık aralıklarla MoCA veya MMSE ile nesnel değerlendirin.",
        ],
      },
      {
        id: "ge-a3",
        label: "Mutfak güvenliği ve enerji yönetimi",
        subSkill: "Enerji koruma",
        activityType: "Günlük yaşam pratiği",
        description: "Güvenli mutfak kullanımı analizi, adaptif ekipman tanıtımı ve enerji koruma ilkeleri (tempo, iş simplifikasyonu).",
        difficulty: "orta",
        sessionMinutes: 25,
        materials: ["Adaptif mutfak ekipman seti (açacak, kaymaz altlık, kavrama yardımcı)"],
        homeExercise: true,
        goals: ["ge-g3"],
        evidenceBase: "Enerji koruma eğitimi kalp yetmezliği, KOAH ve kanser tanılı bireylerde yorgunluğu anlamlı azaltır (Mathiowetz et al., 2005, AJOT). ADL ev modifikasyonu düşme ve kaza riskini azaltır.",
        therapistTips: [
          "İş simplifikasyonu: sık kullanılan malzemeleri erişilebilir raflara koyun.",
          "Oturarak hazırlama alternatifleri gösterin (mutfak taburesi).",
          "Ev ziyareti veya fotoğraf analizi ile gerçek mutfak düzenini değerlendirin.",
        ],
      },
      {
        id: "ge-a4",
        label: "El kuvveti ve manipülasyon programı",
        subSkill: "El fonksiyonu",
        activityType: "Motor rehabilitasyon",
        description: "Terapi hamuru, kavrama egzersizleri ve ince manipülasyon çalışmalarıyla günlük yaşam el kullanımını destekleme.",
        difficulty: "kolay",
        sessionMinutes: 15,
        materials: ["Terapi hamuru (sert renk)", "Kavrama dinamometresi", "Düğme panosu"],
        homeExercise: true,
        goals: ["ge-g1", "ge-g3"],
        evidenceBase: "El kavrama kuvveti genel sağlık, mortalite ve fonksiyonel bağımsızlığın güçlü bir prediktörüdür (Leong et al., 2015, Lancet). OT el kuvveti programları düşme riski ve ADL performansıyla ilişkilendirilmiştir.",
        therapistTips: [
          "Dynamometer ile başlangıç kuvvetini kaydedin; 4-6 haftada tekrarlayın.",
          "Eklem ağrısı varsa ısı uygulaması (parafin) öncesinde yapılabilir.",
          "Günlük yaşam aktiviteleri (kavanoz açma, düğme ilikleme) pratik ortama entegre edin.",
        ],
      },
      {
        id: "ge-a5",
        label: "Anlamlı aktivite grubu – hobi atölyesi",
        subSkill: "Bilişsel stimülasyon",
        activityType: "Grup aktivitesi",
        description: "El sanatları, müzik dinleme, bahçecilik veya hikaye paylaşımı gibi anlamlı grup aktiviteleriyle sosyal katılım ve bilişsel uyarım.",
        difficulty: "kolay",
        sessionMinutes: 45,
        materials: ["Aktiviteye özel (resim malzemeleri, tohumlar vb.)"],
        homeExercise: false,
        goals: ["ge-g4", "ge-g2"],
        evidenceBase: "Sosyal katılım ve anlamlı aktiviteler yaşlılarda bilişsel gerilemeyi yavaşlatır (Fratiglioni et al., 2004, Lancet Neurology). Grup aktivite katılımı depresyon ve yalnızlığı azaltır.",
        therapistTips: [
          "Aktiviteyi danışanın geçmiş ilgi alanlarına (meslek, hobi) bağlayın.",
          "Yavaş tempoya uyum sağlayın; tamamlama baskısı yaratmayın.",
          "Gruba düzenli katılım için aile desteğini dahil edin.",
        ],
      },
    ],
    suitableAgeGroups: ["65+", "50-65"],
  },

  // ─── 6. İş/Üretkenlik ve Okul Katılımı ───
  {
    key: "work-productivity",
    label: "İş & Okul Katılımı",
    icon: "briefcase",
    color: "#ec4899",
    description: "İş yerinde verimlilik, ergonomik düzenleme, akademik performans ve meslek rehabilitasyonunu destekleyen ergoterapi.",
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
      {
        id: "wp-a1",
        label: "Pomodoro tekniği uygulaması",
        subSkill: "Görev analizi",
        activityType: "Zaman yönetimi",
        description: "25 dakika odaklı çalışma + 5 dakika mola döngüsüyle sürdürülebilir konsantrasyon ve üretkenlik geliştirme.",
        difficulty: "kolay",
        sessionMinutes: 30,
        materials: ["Zamanlayıcı (fiziksel veya uygulama)", "Görev listesi"],
        homeExercise: true,
        goals: ["wp-g1", "wp-g3"],
        evidenceBase: "Ulrich Ecker ve ark. dikkat kapasitesinin sınırlı olduğunu ve düzenli molalarla geri kazanıldığını gösterir. Zaman bloğu teknikleri DEHB ve yürütücü işlev güçlüğünde üretkenlik stratejisi olarak OT literatüründe yer alır.",
        therapistTips: [
          "İlk hafta 15-20 dakika odak süreleriyle başlayın; kademeli artırın.",
          "Görev listesini öncelik sırasına göre yazın; listeyi 3-5 maddede tutun.",
          "Mola süresinde telefon/ekran kullanmayın; esneme veya su içme önerin.",
        ],
      },
      {
        id: "wp-a2",
        label: "Çalışma istasyonu ergonomisi değerlendirmesi",
        subSkill: "Çevre düzenleme",
        activityType: "Ergonomik değerlendirme",
        description: "Masa, sandalye, ekran pozisyonu, aydınlatma ve klavye yerleşimi düzenlemeleriyle kas-iskelet sistemi yükünü azaltma.",
        difficulty: "orta",
        sessionMinutes: 30,
        materials: ["Ergonomi değerlendirme formu", "Sandalye yükseklik ayarı", "Ekran standı"],
        homeExercise: false,
        goals: ["wp-g2"],
        evidenceBase: "Ergonomik müdahaleler iş yeri kas-iskelet rahatsızlıklarını anlamlı azaltır (Hartvigsen et al., 2018, Lancet). OT iş yeri ergonomisi değerlendirmesi 'work hardening' rehabilitasyonunun temel bileşenidir.",
        therapistTips: [
          "Ekran göz hizasında veya 10-15° aşağıda; dirsek 90°; kalça ≥ 90°.",
          "Klavye ve fare yakın; omuzları yükseltmeden ulaşılabilmeli.",
          "Her 30-45 dakikada 2 dakika kalkma egzersizini öğretin.",
        ],
      },
      {
        id: "wp-a3",
        label: "Haftalık planlayıcı oluşturma",
        subSkill: "Planlama ve organizasyon",
        activityType: "Yapılandırılmış planlama",
        description: "Renk kodlu haftalık takvim ile görev, aktivite ve mola dengelemesi; önceliklendirme ve enerji yönetimi entegrasyonu.",
        difficulty: "kolay",
        sessionMinutes: 20,
        materials: ["Haftalık planlayıcı (kağıt veya dijital)", "Renkli kalemler"],
        homeExercise: true,
        goals: ["wp-g3"],
        evidenceBase: "Harici bellek stratejileri (ajanda, planlayıcı) yürütücü işlev güçlüğü olan bireylerde üretkenliği artırır (Sohlberg & Mateer, 2001). OT'de anlamlı aktivite planlaması katılım kalitesiyle doğrudan ilişkilidir.",
        therapistTips: [
          "Enerji seviyesini renk kodlayın: kırmızı = yüksek enerji gerektiren görev.",
          "Olası kesintiler için haftalık %20 boş zaman bırakın.",
          "Hafta başında planlama ve hafta sonu gözden geçirme rutini oluşturun.",
        ],
      },
      {
        id: "wp-a4",
        label: "Dikkat dağıtıcı kontrolü – çevre düzenleme",
        subSkill: "Çevre düzenleme",
        activityType: "Çevre düzenleme",
        description: "Çalışma ortamındaki görsel, işitsel ve dijital dikkat dağıtıcıları analiz etme ve kişiye özgü kontrol stratejileri geliştirme.",
        difficulty: "kolay",
        sessionMinutes: 20,
        materials: ["Ortam kontrol listesi", "Gürültü önleyici kulaklık (gerekirse)"],
        homeExercise: true,
        goals: ["wp-g1", "wp-g2"],
        evidenceBase: "Bilişsel yük teorisi (Sweller, 1988) dikkat dağıtıcıların öğrenme ve performansı olumsuz etkilediğini gösterir. Açık ofis ortamında çalışma performansı üzerine yapılan araştırmalar sessiz / kontrollü ortam desteğini destekler.",
        therapistTips: [
          "Telefon bildirimleri kapatma, 'çalışma modu' ayarı önerin.",
          "Masa düzenini sade tutun; görsel karmaşa bilişsel yükü artırır.",
          "DEHB olan bireyler için özel stratejiler: arka plan müziği (beyaz/pembe gürültü) faydalı olabilir.",
        ],
      },
    ],
    suitableAgeGroups: ["6-12", "12-18", "18-30", "30-50"],
  },

  // ─── 7. Toplum ve Sosyal Katılım ───
  {
    key: "community-social",
    label: "Toplum ve Sosyal Katılım",
    icon: "handshake",
    color: "#f97316",
    description: "Bireylerin toplumsal yaşama aktif katılımını, sosyal rolleri sürdürmesini ve toplumsal engelleri aşmasını destekleyen ergoterapi.",
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
      {
        id: "cs-a1",
        label: "Toplum gezisi planlama ve uygulama",
        subSkill: "Toplum navigasyonu",
        activityType: "Toplumsal pratik",
        description: "Markete gidiş senaryosu: liste hazırlama, ulaşım planlama, alışveriş ve ödeme adımlarının bireysel veya destekli gerçekleştirilmesi.",
        difficulty: "orta",
        sessionMinutes: 45,
        materials: ["Alışveriş listesi şablonu", "Para / kart", "Ulaşım bilgi kartı"],
        homeExercise: true,
        goals: ["cs-g1"],
        evidenceBase: "Toplum temelli rehabilitasyon (CBR; WHO, 2010) gerçek yaşam ortamında uygulama transferini maksimize eder. Görev analizi ve gerçek ortam pratiği ADL genellemesini destekler (Law et al., 2011, CJOT).",
        therapistTips: [
          "İlk seanslarda gezi simülasyonu; sonrasında destekli gerçek gezi.",
          "Güvenlik planı oluşturun: kaybolursa ne yapacak, kime ulaşacak.",
          "Her görev adımını bağımsızlık ölçeğinde (FIM/EFA) kaydedin.",
        ],
      },
      {
        id: "cs-a2",
        label: "Hobi keşif ve deneme atölyesi",
        subSkill: "Boş zaman keşfi",
        activityType: "Yaratıcı aktivite",
        description: "Farklı hobi alanlarını (resim, müzik, bahçecilik, el sanatları) deneyimleyerek kişisel ilgi ve beceri alanlarını keşfetme.",
        difficulty: "kolay",
        sessionMinutes: 30,
        materials: ["Çeşitli malzeme setleri"],
        homeExercise: true,
        goals: ["cs-g3"],
        evidenceBase: "Anlamlı boş zaman aktivitesi katılımı yaşam kalitesi, ruh sağlığı ve sosyal bağlantıyla güçlü korelasyon gösterir (Wilcock, 2006, Occupational Perspective of Health). OT'de occupation-based yaklaşımın temel hedefi anlamlı aktivitelerdir.",
        therapistTips: [
          "Değer tespiti ile başlayın: 'Sizi neyin yaşatıyordu/mutlu ediyordu?'",
          "Deneme sürecinde başarı baskısı kurmayın; keşif odaklı kalın.",
          "Topluluk gruplarına (kurs, kulüp) yönlendirme ile sosyal boyut ekleyin.",
        ],
      },
      {
        id: "cs-a3",
        label: "Rol yapma – günlük sosyal senaryolar",
        subSkill: "Para ve alışveriş yönetimi",
        activityType: "Sosyal beceri çalışması",
        description: "Restoran siparişi, eczane iletişimi veya banka işlemi gibi günlük sosyal durumları canlandırarak iletişim ve problem çözme pratiği.",
        difficulty: "orta",
        sessionMinutes: 25,
        materials: ["Senaryo kartları", "Rol malzemeleri"],
        homeExercise: false,
        goals: ["cs-g1", "cs-g2"],
        evidenceBase: "Rol yapma sosyal beceri öğretiminin kanıt temelli bir bileşenidir (Bellack et al., 2004, Social Skills Training for Schizophrenia). Model + pratik + geri bildirim döngüsü en yüksek öğrenme transferi sağlar.",
        therapistTips: [
          "Ergoterapist önce modeli canlandırır, sonra danışan uygular.",
          "Video kaydı (onaylı) ile kendi performansı izleme güçlü geri bildirim sağlar.",
          "Senaryo zorluğunu kademeli artırın: kolay alışveriş → zor/stresli durum.",
        ],
      },
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

const ALL_WEEK_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/**
 * @param domainKey - Terapi alanı
 * @param selectedDays - Seçili gün isimleri (örn. ["Pazartesi", "Çarşamba"]).
 *   Belirtilmezse varsayılan olarak Pazartesi / Çarşamba / Cuma kullanılır.
 */
export function generateWeeklyPlanSuggestion(
  domainKey: TherapyDomainKey,
  selectedDays?: string[]
): TherapyPlanSuggestion | null {
  const domain = getDomainByKey(domainKey);
  if (!domain) return null;

  const days = selectedDays && selectedDays.length > 0 ? selectedDays : ["Pazartesi", "Çarşamba", "Cuma"];
  const gameMappings = getGameMappingsForDomain(domainKey);
  const activities = domain.activities;
  const homeExercises = activities.filter((a) => a.homeExercise);

  const keyActivities = activities.slice(0, 3).map((a) => a.label);
  const digitalGames = gameMappings.slice(0, 2).map((m) => m.gameKey);
  const homeEx = homeExercises.length > 0 ? homeExercises[0].label : "Ev programı belirlenecek";

  const weeklyPlan: WeeklyPlanTemplate = {
    mainGoal: domain.goals[0]?.label ?? "Hedef belirlenecek",
    keyActivities,
    digitalGames,
    homeExercise: homeEx,
    sessionNotes: "Danışanın katılımı, performansı ve enerji düzeyi gözlemlenecek. İlerleme not formuna işlenecek.",
  };

  const dayObservations = [
    "Dikkat süresi ve başlangıç katılım düzeyi değerlendirilecek.",
    "Önceki seansa göre performans karşılaştırması yapılacak.",
    "Haftalık ilerleme ve hedef değerlendirmesi yapılacak.",
    "Yeni aktivite başlatılacak; adaptasyon düzeyi kaydedilecek.",
    "Motivasyon ve katılım kalitesi not edilecek.",
    "Ev programı uyumu değerlendirilecek.",
    "Aile/bakıcı geri bildirimi alınacak.",
  ];

  const dayStructure: DayPlanTemplate[] = days.map((dayLabel, i) => ({
    dayLabel,
    activity: activities[i % activities.length]?.label ?? activities[0]?.label ?? "Aktivite",
    game: digitalGames[i % digitalGames.length] ?? gameMappings[i % gameMappings.length]?.gameKey ?? "memory",
    observation: dayObservations[i % dayObservations.length],
  }));

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
