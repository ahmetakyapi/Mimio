/**
 * Oyun yönergeleri.
 *
 * Arena'daki en büyük metin, "şimdi ne yapmalıyım?" sorusunun cevabıdır.
 * Bu yüzden her yönerge: emir kipinde, tek eylem içeren, çocuğun da
 * anlayabileceği kısa bir cümledir. Durum bilgisi (skor, tur) yönergeye
 * karışmaz — o sayaçlarda durur.
 */

import type { ArenaCueState } from "@/components/game/GameArena";

export interface GameCue {
  readonly title: string;
  readonly note?: string;
  readonly state: ArenaCueState;
}

/** Doğru/yanlış geri bildirimi diğer her yönergenin önüne geçer. */
export function feedbackCue(correct: boolean, combo: number): GameCue {
  if (correct) {
    return {
      title: combo >= 3 ? `Doğru — ${combo} arka arkaya` : "Doğru",
      note: combo >= 5 ? "Seri devam ediyor, temponu koru." : undefined,
      state: "correct",
    };
  }
  return { title: "Bu değildi", note: "Sorun değil, bir sonraki turda tekrar dene.", state: "wrong" };
}

// ── Sıra Hafızası ──
export function memoryCue(
  phase: "idle" | "showing" | "ready" | "success" | "finished",
  sequenceLength: number,
): GameCue {
  if (phase === "showing") {
    return {
      title: "Sırayı izle",
      note: `${sequenceLength} kare tek tek yanacak. Yanma sırasını aklında tut.`,
      state: "watch",
    };
  }
  if (phase === "ready") {
    return {
      title: "Şimdi aynı sırayla dokun",
      note: "Kareleri yandıkları sırayla seç. Yanlış seçimde tur biter.",
      state: "act",
    };
  }
  if (phase === "success") {
    return { title: "Tur tamam", note: "Sıra bir kare daha uzuyor.", state: "correct" };
  }
  if (phase === "finished") {
    return { title: "Oyun bitti", note: "Sonucu kaydet veya yeniden başla.", state: "done" };
  }
  return {
    title: "Başlat'a bas ve sırayı izle",
    note: "Kareler sırayla yanacak, sonra aynı sırayı sen tekrarlayacaksın.",
    state: "idle",
  };
}

// ── Kart Eşle ──
export function pairsCue(
  phase: "idle" | "playing" | "finished",
  openCount: number,
  totalPairs: number,
  foundPairs: number,
): GameCue {
  if (phase === "playing") {
    if (openCount === 1) {
      return { title: "Eşini bulmak için bir kart daha aç", note: "Açtığın kartın yerini aklında tut.", state: "act" };
    }
    return {
      title: "İki kart aç ve aynı simgeleri eşle",
      note: `${totalPairs} çiftten ${foundPairs} tanesini buldun.`,
      state: "act",
    };
  }
  if (phase === "finished") {
    return { title: "Bütün çiftler bulundu", note: "Sonucu kaydet veya yeniden başla.", state: "done" };
  }
  return {
    title: "Başlat'a bas ve çiftleri bul",
    note: "Kartlar kapalı gelir. İki kart açıp aynı simgeleri eşleştireceksin.",
    state: "idle",
  };
}

// ── Mavi Nabız ──
export function pulseCue(phase: "idle" | "playing" | "finished", hasTarget: boolean): GameCue {
  if (phase === "playing") {
    return hasTarget
      ? { title: "Yanan kareye dokun", note: "Hızlı ol ama doğru kareyi seç.", state: "act" }
      : { title: "Bir sonraki hedefi bekle", state: "watch" };
  }
  if (phase === "finished") {
    return { title: "Tur bitti", note: "Sonucu kaydet veya yeniden başla.", state: "done" };
  }
  return {
    title: "Başlat'a bas ve yanan kareye dokun",
    note: "Her turda bir kare yanacak. Doğru kareye ne kadar hızlı dokunursan o kadar puan.",
    state: "idle",
  };
}

// ── Komut Rotası ──
export function routeCue(phase: "idle" | "playing" | "finished", commandLabel: string | null): GameCue {
  if (phase === "playing" && commandLabel) {
    return { title: `${commandLabel} okuna bas`, note: "Ortadaki komutu oku, doğru yönü seç.", state: "act" };
  }
  if (phase === "finished") {
    return { title: "Tur bitti", note: "Sonucu kaydet veya yeniden başla.", state: "done" };
  }
  return {
    title: "Başlat'a bas ve komutu izle",
    note: "Ortada bir yön yazacak. O yöne ait oka basacaksın.",
    state: "idle",
  };
}

// ── Fark Avcısı ──
export function differenceCue(phase: "idle" | "playing" | "finished"): GameCue {
  if (phase === "playing") {
    return { title: "Farklı olan kartı seç", note: "Kartlardan biri diğerlerine benzemiyor.", state: "act" };
  }
  if (phase === "finished") {
    return { title: "Tur bitti", note: "Sonucu kaydet veya yeniden başla.", state: "done" };
  }
  return {
    title: "Başlat'a bas ve farkı bul",
    note: "Her turda kartlardan yalnızca biri farklı olacak.",
    state: "idle",
  };
}

// ── Hedef Tarama ──
export function scanCue(phase: "idle" | "playing" | "finished", targetLabel: string): GameCue {
  if (phase === "playing") {
    return {
      title: targetLabel ? `"${targetLabel}" simgesini bul` : "Hedef simgeyi bul",
      note: "Hedef yukarıda gösteriliyor. Izgarada aynısını seç.",
      state: "act",
    };
  }
  if (phase === "finished") {
    return { title: "Tur bitti", note: "Sonucu kaydet veya yeniden başla.", state: "done" };
  }
  return {
    title: "Başlat'a bas ve hedefi ara",
    note: "Yukarıda bir simge gösterilecek, aynısını ızgarada bulacaksın.",
    state: "idle",
  };
}

// ── Dizi Mantık ──
export function logicCue(phase: "idle" | "playing" | "finished", ruleHint: string | null): GameCue {
  if (phase === "playing") {
    return {
      title: "Eksik kareye ne gelmeli?",
      note: ruleHint ? `İpucu: ${ruleHint}.` : "Satır ve sütunlardaki kuralı çöz.",
      state: "act",
    };
  }
  if (phase === "finished") {
    return { title: "Bulmaca bitti", note: "Sonucu kaydet veya yeniden başla.", state: "done" };
  }
  return {
    title: "Başlat'a bas ve örüntüyü çöz",
    note: "3×3 karede bir kural var. Eksik kareyi dört seçenek arasından bulacaksın.",
    state: "idle",
  };
}

/** Alt çubukta gösterilen klavye ipucu — her oyunda aynı. */
export const ARENA_KEYBOARD_HINT = "Yön tuşları: seç · Enter / Boşluk: onayla";
