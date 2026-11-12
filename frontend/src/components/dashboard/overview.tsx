"use client";

import {
  FlaskConical,
  Gauge,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button, buttonStyles, CopyButton } from "@/components/ui/primitives";
import { StatCard, StatFooter } from "@/components/dashboard/stat-cards";
import { QuickCheck } from "@/components/dashboard/quick-check";
import { ServiceCard } from "@/components/dashboard/service-card";
import { ActiveRules } from "@/components/dashboard/active-rules";
import { PolicyMix } from "@/components/dashboard/policy-mix";
import { SessionFeed, SessionSummary } from "@/components/dashboard/session-feed";
import { useActivity } from "@/providers/activity-provider";
import { useHealth } from "@/providers/health-provider";
import { useRules } from "@/providers/rules-provider";
import { cn, percent } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/types";

export function Overview() {
  const { rules, status, refresh, refreshing } = useRules();
  const { stats, entries } = useActivity();
  const health = useHealth();
  const [refreshingAll, setRefreshingAll] = useState(false);

  const rulesLoading = status === "loading";
  const rulesUnavailable = status === "error";
  const enabled = rules.filter((rule) => rule.enabled).length;
  const paused = rules.length - enabled;
  const enabledShare = percent(enabled, rules.length);

  async function refreshAll() {
    setRefreshingAll(true);
    try {
      await Promise.all([refresh(), health.refresh()]);
    } finally {
      setRefreshingAll(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span>Control plane</span>
            <span className="text-[var(--border-strong)]">/</span>
            <span className="text-emerald-700 dark:text-emerald-300">{health.label}</span>
          </span>
        }
        title="Rate limiting at a glance"
        description="Manage distributed limit policies, test enforcement against live traffic, and keep an eye on Redis-backed health."
        actions={
          <>
            <Button variant="secondary" onClick={() => void refreshAll()} loading={refreshingAll}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Link href="/playground" className={buttonStyles("primary")}>
              <FlaskConical className="size-4" />
              Playground
            </Link>
          </>
        }
      />

      {!health.loading && !health.reachable ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">The limiter backend is offline</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">
                Rules cannot be loaded or changed until the API is running. Start the stack, then retry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-2 py-1.5 font-mono text-[10px] text-[var(--muted)]">
              docker compose up --build
              <CopyButton value="docker compose up --build" size="icon" />
            </span>
            <Button variant="secondary" size="sm" onClick={() => void refreshAll()} loading={refreshingAll}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active policies"
          value={rulesLoading ? "" : rulesUnavailable ? "—" : enabled}
          suffix={
            rulesLoading || rulesUnavailable ? undefined : (
              <span className="text-[var(--faint)]">/ {rules.length}</span>
            )
          }
          icon={Gauge}
          tone="emerald"
          loading={rulesLoading}
          delay={0}
          footer={
            rulesUnavailable ? (
              <StatFooter dot tone="rose">
                Backend unreachable
              </StatFooter>
            ) : rulesLoading ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div className="skeleton h-full w-1/3" />
              </div>
            ) : rules.length === 0 ? (
              <StatFooter dot tone="neutral">
                No policies defined yet
              </StatFooter>
            ) : (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${enabledShare}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--faint)]">
                  {enabled} enforcing · {paused} paused
                </p>
              </div>
            )
          }
        />

        <StatCard
          label="Checks this session"
          value={stats.total}
          icon={FlaskConical}
          tone="sky"
          delay={60}
          footer={
            stats.total === 0 ? (
              <StatFooter dot tone="neutral">
                No requests sent yet
              </StatFooter>
            ) : (
              <div className="flex items-center gap-2.5">
                <TrafficStrip entries={entries} />
                <span className="shrink-0 text-[10px] text-[var(--faint)]">
                  {stats.endpoints} endpoint{stats.endpoints === 1 ? "" : "s"}
                </span>
              </div>
            )
          }
        />

        <StatCard
          label="Allowed"
          value={stats.allowed}
          icon={ShieldCheck}
          tone="emerald"
          delay={120}
          footer={
            stats.total === 0 ? (
              <StatFooter dot tone="neutral">
                Awaiting first check
              </StatFooter>
            ) : (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${percent(stats.allowed, stats.total)}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--faint)]">
                  {percent(stats.allowed, stats.total)}% of {stats.total} checks passed
                </p>
              </div>
            )
          }
        />

        <StatCard
          label="Blocked"
          value={stats.blocked}
          icon={ShieldAlert}
          tone="rose"
          delay={180}
          footer={
            stats.total === 0 ? (
              <StatFooter dot tone="neutral">
                No throttled requests
              </StatFooter>
            ) : stats.blocked === 0 ? (
              <StatFooter dot tone="emerald">
                All checks passed so far
              </StatFooter>
            ) : (
              <StatFooter dot tone="rose">
                {stats.blockRate}% block rate
                {stats.errors ? ` · ${stats.errors} failed` : ""}
              </StatFooter>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <QuickCheck className="xl:col-span-2" />
        <ServiceCard />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ActiveRules className="xl:col-span-2" />
        <PolicyMix />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SessionFeed className="xl:col-span-2" />
        <SessionSummary />
      </div>

      {refreshing ? (
        <p className="flex items-center justify-end gap-1.5 text-[10px] text-[var(--faint)]">
          <RefreshCw className="size-3 animate-spin" />
          Syncing rules…
        </p>
      ) : null}
    </div>
  );
}

function TrafficStrip({ entries }: { entries: ActivityEntry[] }) {
  const slice = entries.slice(0, 16).reverse();
  return (
    <div className="flex h-4 flex-1 items-end gap-[2px]" aria-hidden>
      {slice.map((entry) => (
        <span
          key={entry.id}
          title={`${entry.decision} · ${entry.endpoint}`}
          className={cn(
            "w-full min-w-[3px] rounded-[1px]",
            entry.decision === "allowed" && "bg-emerald-400/80",
            entry.decision === "blocked" && "bg-rose-400/90",
            entry.decision === "error" && "bg-amber-400/80",
          )}
          style={{
            height:
              entry.decision === "blocked"
                ? "100%"
                : entry.decision === "allowed"
                  ? `${45 + ((entry.id.charCodeAt(0) || 0) % 40)}%`
                  : "65%",
          }}
        />
      ))}
    </div>
  );
}
