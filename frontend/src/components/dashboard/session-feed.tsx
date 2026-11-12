"use client";

import {
  ArrowRight,
  CircleCheck,
  CircleX,
  FlaskConical,
  History,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { ALGORITHM_MAP } from "@/lib/rule-meta";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import { useNow } from "@/lib/hooks";
import { useActivity } from "@/providers/activity-provider";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/primitives";

export function SessionFeed({ className }: { className?: string }) {
  const { entries, clear } = useActivity();
  const now = useNow();

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader
        icon={History}
        title="Session activity"
        description="Requests sent through this console, kept for this browser session."
        action={
          <div className="flex items-center gap-1">
            {entries.length > 0 ? (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium text-[var(--faint)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
              >
                <Trash2 className="size-3" />
                Clear
              </button>
            ) : null}
            <Link
              href="/playground"
              className="inline-flex items-center gap-1 px-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              Run checks
              <ArrowRight className="size-3" />
            </Link>
          </div>
        }
      />

      <div className="mt-3 flex-1">
        {entries.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No traffic yet"
            description="Run a check from the quick panel or the playground to see live decisions stream in here."
            action={
              <Link
                href="/playground"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Open playground
                <ArrowRight className="size-3" />
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {entries.slice(0, 8).map((entry) => {
              const algorithm = ALGORITHM_MAP[entry.algorithm];
              const tone =
                entry.decision === "allowed" ? "emerald" : entry.decision === "blocked" ? "rose" : "amber";
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--surface-2)]/60"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border",
                      entry.decision === "allowed" &&
                        "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                      entry.decision === "blocked" && "border-rose-500/20 bg-rose-500/10 text-rose-500",
                      entry.decision === "error" && "border-amber-500/20 bg-amber-500/10 text-amber-500",
                    )}
                  >
                    {entry.decision === "allowed" ? (
                      <CircleCheck className="size-3.5" />
                    ) : entry.decision === "blocked" ? (
                      <ShieldAlert className="size-3.5" />
                    ) : (
                      <CircleX className="size-3.5" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-[11px] text-[var(--text)]" title={entry.endpoint}>
                        {entry.endpoint}
                      </span>
                      <Badge tone={tone} className="hidden sm:inline-flex">
                        {entry.httpStatus || "ERR"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-[var(--faint)]">
                      <span>{algorithm?.label ?? entry.algorithm}</span>
                      <span aria-hidden>·</span>
                      <span>
                        remaining{" "}
                        <span className="font-mono tabular">
                          {entry.remaining >= 9_000_000_000_000_000_000
                            ? "∞"
                            : formatNumber(entry.remaining)}
                        </span>
                      </span>
                      <span aria-hidden>·</span>
                      <span className="capitalize">{entry.source}</span>
                    </p>
                  </div>

                  <span className="shrink-0 font-mono text-[10px] text-[var(--faint)] tabular">
                    {formatRelativeTime(entry.at)}
                    {now ? "" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {entries.length > 0 ? (
        <div className="border-t border-[var(--border)] px-5 py-2.5">
          <p className="text-[10px] text-[var(--faint)]">
            Showing {Math.min(entries.length, 8)} of {entries.length} checks · stored in sessionStorage
          </p>
        </div>
      ) : null}
    </Card>
  );
}

export function SessionSummary({ className }: { className?: string }) {
  const { stats, clear } = useActivity();
  const total = stats.total;
  const allowedShare = total ? stats.allowed / total : 0;
  const blockedShare = total ? stats.blocked / total : 0;
  const circumference = 2 * Math.PI * 54;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        icon={CircleCheck}
        title="Session snapshot"
        description="Outcomes for checks sent from this browser."
        action={
          total > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-[11px] font-medium text-[var(--faint)] transition-colors hover:text-[var(--text)]"
            >
              Reset
            </button>
          ) : null
        }
      />

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-5 pt-2">
        <div className="relative flex items-center justify-center">
          <svg viewBox="0 0 132 132" className="size-[132px] -rotate-90">
            <circle
              cx="66"
              cy="66"
              r="54"
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="10"
            />
            {stats.allowed > 0 ? (
              <circle
                cx="66"
                cy="66"
                r="54"
                fill="none"
                stroke="#34d399"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${allowedShare * circumference} ${circumference}`}
                className="transition-all duration-700"
              />
            ) : null}
            {stats.blocked > 0 ? (
              <circle
                cx="66"
                cy="66"
                r="54"
                fill="none"
                stroke="#fb7185"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${blockedShare * circumference} ${circumference}`}
                strokeDashoffset={-allowedShare * circumference}
                className="transition-all duration-700"
              />
            ) : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-2xl font-semibold tracking-tight text-[var(--text)]">
              {total ? `${stats.blockRate}%` : "—"}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">
              blocked
            </span>
          </div>
        </div>

        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <div className="card-inset p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Allowed
            </div>
            <p className="mt-1 tabular text-lg font-semibold leading-none text-[var(--text)]">
              {stats.allowed}
            </p>
          </div>
          <div className="card-inset p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
              <span className="size-1.5 rounded-full bg-rose-400" />
              Blocked
            </div>
            <p className="mt-1 tabular text-lg font-semibold leading-none text-[var(--text)]">
              {stats.blocked}
            </p>
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] leading-relaxed text-[var(--faint)]">
          {total
            ? `${total} checks across ${stats.endpoints} endpoint${stats.endpoints === 1 ? "" : "s"}${
                stats.errors ? ` · ${stats.errors} failed` : ""
              }`
            : "Send your first check to build a session snapshot."}
        </p>
      </div>
    </Card>
  );
}
