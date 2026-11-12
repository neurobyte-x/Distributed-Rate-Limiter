"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends Required<Omit<ToastInput, "variant">> {
  id: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_TTL = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description = "", variant = "success" }: ToastInput) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setItems((current) => [{ id, title, description, variant }, ...current].slice(0, 4));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_TTL),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-3.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] animate-scale-in"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border",
                  item.variant === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                  item.variant === "error" && "border-rose-500/30 bg-rose-500/10 text-rose-500",
                  item.variant === "info" && "border-sky-500/30 bg-sky-500/10 text-sky-500",
                )}
              >
                {item.variant === "success" ? (
                  <CheckCircle2 className="size-4" />
                ) : item.variant === "error" ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <Info className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--text)]">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 flex size-6 items-center justify-center rounded-md text-[var(--faint)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[shrink_4.5s_linear_forwards]",
                item.variant === "success" && "bg-emerald-500/60",
                item.variant === "error" && "bg-rose-500/60",
                item.variant === "info" && "bg-sky-500/60",
              )}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
