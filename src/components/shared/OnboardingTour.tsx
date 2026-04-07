"use client";

import { useState, useEffect } from "react";
import { ArrowRight, X, Users, Gamepad2, Stethoscope, BarChart3, Sparkles, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ONBOARDING_KEY = "mimio-onboarding-completed-v1";

interface TourStep {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Mimio'ya Hoş Geldiniz!",
    description: "Ergoterapistler için tasarlanmış interaktif seans yönetim platformu. Danışanlarınızla oyun tabanlı seanslar düzenleyin, ilerlemeyi takip edin.",
    icon: Sparkles,
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    tip: "Bu tur her adımı tanıtacak — istediğiniz zaman atlayabilirsiniz.",
  },
  {
    title: "Danışan Yönetimi",
    description: "Danışanlarınızı ekleyin, profillerini düzenleyin, yaş grubu ve hedeflerini belirleyin. Her danışan için ayrı notlar ve haftalık planlar oluşturun.",
    icon: Users,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    tip: "CSV dosyasıyla toplu danışan aktarımı yapabilirsiniz.",
  },
  {
    title: "İnteraktif Oyunlar",
    description: "7 farklı oyun türüyle motor beceri, hafıza, görsel algı ve bilişsel yetenekleri değerlendirin. Her oyun otomatik olarak skorlanır.",
    icon: Gamepad2,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #2563eb)",
    tip: "Klavye kısayolları için ? tuşuna basın. A/B ile oyunlar arası geçiş yapın.",
  },
  {
    title: "Terapi Programları",
    description: "Kanıta dayalı terapi protokolleri, haftalık plan oluşturma ve danışan bazlı ilerleme takibi. SOAP notu desteği ile profesyonel dokümantasyon.",
    icon: Stethoscope,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    tip: "Terapi protokollerini haftalık planlara otomatik aktarabilirsiniz.",
  },
  {
    title: "Raporlar ve Analitik",
    description: "Skor trendleri, aktivite ısı haritası, oyun bazlı performans ve danışan karşılaştırmaları. PDF ve CSV dışa aktarım ile rapor oluşturun.",
    icon: BarChart3,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    tip: "Danışan detay sayfasından tek tıkla PDF rapor yazdırabilirsiniz.",
  },
];

export function OnboardingTour({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (!completed) setVisible(true);
    } catch { /* ignore */ }
  }, []);

  function handleComplete() {
    try { localStorage.setItem(ONBOARDING_KEY, new Date().toISOString()); } catch { /* ignore */ }
    setVisible(false);
    onComplete?.();
  }

  function handleSkip() {
    handleComplete();
  }

  function handleNext() {
    if (step >= TOUR_STEPS.length - 1) {
      handleComplete();
    } else {
      setStep(s => s + 1);
    }
  }

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-[calc(100vw-32px)] sm:max-w-md rounded-3xl border overflow-hidden" style={{
        background: "var(--color-surface-strong)",
        borderColor: `${current.color}33`,
        boxShadow: `0 0 80px ${current.color}15`,
        animation: "page-fade-in 0.3s ease",
      }}>
        {/* Gradient top bar */}
        <div className="h-1.5 w-full" style={{ background: current.gradient }} />

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all duration-300" style={{
                  width: i === step ? 24 : 8,
                  background: i <= step ? current.gradient : "rgba(255,255,255,0.08)",
                }} />
              ))}
            </div>
            <button type="button" onClick={handleSkip} className="text-xs font-semibold bg-transparent border-none cursor-pointer text-(--color-text-muted) hover:text-(--color-text-body) transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{
            background: current.gradient,
            boxShadow: `0 8px 32px ${current.color}40`,
          }}>
            <Icon size={28} className="text-white" />
          </div>

          {/* Content */}
          <h2 className="text-xl font-extrabold text-(--color-text-strong) text-center m-0 mb-2">{current.title}</h2>
          <p className="text-sm text-(--color-text-soft) text-center m-0 mb-4 leading-relaxed">{current.description}</p>

          {/* Tip box */}
          <div className="rounded-xl px-4 py-3 mb-5" style={{ background: `${current.color}08`, border: `1px solid ${current.color}18` }}>
            <p className="text-xs m-0" style={{ color: current.color }}>
              <strong>İpucu:</strong> {current.tip}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="px-4 py-3 rounded-xl text-sm font-semibold border cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "transparent", borderColor: "var(--color-line)", color: "var(--color-text-soft)" }}>
                Geri
              </button>
            )}
            <button type="button" onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: current.gradient, boxShadow: `0 4px 20px ${current.color}40` }}>
              {isLast ? (
                <><CheckCircle size={16} /> Başlayalım!</>
              ) : (
                <>Sonraki <ArrowRight size={14} /></>
              )}
            </button>
          </div>

          {/* Skip link */}
          {!isLast && (
            <button type="button" onClick={handleSkip}
              className="w-full text-center text-xs text-(--color-text-muted) mt-3 bg-transparent border-none cursor-pointer hover:text-(--color-text-body) transition-colors">
              Turu atla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Reset function for testing
export function resetOnboarding() {
  try { localStorage.removeItem(ONBOARDING_KEY); } catch { /* ignore */ }
}
