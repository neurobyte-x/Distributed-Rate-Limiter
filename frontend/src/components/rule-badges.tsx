"use client";

import type { AlgorithmType, ScopeType } from "@/lib/types";
import { ALGORITHM_MAP, SCOPE_MAP } from "@/lib/rule-meta";
import { cn } from "@/lib/utils";

export function AlgorithmBadge({
  value,
  className,
}: {
  value: AlgorithmType | string;
  className?: string;
}) {
  const meta = ALGORITHM_MAP[value];
  if (!meta) {
    return (
      <span className={cn("inline-flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]", className)}>
        {value}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        meta.badge,
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.short}
    </span>
  );
}

export function ScopeBadge({
  value,
  className,
  showDot = true,
}: {
  value: ScopeType | string;
  className?: string;
  showDot?: boolean;
}) {
  const meta = SCOPE_MAP[value];
  if (!meta) {
    return <span className={className}>{value}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        meta.badge,
        className,
      )}
    >
      {showDot ? <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} /> : null}
      {meta.short}
    </span>
  );
}

export function IdentifierChip({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[220px] items-center truncate rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]",
        className,
      )}
      title={children}
    >
      {children}
    </span>
  );
}
