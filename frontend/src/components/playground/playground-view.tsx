"use client";

import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  CircleSlash,
  Clock3,
  History,
  RotateCcw,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { checkRateLimit, type CheckOutcome } from "@/lib/api";
import type { ActivityEntry, BurstAttempt } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useNow } from "@/lib/hooks";
import { useActivity } from "@/providers/activity-provider";
import { useHealth } from "@/providers/health-provider";
import { useRules } from "@/providers/rules-provider";
import { useToast } from "@/providers/toast-provider";
import { PageHeader } from "@/components/page-header";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyButton,
  EmptyState,
  Field,
  Input,
  StatusDot,
  buttonStyles,
} from "@/components/ui/primitives";
import { CheckResult, type PlaygroundContext } from "./check-result";
import { BurstPanel } from "./burst-panel";

const DEFAULT_CONTEXT: PlaygroundContext = {
  endpoint: "/api/payments",
  userId: "user-123",
  ipAddress: "",
};

export function PlaygroundView() {
  const { rules, status: rulesStatus } = useRules();
  const { entries, record, clear } = useActivity();
  const health = useHealth();
  const { toast } = useToast();
  const now = useNow(20_000);

  const [context, setContext] = useState<PlaygroundContext>(DEFAULT_CONTEXT);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CheckOutcome | null>(null);
  const [burstAttempts, setBurstAttempts] = useState<BurstAttempt[]>([]);
  const [burstRunning, setBurstRunning] = useState(false);
  const [burstCount, setBurstCount] = useState(15);
  const [burstDelay, setBurstDelay] = useState(150);
  const stopBurst = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);

  const enabledRules = rules.filter((rule) => rule.enabled);
  const payload = useMemo(
    () => ({
      endpoint: context.endpoint.trim(),
      userId: context.userId.trim() || undefined,
      ipAddress: context.ipAddress.trim() || undefined,
    }),
    [context],
  );

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("throttle-context");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PlaygroundContext>;
        setContext((current) => ({
          endpoint: parsed.endpoint?.trim() || current.endpoint,
          userId: parsed.userId ?? current.userId,
          ipAddress: parsed.ipAddress ?? current.ipAddress,
        }));
        window.sessionStorage.removeItem("throttle-context");
      }
    } catch {
      /* Ignore malformed session context. */
    }
    return () => {
      stopBurst.current = true;
    };
  }, []);

  const presets = useMemo(() => {
    const seen = new Set<string>();
    const result: { key: string; endpoint: string; identity: string; context: PlaygroundContext }[] = [];

    for (const rule of enabledRules) {
      if (result.length >= 3) break;
      const endpoint = sampleEndpoint(
        rule.scopeType === "ENDPOINT" ? rule.identifierValue : rule.endpointPattern,
      );
      const identity =
        rule.scopeType === "GLOBAL"
          ? "global budget"
          : `${rule.scopeType.toLowerCase()}: ${rule.identifierValue ?? "—"}`;
      const key = `${endpoint}|${identity}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        key,
        endpoint,
        identity,
        context: {
          endpoint,
          userId:
            rule.scopeType === "USER" && rule.identifierValue ? rule.identifierValue : context.userId,
          ipAddress:
            rule.scopeType === "IP" && rule.identifierValue ? rule.identifierValue : context.ipAddress,
        },
      });
    }

    return result;
  }, [enabledRules, context.userId, context.ipAddress]);

  function recordOutcome(outcome: CheckOutcome, source: ActivityEntry["source"]) {
    record({
      endpoint: payload.endpoint,
      decision: outcome.body ? (outcome.body.allowed ? "allowed" : "blocked") : "error",
      algorithm: outcome.body?.algorithmUsed ?? "—",
      httpStatus: outcome.httpStatus,
      remaining: outcome.body?.remaining ?? 0,
      userId: payload.userId ?? null,
      ipAddress: payload.ipAddress ?? null,
      source,
    });
  }

  async function runCheck(event?: FormEvent) {
    event?.preventDefault();
    if (!payload.endpoint || pending) return;

    setPending(true);
    const outcome = await checkRateLimit(payload);
    setResult(outcome);
    recordOutcome(outcome, "playground");
    setPending(false);
  }

  async function runBurst() {
    if (burstRunning || !payload.endpoint) return;

    stopBurst.current = false;
    setBurstRunning(true);
    setBurstAttempts([]);

    const total = Math.min(50, Math.max(2, Math.round(burstCount) || 2));
    const collected: BurstAttempt[] = [];

    for (let index = 0; index < total; index += 1) {
      if (stopBurst.current) break;

      const outcome = await checkRateLimit(payload);
      const attempt: BurstAttempt = {
        index: index + 1,
        allowed: outcome.body?.allowed ?? false,
        remaining: outcome.body?.remaining ?? 0,
        status: outcome.httpStatus,
        retryAfterSeconds: outcome.body?.retryAfterSeconds ?? 0,
        at: Date.now(),
      };
      collected.push(attempt);
      setBurstAttempts([...collected]);
      recordOutcome(outcome, "burst");

      if (index < total - 1 && burstDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, burstDelay));
      }
    }

    setBurstRunning(false);
    if (stopBurst.current) {
      toast({
        title: "Burst stopped",
        description: `${collected.length} of ${total} checks were sent.`,
        variant: "info",
      });
    }
  }

  function restore(entry: ActivityEntry) {
    setContext({
      endpoint: entry.endpoint,
      userId: entry.userId ?? "",
      ipAddress: entry.ipAddress ?? "",
    });
    toast({
      title: "Context restored",
      description: `${entry.endpoint} · ${formatRelativeTime(entry.at)}`,
      variant: "info",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearSession() {
    clear();
    setBurstAttempts([]);
    setResult(null);
    toast({ title: "Session cleared", description: "Checks and results were reset.", variant: "info" });
  }

  const hasSession = entries.length > 0 || Boolean(result) || burstAttempts.length > 0;
  const rulesUnavailable = rulesStatus === "error";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Traffic lab"
        title="Playground"
        description="Send request contexts through the live limiter, inspect every rule evaluation, and visualize bursts."
        actions={
          <>
            <Button variant="secondary" onClick={clearSession} disabled={!hasSession}>
              <RotateCcw className="size-4" />
              Reset session
            </Button>
            <Link href="/rules" className={buttonStyles("primary")}>
              <SlidersHorizontal className="size-4" />
              Manage rules
            </Link>
          </>
        }
      />

      {!health.loading && !health.reachable ? (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">Backend offline</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">
                Checks will fail until the Spring Boot service and Redis are running.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:ml-auto">
            <code className="rounded-lg bg-[var(--surface)] px-2 py-1.5 font-mono text-[10px] text-[var(--muted)]">
              docker compose up --build
            </code>
            <CopyButton value="docker compose up --build" size="icon" />
          </div>
        </div>
      ) : null}

      {rulesStatus === "ready" && enabledRules.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-sky-500" />
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">No enabled rules</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">
                Every check will be allowed by default. Add a rule to see enforcement in action.
              </p>
            </div>
          </div>
          <Link href="/rules?new=1" className={buttonStyles("secondary", "sm", "shrink-0")}>
            Create a rule
            <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div ref={formRef} className="lg:col-start-1 lg:row-start-1">
          <Card className="overflow-hidden">
            <CardHeader
              icon={Send}
              title="Request context"
              description="The limiter matches these attributes against enabled rules."
              action={
                <Badge tone={enabledRules.length ? "emerald" : "neutral"}>
                  {enabledRules.length} live
                </Badge>
              }
            />
            <form onSubmit={runCheck} className="space-y-3 px-5 pb-5 pt-4">
              <Field label="Endpoint" htmlFor="pg-endpoint" required>
                <Input
                  id="pg-endpoint"
                  value={context.endpoint}
                  onChange={(event) => setContext((current) => ({ ...current, endpoint: event.target.value }))}
                  placeholder="/api/payments"
                  leading={<span className="font-mono text-[9px] font-semibold">POST</span>}
                  autoComplete="off"
                  list="pg-endpoints"
                />
                <datalist id="pg-endpoints">
                  {Array.from(new Set(rules.map((rule) => rule.endpointPattern).filter(Boolean))).map((value) => (
                    <option key={value} value={value as string} />
                  ))}
                </datalist>
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="User ID" htmlFor="pg-user">
                  <Input
                    id="pg-user"
                    value={context.userId}
                    onChange={(event) => setContext((current) => ({ ...current, userId: event.target.value }))}
                    placeholder="user-123"
                    autoComplete="off"
                  />
                </Field>
                <Field label="IP address" htmlFor="pg-ip">
                  <Input
                    id="pg-ip"
                    value={context.ipAddress}
                    onChange={(event) => setContext((current) => ({ ...current, ipAddress: event.target.value }))}
                    placeholder="10.10.10.10"
                    autoComplete="off"
                  />
                </Field>
              </div>

              <p className="flex items-center gap-1.5 text-[10px] text-[var(--faint)]">
                <Clock3 className="size-3" />
                Timestamp is captured at send time. Empty identifiers are omitted.
              </p>

              {presets.length > 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-2">
                  <p className="px-1 pb-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">
                    Try a matching context
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {presets.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setContext(preset.context)}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface)]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[10px] text-[var(--text)]">
                            {preset.endpoint}
                          </span>
                          <span className="block truncate text-[9px] text-[var(--faint)]">
                            {preset.identity}
                          </span>
                        </span>
                        <ArrowRight className="size-3 shrink-0 text-[var(--border-strong)]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                loading={pending}
                disabled={!context.endpoint.trim() || rulesUnavailable}
                className="w-full"
              >
                {!pending ? <Send className="size-4" /> : null}
                Send check
              </Button>
              <p className="text-center font-mono text-[9px] text-[var(--faint)]">
                POST /api/rate-limit/check
              </p>
            </form>
          </Card>
        </div>

        <div className="lg:col-start-2 lg:row-start-1">
          <CheckResult
            outcome={result}
            context={context}
            rules={rules}
            pending={pending}
            onRetry={() => void runCheck()}
          />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <Card className="flex flex-col overflow-hidden">
            <CardHeader
              icon={History}
              title="Recent checks"
              description="Restore any context to replay it."
              action={
                entries.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => clear()}
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium text-[var(--faint)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                  >
                    <Trash2 className="size-3" />
                    Clear
                  </button>
                ) : null
              }
            />
            <div className="mt-2 flex-1">
              {entries.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No checks in this session"
                  description="Requests you send here or from the dashboard will appear for quick replay."
                />
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {entries.slice(0, 8).map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => restore(entry)}
                        className="group flex w-full items-center gap-2.5 px-5 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]/60"
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border",
                            entry.decision === "allowed" &&
                              "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                            entry.decision === "blocked" && "border-rose-500/20 bg-rose-500/10 text-rose-500",
                            entry.decision === "error" && "border-amber-500/20 bg-amber-500/10 text-amber-500",
                          )}
                        >
                          {entry.decision === "allowed" ? (
                            <CircleCheck className="size-3" />
                          ) : entry.decision === "blocked" ? (
                            <ShieldAlert className="size-3" />
                          ) : (
                            <CircleSlash className="size-3" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[11px] text-[var(--text)]">
                            {entry.endpoint}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[9px] text-[var(--faint)]">
                            <StatusDot
                              tone={
                                entry.decision === "allowed"
                                  ? "emerald"
                                  : entry.decision === "blocked"
                                    ? "rose"
                                    : "amber"
                              }
                            />
                            {entry.userId ? <span className="truncate">{entry.userId}</span> : null}
                            {entry.userId && entry.ipAddress ? <span aria-hidden>·</span> : null}
                            {entry.ipAddress ? <span className="truncate">{entry.ipAddress}</span> : null}
                            <span aria-hidden>·</span>
                            <span className="tabular">{formatRelativeTime(entry.at)}</span>
                            {now ? "" : ""}
                          </span>
                        </span>
                        <ArrowRight className="size-3 shrink-0 text-[var(--border-strong)] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {entries.length > 0 ? (
              <div className="border-t border-[var(--border)] px-5 py-2">
                <p className="font-mono text-[9px] text-[var(--faint)]">
                  showing {Math.min(entries.length, 8)} of {entries.length} · sessionStorage
                </p>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="lg:col-start-2 lg:row-start-2">
          <BurstPanel
            attempts={burstAttempts}
            running={burstRunning}
            count={burstCount}
            delay={burstDelay}
            onCountChange={setBurstCount}
            onDelayChange={setBurstDelay}
            onRun={() => void runBurst()}
            onStop={() => {
              stopBurst.current = true;
            }}
            onReset={() => setBurstAttempts([])}
            canRun={!burstRunning && Boolean(context.endpoint.trim()) && !rulesUnavailable}
          />
        </div>
      </div>
    </div>
  );
}

function sampleEndpoint(pattern: string | null | undefined): string {
  if (!pattern) return "/api/payments";
  if (!pattern.includes("*")) return pattern;
  return pattern
    .replace(/\/\*\*$/, "/payments")
    .replace(/\*\*/g, "payments")
    .replace(/\*/g, "sample");
}
