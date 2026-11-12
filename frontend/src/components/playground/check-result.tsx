"use client";

import {
  ArrowRight,
  ChevronRight,
  CircleAlert,
  CircleSlash,
  Database,
  Gauge,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { CheckOutcome } from "@/lib/api";
import { ALGORITHM_MAP } from "@/lib/rule-meta";
import type { RateLimitRule } from "@/lib/types";
import { cn, describeLimit, formatNumber, percent } from "@/lib/utils";
import { AlgorithmBadge, ScopeBadge } from "@/components/rule-badges";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyButton,
  ProgressBar,
  buttonStyles,
} from "@/components/ui/primitives";

export interface PlaygroundContext {
  userId: string;
  ipAddress: string;
  endpoint: string;
}

export function CheckResult({
  outcome,
  context,
  rules,
  pending,
  onRetry,
}: {
  outcome: CheckOutcome | null;
  context: PlaygroundContext;
  rules: RateLimitRule[];
  pending: boolean;
  onRetry: () => void;
}) {
  const ruleMap = new Map(rules.map((rule) => [rule.ruleId, rule]));
  const body = outcome?.body;
  const allowed = body?.allowed ?? false;
  const noRules = body?.algorithmUsed === "NONE";
  const algorithm = body?.algorithmUsed ? ALGORITHM_MAP[body.algorithmUsed] : undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={Gauge}
        title="Decision"
        description="What the distributed limiter returned for this context."
        action={
          outcome ? (
            <Badge tone={outcome.body ? (allowed ? "emerald" : "rose") : "amber"}>
              {outcome.body ? `HTTP ${outcome.httpStatus}` : "error"}
            </Badge>
          ) : null
        }
      />

      <div className="px-5 pb-5 pt-4">
        {!outcome ? (
          <EmptyDecision />
        ) : body ? (
          <div className="animate-fade-in">
            <div
              className={cn(
                "overflow-hidden rounded-xl border",
                allowed ? "border-emerald-500/25" : "border-rose-500/25",
              )}
            >
              <div
                className={cn(
                  "h-0.5 w-full bg-gradient-to-r",
                  allowed ? "from-emerald-500 via-teal-400 to-cyan-400" : "from-rose-500 via-red-400 to-orange-400",
                )}
              />
              <div className={cn("p-4", allowed ? "bg-emerald-500/[0.05]" : "bg-rose-500/[0.05]")}>
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full border",
                      allowed
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-500",
                    )}
                  >
                    {allowed ? <ShieldCheck className="size-5" /> : <CircleAlert className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                        {noRules ? "Allowed without a policy" : allowed ? "Request allowed" : "Request blocked"}
                      </h3>
                      <Badge tone={allowed ? "emerald" : "rose"}>
                        {allowed ? "passed" : "throttled"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
                      {noRules ? "No enabled rule matched this request, so the limiter allowed it." : body.message}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="font-mono text-sm font-semibold tabular text-[var(--text)]">
                      {outcome.latencyMs}
                      <span className="ml-0.5 text-[10px] font-normal text-[var(--faint)]">ms</span>
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">
                      round trip
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]/70 px-2.5 py-1.5">
                  <Badge tone="neutral">POST</Badge>
                  <span className="min-w-0 truncate font-mono text-[11px] text-[var(--text)]">
                    {context.endpoint}
                  </span>
                  {context.userId ? (
                    <span className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">
                      user:{context.userId}
                    </span>
                  ) : null}
                  {context.ipAddress ? (
                    <span className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">
                      ip:{context.ipAddress}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ResultMetric label="Remaining" value={noRules ? "∞" : formatNumber(body.remaining)} />
                  <ResultMetric
                    label="Retry after"
                    value={body.retryAfterSeconds > 0 ? `${body.retryAfterSeconds}s` : "—"}
                    tone={body.retryAfterSeconds > 0 ? "amber" : undefined}
                  />
                  <ResultMetric
                    label="Algorithm"
                    value={
                      noRules
                        ? "None"
                        : algorithm
                          ? algorithm.short
                          : body.algorithmUsed === "MULTIPLE"
                            ? "Multiple"
                            : body.algorithmUsed
                    }
                  />
                  <ResultMetric label="Rules evaluated" value={String(body.evaluations.length)} />
                </div>
              </div>
            </div>

            {noRules ? (
              <div className="mt-3 flex flex-col gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                  <p className="text-[11px] leading-relaxed text-[var(--muted)]">
                    Endpoint, user, or IP did not match any enabled rule. Create one to start enforcing a limit.
                  </p>
                </div>
                <Link href="/rules?new=1" className={buttonStyles("secondary", "sm", "shrink-0")}>
                  Create rule
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[var(--text)]">Rule evaluations</h4>
                  <span className="font-mono text-[10px] text-[var(--faint)]">
                    strictest outcome wins
                  </span>
                </div>
                <ul className="mt-2 space-y-2">
                  {body.evaluations.map((evaluation) => {
                    const rule = ruleMap.get(evaluation.ruleId);
                    const tokenBucket = evaluation.algorithm === "TOKEN_BUCKET";
                    const capacity = rule
                      ? tokenBucket
                        ? rule.burstCapacity ?? 0
                        : rule.limit
                      : 0;
                    const unlimited = evaluation.remaining >= 9_000_000_000_000_000_000;
                    const remainingPct = unlimited
                      ? 100
                      : capacity > 0
                        ? percent(Math.max(0, evaluation.remaining), capacity)
                        : 0;

                    return (
                      <li
                        key={evaluation.ruleId}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <AlgorithmBadge value={evaluation.algorithm} />
                            {rule ? <ScopeBadge value={rule.scopeType} /> : null}
                            <span className="truncate font-mono text-[10px] text-[var(--muted)]">
                              {rule?.identifierValue ?? "rule removed"}
                            </span>
                          </div>
                          <Badge tone={evaluation.allowed ? "emerald" : "rose"}>
                            {evaluation.allowed ? "passed" : "blocked"}
                          </Badge>
                        </div>

                        <div className="mt-2.5 flex items-center gap-3">
                          <ProgressBar
                            value={remainingPct}
                            tone={evaluation.allowed ? "emerald" : "rose"}
                            className="flex-1"
                          />
                          <span className="shrink-0 font-mono text-[10px] text-[var(--muted)] tabular">
                            {unlimited ? "∞" : formatNumber(evaluation.remaining)}
                            {capacity > 0 && !unlimited ? (
                              <span className="text-[var(--faint)]"> / {formatNumber(capacity)}</span>
                            ) : null}
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-[var(--faint)]">
                          {rule ? (
                            <>
                              <span className="font-mono">{describeLimit(rule)}</span>
                              <span aria-hidden>·</span>
                              <span className="font-mono">{rule.endpointPattern ?? "all endpoints"}</span>
                              <span aria-hidden>·</span>
                            </>
                          ) : null}
                          <span>{evaluation.message}</span>
                          {evaluation.retryAfterSeconds > 0 ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="text-amber-600 dark:text-amber-400">
                                retry in {evaluation.retryAfterSeconds}s
                              </span>
                            </>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <details className="group mt-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-medium text-[var(--muted)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-1.5">
                  <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
                  Raw response
                </span>
                <span className="font-mono text-[9px] text-[var(--faint)]">
                  JSON · {outcome.latencyMs}ms
                </span>
              </summary>
              <div className="relative border-t border-[var(--border)]">
                <CopyButton
                  value={JSON.stringify({ status: outcome.httpStatus, latencyMs: outcome.latencyMs, body }, null, 2)}
                  size="icon"
                  className="absolute right-2 top-2"
                />
                <pre className="max-h-64 overflow-auto p-3 pr-10 font-mono text-[10px] leading-relaxed text-[var(--muted)]">
                  {JSON.stringify({ status: outcome.httpStatus, latencyMs: outcome.latencyMs, body }, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.06] p-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <CircleSlash className="size-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-[var(--text)]">The check could not complete</h3>
              {outcome.httpStatus ? <Badge tone="rose">HTTP {outcome.httpStatus}</Badge> : null}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
              {outcome.error?.message ?? "The limiter did not return a response."}
            </p>
            {outcome.error?.details.length ? (
              <ul className="mt-2 space-y-1">
                {outcome.error.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-1.5 text-[11px] text-[var(--muted)]">
                    <CircleSlash className="mt-0.5 size-3 shrink-0 text-[var(--faint)]" />
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onRetry} disabled={pending}>
                <RotateCcw className="size-3.5" />
                Retry check
              </Button>
              {outcome.error?.offline ? (
                <span className="font-mono text-[10px] text-[var(--faint)]">docker compose up --build</span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function EmptyDecision() {
  const steps = [
    { icon: Send, label: "Request" },
    { icon: SlidersHorizontal, label: "Match rules" },
    { icon: Database, label: "Redis state" },
    { icon: ShieldCheck, label: "Decision" },
  ];

  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)]/40 px-4 py-8">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <span className="flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                  <Icon className="size-4" />
                </span>
                <span className="whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--faint)]">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <ChevronRight className="mb-4 size-3.5 shrink-0 text-[var(--border-strong)]" />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <p className="text-sm font-medium text-[var(--muted)]">Nothing evaluated yet</p>
        <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-[var(--faint)]">
          Fill in a request context and send a check. You will see the decision, remaining quota,
          retry guidance, and every rule that was evaluated.
        </p>
      </div>
    </div>
  );
}

function ResultMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber";
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-[0.08em] text-[var(--faint)]">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate font-mono text-[13px] font-semibold tabular",
          tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-[var(--text)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
