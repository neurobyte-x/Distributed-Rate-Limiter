"use client";

import { ArrowRight, ListChecks, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ApiError } from "@/lib/api";
import { AlgorithmBadge, ScopeBadge } from "@/components/rule-badges";
import {
  Card,
  CardHeader,
  EmptyState,
  buttonStyles,
  Switch,
  Skeleton,
} from "@/components/ui/primitives";
import { useRules } from "@/providers/rules-provider";
import { useToast } from "@/providers/toast-provider";
import { cn, describeLimit, shortId } from "@/lib/utils";
import type { RateLimitRule } from "@/lib/types";

export function ActiveRules({ className }: { className?: string }) {
  const { rules, status, refresh, refreshing, toggleRule } = useRules();
  const { toast } = useToast();

  const sorted = useMemo(
    () =>
      [...rules].sort(
        (a, b) =>
          Number(b.enabled) - Number(a.enabled) ||
          (a.endpointPattern ?? "").localeCompare(b.endpointPattern ?? "") ||
          a.ruleId.localeCompare(b.ruleId),
      ),
    [rules],
  );

  async function handleToggle(rule: RateLimitRule) {
    try {
      await toggleRule(rule);
      toast({
        title: rule.enabled ? "Rule paused" : "Rule enabled",
        description: `${rule.algorithmType.replaceAll("_", " ").toLowerCase()} · ${
          rule.identifierValue ?? "all traffic"
        }`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Could not update rule",
        description: error instanceof ApiError ? error.message : "Try again in a moment.",
        variant: "error",
      });
    }
  }

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader
        icon={ListChecks}
        title="Live policies"
        description={
          rules.length
            ? `${rules.filter((rule) => rule.enabled).length} of ${rules.length} rules enforcing traffic`
            : "Rules evaluated in priority order on every request"
        }
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              aria-label="Refresh rules"
              className="flex size-7 items-center justify-center rounded-lg text-[var(--faint)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)] disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            </button>
            <Link
              href="/rules"
              className="inline-flex items-center gap-1 px-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              Manage
              <ArrowRight className="size-3" />
            </Link>
          </div>
        }
      />

      <div className="mt-3 flex-1">
        {status === "loading" ? (
          <div className="space-y-2 px-5 pb-5">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="mx-5 mb-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5">
            <p className="text-xs font-medium text-[var(--text)]">Rules are unavailable</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
              The console could not load policies from the backend. Check that the API and Redis are
              running.
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className={buttonStyles("secondary", "sm", "mt-2.5")}
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
              Retry
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No rules yet"
            description="Every request is currently allowed. Create a policy to start enforcing limits."
            action={
              <Link href="/rules?new=1" className={buttonStyles("primary", "sm")}>
                <Plus className="size-3.5" />
                Create a rule
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {sorted.slice(0, 6).map((rule) => (
              <li
                key={rule.ruleId}
                className={cn(
                  "group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--surface-2)]/60",
                  !rule.enabled && "opacity-60",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AlgorithmBadge value={rule.algorithmType} />
                    <ScopeBadge value={rule.scopeType} />
                    <span
                      className="truncate font-mono text-[11px] text-[var(--muted)]"
                      title={rule.identifierValue ?? "All traffic"}
                    >
                      {rule.identifierValue ?? "all traffic"}
                    </span>
                    {!rule.enabled ? (
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--faint)]">
                        paused
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--faint)]">
                    <span className="font-mono text-[var(--muted)]">{describeLimit(rule)}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate font-mono" title={rule.endpointPattern ?? "All endpoints"}>
                      {rule.endpointPattern ?? "all endpoints"}
                    </span>
                    <span aria-hidden className="hidden sm:inline">
                      ·
                    </span>
                    <span className="hidden sm:inline">#{shortId(rule.ruleId, 6)}</span>
                  </div>
                </div>
                <Switch
                  checked={rule.enabled}
                  onChange={() => void handleToggle(rule)}
                  label={`${rule.enabled ? "Pause" : "Enable"} rule ${rule.ruleId}`}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {status === "ready" && sorted.length > 6 ? (
        <div className="border-t border-[var(--border)] px-5 py-2.5">
          <Link
            href="/rules"
            className="text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            View all {sorted.length} policies
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
