/**
 * Standart ergoterapi çıktı ölçütleri.
 *
 * Bir terapi hedefi ancak ölçülebiliyorsa savunulabilir. Bu katalog,
 * Mimio'nun önerdiği her hedefin yanına "bunu hangi standart araçla
 * ölçersin?" sorusunun cevabını koyar.
 *
 * Buradaki eşik ve aralıkların tamamı kaynak gösterilmiştir; hiçbir değer
 * tahmin değildir. Kaynak künyeleri `source` alanında tutulur ve arayüzde
 * kullanıcıya gösterilir — terapist rakamı kendi doğrulayabilmelidir.
 */

import type { AgeGroupKey, TherapyDomainKey } from "@/lib/therapy-program-data";

export type MeasureKind =
  | "occupational-performance"
  | "goal-attainment"
  | "motor"
  | "sensory"
  | "cognitive"
  | "balance-falls"
  | "independence";

export interface OutcomeMeasure {
  readonly id: string;
  /** Kısaltma — klinik yazışmada kullanılan biçim */
  readonly abbr: string;
  readonly name: string;
  readonly kind: MeasureKind;
  /** Hangi yaş gruplarında uygulanır */
  readonly ageGroups: readonly AgeGroupKey[];
  /** Hangi terapi alanlarında anlamlı */
  readonly domains: readonly TherapyDomainKey[];
  /** Ne ölçtüğü — tek cümle */
  readonly measures: string;
  /** Uygulama biçimi ve süresi */
  readonly administration: string;
  /** Yorumlama eşikleri — kaynaklı */
  readonly interpretation: readonly string[];
  /** Kaynak künyesi */
  readonly source: string;
  /** Kullanırken dikkat edilecek sınırlılık */
  readonly caveat?: string;
}

export const OUTCOME_MEASURES: readonly OutcomeMeasure[] = [
  {
    id: "copm",
    abbr: "COPM",
    name: "Kanada Okupasyonel Performans Ölçümü",
    kind: "occupational-performance",
    ageGroups: ["6-12", "12-18", "18-30", "30-50", "50-65", "65+"],
    domains: ["pediatric", "mental-health", "neurological", "neurodiversity", "geriatric", "work-productivity", "community-social"],
    measures: "Danışanın kendi belirlediği günlük yaşam sorunlarında algıladığı performans ve memnuniyet.",
    administration: "Yarı yapılandırılmış görüşme, 20-40 dk. Danışan en fazla 5 sorun alanı seçer, her birini performans ve memnuniyet için 1-10 arası puanlar.",
    interpretation: [
      "Puanlar 1-10 arası; başlangıç ve bitişte alınıp fark hesaplanır.",
      "Klasik eşik 2 puanlık değişimdir, ancak bu 1994'teki tek bir yetişkin ruh sağlığı örnekleminden gelir ve evrensel değildir.",
      "Popülasyona göre değişir: ortopedik diz/ayak bileği sorunlarında 3,5; rehabilitasyondaki yaşlı bireylerde performans için 3,0 ve memnuniyet için 3,2 puan önerilmiştir.",
      "Eşiği tanı, başlangıç şiddeti ve tedavi bağlamıyla birlikte yorumlayın.",
    ],
    source: "McColl ve ark. (2023), Can J Occup Ther — 'A Clinically Significant Difference on the COPM: A Review'",
    caveat: "2 puanlık değişimi otomatik 'klinik anlamlı' saymayın; alanyazın bu varsayımı desteklemiyor.",
  },
  {
    id: "gas",
    abbr: "GAS",
    name: "Hedefe Ulaşma Ölçeklemesi",
    kind: "goal-attainment",
    ageGroups: ["0-3", "3-6", "6-12", "12-18", "18-30", "30-50", "50-65", "65+"],
    domains: ["pediatric", "mental-health", "neurological", "neurodiversity", "geriatric", "work-productivity", "community-social"],
    measures: "Danışana özel, önceden tanımlanmış hedeflere ulaşma derecesi.",
    administration: "Terapist her hedef için 5 kademeli beklenen sonuç yazar. Genellikle 2-4 hedef tanımlanır ve tek bir bileşik T-skoruna dönüştürülür.",
    interpretation: [
      "Kademe ölçeği: −2 beklenenden çok daha az · −1 beklenenden biraz az · 0 beklenen düzey · +1 beklenenden biraz fazla · +2 beklenenden çok fazla.",
      "T-skoru ortalama 50, standart sapma 10 olacak şekilde normalize edilir; 50 tam olarak beklenen düzeye ulaşıldığını gösterir.",
      "50'nin üzeri beklentiyi aşmayı, altı beklentinin gerisinde kalmayı gösterir.",
    ],
    source: "Turner-Stokes (2009), Clin Rehabil — 'Goal attainment scaling (GAS) in rehabilitation: a practical guide'",
    caveat: "Hedef kademelerini yazmak eğitim ister; kötü kalibre edilmiş kademeler skoru anlamsızlaştırır.",
  },
  {
    id: "mabc2",
    abbr: "MABC-2",
    name: "Çocuklar için Hareket Değerlendirme Bataryası (2. Baskı)",
    kind: "motor",
    ageGroups: ["3-6", "6-12", "12-18"],
    domains: ["pediatric", "neurodiversity"],
    measures: "El becerisi, top becerileri ve denge alanlarında motor yeterlik.",
    administration: "Performans temelli, 20-40 dk. Üç yaş bandı: 3-6, 7-10 ve 11-16 yaş. Her bantta 8 görev, 3 alan.",
    interpretation: [
      "≤ 5. persentil: belirgin motor bozukluk (kırmızı bölge).",
      "5.-15. persentil arası: motor bozukluk riski (turuncu bölge).",
      "> 15. persentil: yaşa uygun aralık (yeşil bölge).",
      "5 yaş ve üzeri için ≤ 16. persentil, 3-5 yaş için ≤ 5. persentil kesme noktası önerilir.",
    ],
    source: "Henderson, Sugden & Barnett (2007); kesme noktaları: Jary ve ark. (2017), Dev Med Child Neurol",
  },
  {
    id: "sp2",
    abbr: "SP-2",
    name: "Duyu Profili 2 — Bakım Veren Formu",
    kind: "sensory",
    ageGroups: ["3-6", "6-12", "12-18"],
    domains: ["pediatric", "neurodiversity"],
    measures: "Çocuğun duyusal işleme örüntüleri; nörolojik eşik ve davranışsal yanıt eksenlerinde.",
    administration: "Bakım veren tarafından doldurulan 86 maddelik anket (3-14 yaş). Yaklaşık 15-25 dk.",
    interpretation: [
      "Dört çeyrek: Arayan (girdiyi arttırma), Kaçınan (girdiden rahatsız olma), Duyarlı (girdiyi fazla fark etme), Kaydetmeyen (girdiyi kaçırma).",
      "Çeyrekler Dunn'ın Duyusal İşleme Çerçevesi'ne dayanır: nörolojik eşik (yüksek/düşük) × davranışsal yanıt (aktif/pasif).",
      "Sonuç bir tanı değil, müdahale planını yönlendiren bir örüntü haritasıdır.",
    ],
    source: "Dunn (2014), Sensory Profile 2, Pearson",
    caveat: "Bakım veren bildirimine dayanır; gözlem ve performans verisiyle birlikte yorumlanmalı.",
  },
  {
    id: "moca",
    abbr: "MoCA",
    name: "Montreal Bilişsel Değerlendirme",
    kind: "cognitive",
    ageGroups: ["18-30", "30-50", "50-65", "65+"],
    domains: ["neurological", "geriatric", "mental-health"],
    measures: "Dikkat, yürütücü işlev, bellek, dil, görsel-uzamsal beceri ve yönelim taraması.",
    administration: "Uygulayıcı yönetiminde, yaklaşık 10 dk, 30 puan üzerinden.",
    interpretation: [
      "Klasik kesme noktası < 26: hafif bilişsel bozukluk veya demans şüphesi.",
      "< 26'da duyarlılık %93,7 ancak özgüllük %58,8 — yani yanlış pozitif oranı yüksektir.",
      "< 24'te duyarlılık %79,5 / özgüllük %83,7; < 23'te duyarlılık %73,5 / özgüllük %91,3.",
      "12 yıl ve altı eğitim için +1 puan düzeltmesi uygulanır.",
    ],
    source: "Nasreddine ve ark. (2005); tanısal doğruluk: Islam ve ark. (2023), Alzheimers Dement",
    caveat: "Tarama aracıdır, tanı koydurmaz. 26 kesme noktası ileri yaş ve düşük eğitimde yanlış pozitifi arttırır.",
  },
  {
    id: "bbs",
    abbr: "BBS",
    name: "Berg Denge Ölçeği",
    kind: "balance-falls",
    ageGroups: ["50-65", "65+"],
    domains: ["geriatric", "neurological"],
    measures: "Statik ve dinamik denge; düşme riski.",
    administration: "14 görev, her biri 0-4 puan, toplam 56. Yaklaşık 15-20 dk.",
    interpretation: [
      "56: işlevsel denge.",
      "41-56: düşük düşme riski.",
      "21-40: orta düşme riski, yardımcı cihaz gerekebilir.",
      "0-20: yüksek risk, mobilizasyonda belirgin yardım gerekir.",
      "45/56 kesme noktası bağımsız güvenli ambulasyon için kullanılır (duyarlılık %64, özgüllük %90).",
    ],
    source: "Berg ve ark. (1992); kesme noktası: Riddle & Stratford (1999); sistematik derleme: Lima ve ark. (2018), Braz J Phys Ther",
    caveat: "Tek başına kullanılmamalı; düşme öyküsü ve diğer ölçümlerle birlikte yorumlanmalı. Alanyazında kesme noktaları 45-51 arasında değişiyor.",
  },
] as const;

export function getMeasuresForDomain(
  domainKey: TherapyDomainKey,
  ageGroup?: AgeGroupKey,
): OutcomeMeasure[] {
  return OUTCOME_MEASURES.filter(
    (measure) =>
      measure.domains.includes(domainKey) &&
      (!ageGroup || measure.ageGroups.includes(ageGroup)),
  );
}

export function getMeasureById(id: string): OutcomeMeasure | undefined {
  return OUTCOME_MEASURES.find((measure) => measure.id === id);
}

export const MEASURE_KIND_LABELS: Record<MeasureKind, string> = {
  "occupational-performance": "Okupasyonel performans",
  "goal-attainment": "Hedefe ulaşma",
  motor: "Motor beceri",
  sensory: "Duyusal işleme",
  cognitive: "Biliş",
  "balance-falls": "Denge & düşme",
  independence: "Bağımsızlık",
};
