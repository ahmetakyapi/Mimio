"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 rounded-2xl mx-4 my-6"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-line)",
          }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-(--color-text-strong) font-bold text-base m-0 mb-1">
            Bir hata oluştu
          </h3>
          <p className="text-(--color-text-soft) text-sm text-center m-0 mb-4 max-w-sm">
            Bu bileşen beklenmedik bir hata ile karşılaştı. Sayfayı yenilemeyi deneyin.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}>
            Tekrar Dene
          </button>
          {this.state.error && (
            <details className="mt-4 w-full max-w-md">
              <summary className="text-xs text-(--color-text-muted) cursor-pointer">
                Hata detayı
              </summary>
              <pre className="text-xs text-(--color-accent-red) mt-2 p-3 rounded-lg overflow-auto"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
