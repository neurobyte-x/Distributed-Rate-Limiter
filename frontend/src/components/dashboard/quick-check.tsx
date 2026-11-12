"use client";

import {
  ArrowRight,
  CircleSlash,
  CircleX,
  Send,
  ShieldAlert,
  ShieldCheck,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { checkRateLimit, type CheckOutcome } from "@/lib/api";
import { ALGORITHM_MAP } from "@/lib/rule-meta";
import { cn, formatNumber } from "@/lib/utils";
import { useActivity } from "@/providers/activity-provider";
import { useRules } from "@/providers/rules-provider";
import { Badge, Button, Card, CardHeader, Field, Input } from "@/components/ui/primitives";

export function QuickCheck({ className }: { className?: string }) {
  const router = useRouter();
  const { rules } = useRules();
  const { record } = useActivity();
  const [endpoint, setEndpoint] = useState("/api/payments");
  const [userId, setUserId] = useState("user-123");
  const [ipAddress, setIpAddress] = useState("");
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);

  const endpoints = useMemo(
    () => Array.from(new Set(rules.map((rule) => rule.endpointPattern).filter(Boolean))) as string[],
    [rules],
  );

  function autofill() {
    const endpointPattern = rules.find((rule) => rule.enabled && rule.endpointPattern)?.endpointPattern;
    const userRule = rules.find((rule) => rule.enabled && rule.scopeType === "USER" && rule.identifierValue);
    const ipRule = rules.find((rule) => rule.enabled && rule.scopeType === "IP" && rule.identifierValue);

    if (endpointPattern) {
      setEndpoint(endpointPattern.replace(/\/\*\*$/, "/payments").replace(/\*+$/, "payments"));
    }
    if (userRule?.identifierValue) setUserId(userRule.identifierValue);
    if (ipRule?.identifierValue) setIpAddress(ipRule.identifierValue);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!endpoint.trim() || pending) return;

    setPending(true);
    const result = await checkRateLimit({
      endpoint: endpoint.trim(),
      userId: userId.trim() || undefined,
      ipAddress: ipAddress.trim() || undefined,
    });
    setOutcome(result);
    setPending(false);

    if (result.body) {
      record({
        endpoint: endpoint.trim(),
        decision: result.body.allowed ? "allowed" : "blocked",
        algorithm: result.body.algorithmUsed,
        httpStatus: result.httpStatus,
        remaining: result.body.remaining,
        userId: userId.trim() || null,
        ipAddress: ipAddress.trim() || null,
        source: "dashboard",
      });
    } else {
      record({
        endpoint: endpoint.trim(),
        decision: "error",
        algorithm: "—",
        httpStatus: result.httpStatus,
        remaining: 0,
        userId: userId.trim() || null,
        ipAddress: ipAddress.trim() || null,
        source: "dashboard",
      });
    }
  }

  function openInPlayground() {
    try {
      window.sessionStorage.setItem(
        "throttle-context",
        JSON.stringify({ endpoint, userId, ipAddress }),
      );
    } catch {
      /* ignore */
    }
    router.push("/playground");
  }

  const body = outcome?.body;
  const algorithm = body?.algorithmUsed ? ALGORITHM_MAP[body.algorithmUsed] : undefined;
  const noRules = body?.algorithmUsed === "NONE";

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        icon={Zap}
        title="Quick check"
        description="Send a request through the live limiter and see the decision instantly."
        action={
          <Link
            href="/playground"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            Playground
            <ArrowRight className="size-3" />
          </Link>
        }
      />

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Endpoint" htmlFor="quick-endpoint" required>
            <div className="flex gap-2">
              <Input
                id="quick-endpoint"
                list="quick-endpoints"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="/api/payments"
                leading={<span className="font-mono text-[9px] font-semibold tracking-wide">POST</span>}
                autoComplete="off"
              />
              <datalist id="quick-endpoints">
                {endpoints.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
              <Button type="submit" variant="primary" loading={pending} className="shrink-0">
                {pending ? null : <Send className="size-3.5" />}
                Check
              </Button>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="User ID" htmlFor="quick-user" hint="Used by USER-scoped rules">
              <Input
                id="quick-user"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="user-123"
                autoComplete="off"
              />
            </Field>
            <Field label="IP address" htmlFor="quick-ip" hint="Used by IP-scoped rules">
              <Input
                id="quick-ip"
                value={ipAddress}
                onChange={(event) => setIpAddress(event.target.value)}
                placeholder="10.10.10.10"
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={autofill}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-emerald-600 dark:hover:text-emerald-300"
            >
              <Wand2 className="size-3" />
              Autofill from rules
            </button>
            <span className="font-mono text-[10px] text-[var(--faint)]">POST /api/rate-limit/check</span>
          </div>
        </form>

        <div className="mt-4 flex-1" aria-live="polite">
          {!outcome ? (
            <div className="flex h-full min-h-[132px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)]/40 px-4 py-6 text-center">
              <span className="flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
                <Zap className="size-4 text-[var(--faint)]" />
              </span>
              <p className="mt-2 text-xs font-medium text-[var(--muted)]">No request sent yet</p>
              <p className="mt-0.5 text-[11px] text-[var(--faint)]">
                A decision will appear here with remaining quota and retry guidance.
              </p>
            </div>
          ) : body ? (
            <div
              className={cn(
                "overflow-hidden rounded-xl border animate-fade-in",
                body.allowed
                  ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                  : "border-rose-500/25 bg-rose-500/[0.06]",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)]/70 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full",
                      body.allowed ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500",
                    )}
                  >
                    {body.allowed ? <ShieldCheck className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--text)]">
                    {body.allowed ? "Request allowed" : "Rate limited"}
                  </span>
                  <Badge tone={body.allowed ? "emerald" : "rose"}>HTTP {outcome.httpStatus}</Badge>
                </div>
                <span className="font-mono text-[10px] text-[var(--faint)] tabular">{outcome.latencyMs}ms</span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--border)]/70">
                <MiniMetric
                  label="Remaining"
                  value={noRules ? "∞" : formatNumber(body.remaining)}
                  tone={body.allowed ? "emerald" : "rose"}
                />
                <MiniMetric
                  label="Retry after"
                  value={body.retryAfterSeconds > 0 ? `${body.retryAfterSeconds}s` : "—"}
                  tone={body.retryAfterSeconds > 0 ? "amber" : "neutral"}
                />
                <MiniMetric
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
                  tone="neutral"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)]/70 px-3.5 py-2.5">
                <p className="text-[11px] leading-relaxed text-[var(--muted)]">
                  {noRules ? (
                    <>
                      No enabled rule matched.{" "}
                      <Link href="/rules?new=1" className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300">
                        Add a rule
                      </Link>{" "}
                      to enforce a limit.
                    </>
                  ) : (
                    body.message
                  )}
                </p>
                <button
                  type="button"
                  onClick={openInPlayground}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                >
                  Inspect
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.06] p-3.5 animate-fade-in">
              <div className="flex items-center gap-2">
                <CircleX className="size-4 text-rose-500" />
                <span className="text-[13px] font-semibold text-[var(--text)]">Check failed</span>
                {outcome.httpStatus ? <Badge tone="rose">HTTP {outcome.httpStatus}</Badge> : null}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">
                {outcome.error?.message ?? "The request could not be completed."}
              </p>
              {outcome.error?.details.length ? (
                <ul className="mt-2 space-y-0.5 text-[11px] text-[var(--muted)]">
                  {outcome.error.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-1.5">
                      <CircleSlash className="mt-0.5 size-3 shrink-0 text-[var(--faint)]" />
                      {detail}
                    </li>
                  ))}
                </ul>
              ) : null}
              {outcome.error?.offline ? (
                <p className="mt-2 font-mono text-[10px] text-[var(--faint)]">
                  Start the backend: docker compose up --build
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "amber" | "neutral";
}) {
  const tones = {
    emerald: "text-emerald-600 dark:text-emerald-300",
    rose: "text-rose-600 dark:text-rose-300",
    amber: "text-amber-600 dark:text-amber-300",
    neutral: "text-[var(--text)]",
  };

  return (
    <div className="px-3.5 py-2.5">
      <p className="text-[10px] text-[var(--faint)]">{label}</p>
      <p className={cn("mt-0.5 truncate font-mono text-[13px] font-semibold tabular", tones[tone])}>{value}</p>
    </div>
  );
}
