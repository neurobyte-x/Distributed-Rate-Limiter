"use client";

import {
  ArrowRight,
  Database,
  RefreshCw,
  Server,
  Timer,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useNow } from "@/lib/hooks";
import { useHealth } from "@/providers/health-provider";
import { Card, CardHeader, CopyButton, StatusDot } from "@/components/ui/primitives";

export function ServiceCard({ className }: { className?: string }) {
  const { report, label, healthy, reachable, refresh, history } = useHealth();
  const [refreshing, setRefreshing] = useState(false);
  const now = useNow(15_000);

  const redis = report?.body?.components?.redis;
  const redisStatus = redis?.status ?? "UNKNOWN";
  const componentCount = Object.keys(report?.body?.components ?? {}).length;
  const upComponents = Object.values(report?.body?.components ?? {}).filter(
    (component) => component.status === "UP",
  ).length;
  const maxLatency = Math.max(...history.map((probe) => probe.latencyMs), 1);

  const tone = label === "Operational" ? "emerald" : label === "Degraded" ? "amber" : "rose";
  const statusIcon = healthy ? Server : reachable ? TriangleAlert : WifiOff;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        icon={Server}
        title="Service health"
        description="Backend, Redis, and probe latency."
        action={
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            aria-label="Refresh service health"
            className="flex size-7 items-center justify-center rounded-lg text-[var(--faint)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)] disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          </button>
        }
      />

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border p-3.5",
            healthy && "border-emerald-500/25 bg-emerald-500/[0.06]",
            !healthy && reachable && "border-amber-500/25 bg-amber-500/[0.06]",
            !reachable && "border-rose-500/25 bg-rose-500/[0.06]",
          )}
        >
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = statusIcon;
              return (
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                    healthy && "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
                    !healthy && reachable && "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
                    !reachable && "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300",
                  )}
                >
                  <Icon className="size-5" />
                </span>
              );
            })()}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
                <StatusDot tone={tone} ping={healthy} />
              </div>
              <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                {healthy
                  ? "All systems nominal"
                  : reachable
                    ? "A dependency is reporting DOWN"
                    : "No response from the limiter"}
              </p>
            </div>
            {report?.latencyMs ? (
              <div className="text-right">
                <p className="font-mono text-sm font-semibold tabular text-[var(--text)]">
                  {report.latencyMs}
                  <span className="ml-0.5 text-[10px] font-normal text-[var(--faint)]">ms</span>
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--faint)]">probe</p>
              </div>
            ) : null}
          </div>
        </div>

        <dl className="mt-3.5 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40">
          <HealthRow
            icon={Database}
            label="Redis"
            value={
              redisStatus === "UNKNOWN" ? (
                <span className="text-[var(--faint)]">Not reported</span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot tone={redisStatus === "UP" ? "emerald" : "rose"} />
                  <span className="font-mono text-[11px]">{redisStatus}</span>
                </span>
              )
            }
          />
          <HealthRow
            icon={Server}
            label="Components"
            value={
              <span className="font-mono text-[11px]">
                {componentCount ? `${upComponents}/${componentCount} up` : "—"}
              </span>
            }
          />
          <HealthRow
            icon={Timer}
            label="Last probe"
            value={
              <span className="font-mono text-[11px] text-[var(--muted)]">
                {report?.checkedAt ? formatRelativeTime(report.checkedAt, now) : "—"}
              </span>
            }
          />
        </dl>

        {!reachable ? (
          <div className="mt-3.5 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)]/40 p-3">
            <p className="text-[11px] font-medium text-[var(--text)]">Start the backend</p>
            <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-3)] px-2 py-1.5">
              <code className="truncate font-mono text-[10px] text-[var(--muted)]">
                docker compose up --build
              </code>
              <CopyButton value="docker compose up --build" size="icon" />
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--faint)]">
              Or run <span className="font-mono">mvn spring-boot:run</span> with Redis on port 6379.
            </p>
          </div>
        ) : !healthy ? (
          <p className="mt-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[10px] leading-relaxed text-[var(--muted)]">
            Rule evaluation depends on Redis. Check the Redis container before sending live traffic.
          </p>
        ) : null}

        <div className="mt-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-[var(--muted)]">Probe latency</p>
            <span className="font-mono text-[9px] text-[var(--faint)]">
              {history.length ? `last ${history.length}` : "collecting"}
            </span>
          </div>
          <div className="mt-1.5 flex h-8 items-end gap-1">
            {Array.from({ length: Math.max(0, 16 - history.length) }).map((_, index) => (
              <span
                key={`pending-${index}`}
                aria-hidden
                className="h-1 flex-1 rounded-[2px] bg-[var(--surface-3)]"
              />
            ))}
            {history.map((probe, index) => (
              <span
                key={`${probe.at}-${index}`}
                title={`${probe.latencyMs}ms · ${probe.ok ? "healthy" : "failed"}`}
                className={cn(
                  "flex-1 rounded-[2px] transition-all duration-300",
                  probe.ok ? "bg-emerald-400/60" : "bg-rose-400/70",
                )}
                style={{
                  height: `${Math.max(14, Math.round((probe.latencyMs / maxLatency) * 100))}%`,
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--faint)]">
            <span>oldest</span>
            <span>now</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--faint)]">
            Spring Boot · Redis
          </span>
          <Link
            href="/status"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            System status
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function HealthRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
        <Icon className="size-3 text-[var(--faint)]" />
        {label}
      </dt>
      <dd className="text-[11px] text-[var(--text)]">{value}</dd>
    </div>
  );
}
