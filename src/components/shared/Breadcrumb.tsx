"use client";

import { ChevronRight, Home } from "lucide-react";
import type { AppView } from "@/lib/platform-data";

interface BreadcrumbItem {
  label: string;
  view?: AppView;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (view: AppView) => void;
}

const VIEW_LABELS: Record<AppView, string> = {
  login: "Giriş",
  register: "Kayıt",
  dashboard: "Ana Panel",
  clients: "Danışanlar",
  "client-detail": "Danışan Detay",
  games: "Oyunlar",
  "therapy-program": "Terapi Programı",
  reports: "Raporlar",
};

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav aria-label="Gezinme yolu" className="flex items-center gap-1 text-xs overflow-x-auto scrollbar-none py-1">
      {/* Home */}
      <button
        type="button"
        onClick={() => onNavigate("dashboard")}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border-none cursor-pointer transition-colors bg-transparent text-(--color-text-muted) hover:text-(--color-text-body) hover:bg-(--color-surface-elevated) shrink-0"
        aria-label="Ana Panel"
      >
        <Home size={12} />
      </button>

      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 shrink-0">
            <ChevronRight size={10} className="text-(--color-text-disabled)" />
            {isLast ? (
              <span className="px-2 py-1 text-(--color-text-strong) font-semibold truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.view) onNavigate(item.view);
                }}
                className="px-2 py-1 rounded-lg border-none cursor-pointer transition-colors bg-transparent text-(--color-text-muted) hover:text-(--color-text-body) hover:bg-(--color-surface-elevated) truncate max-w-[80px] sm:max-w-[120px] md:max-w-[200px]"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// Helper to generate breadcrumb items from current view
export function getBreadcrumbItems(view: AppView, clientName?: string): BreadcrumbItem[] {
  switch (view) {
    case "dashboard":
      return [{ label: VIEW_LABELS.dashboard }];
    case "clients":
      return [{ label: VIEW_LABELS.clients }];
    case "client-detail":
      return [
        { label: VIEW_LABELS.clients, view: "clients" },
        { label: clientName ?? "Danışan" },
      ];
    case "games":
      return [{ label: VIEW_LABELS.games }];
    case "therapy-program":
      return [{ label: VIEW_LABELS["therapy-program"] }];
    case "reports":
      return [{ label: VIEW_LABELS.reports }];
    default:
      return [];
  }
}
