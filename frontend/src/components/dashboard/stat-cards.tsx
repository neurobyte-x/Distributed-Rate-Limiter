"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton, StatusDot } from "@/components/ui/primitives";

type Tone = "emerald" | "sky" | "rose" | "violet";

const toneStyles: Record<Tone, { icon: string; glow: string; dot: "emerald" | "sky" | "rose" | "neutral" }> = {
  emerald: {
    icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    glow: "bg-emerald-500/10",
    dot: "emerald",
  },
  sky: {
    icon: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    glow: "bg-sky-500/10",
    dot: "sky",
  },
  rose: {
    icon: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    glow: "bg-rose-500/10",
    dot: "rose",
  },
  violet: {
    icon: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300",
    glow: "bg-violet-500/10",
    dot: "neutral",
  },
};

export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
  footer,
  loading = false,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  icon: LucideIcon;
  tone: Tone;
  footer?: ReactNode;
  loading?: boolean;
  delay?: number;
}) {
  const styles = toneStyles[tone];

  return (
    <div
      className="card group relative overflow-hidden p-4 animate-rise sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 size-32 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100",
          styles.glow,
          "opacity-60",
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <span className="tabular text-[30px] font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">
                  {value}
                </span>
                {suffix ? <span className="text-xs text-[var(--faint)]">{suffix}</span> : null}
              </>
            )}
          </div>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", styles.icon)}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="relative mt-4 min-h-[26px]">{footer}</div>
    </div>
  );
}

export function StatFooter({
  children,
  dot = false,
  tone = "emerald",
}: {
  children: ReactNode;
  dot?: boolean;
  tone?: "emerald" | "sky" | "rose" | "neutral";
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
      {dot ? <StatusDot tone={tone} /> : null}
      <span>{children}</span>
    </div>
  );
}
