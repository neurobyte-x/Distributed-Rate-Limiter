"use client";

import { Layers } from "lucide-react";
import { useMemo } from "react";
import { ALGORITHMS, SCOPES } from "@/lib/rule-meta";
import { cn, percent } from "@/lib/utils";
import { useRules } from "@/providers/rules-provider";
import { Card, CardHeader, Skeleton } from "@/components/ui/primitives";

export function PolicyMix({ className }: { className?: string }) {
  const { rules, status } = useRules();

  const algorithmRows = useMemo(
    () =>
      ALGORITHMS.map((algorithm) => ({
        ...algorithm,
        count: rules.filter((rule) => rule.algorithmType === algorithm.value).length,
      })).filter((row) => row.count > 0),
    [rules],
  );

  const scopeRows = useMemo(
    () =>
      SCOPES.map((scope) => ({
        ...scope,
        count: rules.filter((rule) => rule.scopeType === scope.value).length,
      })).filter((row) => row.count > 0),
    [rules],
  );

  const enabled = rules.filter((rule) => rule.enabled).length;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        icon={Layers}
        title="Policy mix"
        description="How your enforcement is distributed."
        action={
          rules.length ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
              {rules.length} total
            </span>
          ) : null
        }
      />

      <div className="flex-1 px-5 pb-5 pt-4">
        {status === "loading" ? (
          <div className="space-y-3">
            <Skeleton className="h-2.5 w-full rounded-full" />
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-7 w-full" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
            <div className="relative flex size-16 items-center justify-center rounded-full border border-dashed border-[var(--border-strong)]">
              <Layers className="size-5 text-[var(--faint)]" />
            </div>
            <p className="mt-3 text-xs font-medium text-[var(--muted)]">No policies to compose</p>
            <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-[var(--faint)]">
              Algorithms and scopes will be charted here once you create a rule.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                {algorithmRows.map((row) => (
                  <span
                    key={row.value}
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(4, percent(row.count, rules.length))}%`,
                      backgroundColor: row.color,
                    }}
                  />
                ))}
              </div>

              <ul className="mt-3 space-y-2">
                {algorithmRows.map((row) => (
                  <li key={row.value} className="flex items-center gap-2 text-[11px]">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                    <span className="flex-1 text-[var(--muted)]">{row.label}</span>
                    <span className="font-mono text-[var(--faint)] tabular">
                      {row.count} · {percent(row.count, rules.length)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hairline" />

            <div>
              <div className="flex items-center justify-between">
                <p className="eyebrow">Scopes</p>
                <span className="font-mono text-[10px] text-[var(--faint)]">
                  {enabled} enforcing
                </span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {scopeRows.map((row) => (
                  <li key={row.value}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-[var(--muted)]">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                        {row.label}
                      </span>
                      <span className="font-mono text-[var(--faint)] tabular">{row.count}</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent(row.count, rules.length)}%`,
                          backgroundColor: row.color,
                          opacity: 0.75,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
