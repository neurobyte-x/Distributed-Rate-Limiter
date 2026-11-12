"use client";

import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  Clock3,
  Database,
  Globe2,
  RefreshCw,
  Server,
  Terminal,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useHealth } from "@/providers/health-provider";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useNow } from "@/lib/hooks";
import { PageHeader } from "@/components/page-header";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyButton,
  StatusDot,
  buttonStyles,
} from "@/components/ui/primitives";

const ENDPOINTS = [
  { method: "POST", path: "/api/rules", description: "Create a rate limit rule" },
  { method: "GET", path: "/api/rules", description: "List every stored rule" },
  { method: "GET", path: "/api/rules/{id}", description: "Fetch one rule by ID" },
  { method: "PUT", path: "/api/rules/{id}", description: "Replace an existing rule" },
  { method: "DELETE", path: "/api/rules/{id}", description: "Delete a rule" },
  { method: "POST", path: "/api/rate-limit/check", description: "Evaluate a request (200 or 429)" },
  { method: "GET", path: "/actuator/health", description: "Service + Redis health probe" },
];

const METHOD_TONE: Record<string, "emerald" | "sky" | "amber" | "rose" | "neutral"> = {
  POST: "emerald",
  GET: "sky",
  PUT: "amber",
  DELETE: "rose",
};

const CHECK_SNIPPET = `curl -X POST http://localhost:8080/api/rate-limit/check \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "user-123",
    "ipAddress": "10.10.10.10",
    "endpoint": "/api/payments"
  }'`;

const RULE_SNIPPET = `curl -X POST http://localhost:8080/api/rules \\
  -H "Content-Type: application/json" \\
  -d '{
    "algorithmType": "TOKEN_BUCKET",
    "scopeType": "IP",
    "identifierValue": "10.10.10.10",
    "refillRatePerSecond": 2,
    "burstCapacity": 10,
    "limit": 10,
    "windowSizeSeconds": 1,
    "endpointPattern": "/api/**",
    "enabled": true
  }'`;

export function StatusView() {
  const { report, loading, refresh, reachable, healthy, label } = useHealth();
  const [refreshing, setRefreshing] = useState(false);
  const [origin, setOrigin] = useState("");
  const now = useNow(15_000);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  const components = Object.entries(report?.body?.components ?? {});
  const upComponents = components.filter(([, component]) => component.status === "UP").length;
  const redis = report?.body?.components?.redis;
  const tone = healthy ? "emerald" : reachable ? "amber" : "rose";
  const statusIcon = healthy ? Server : reachable ? TriangleAlert : WifiOff;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Observability"
        title="System status"
        description="Connectivity, Redis health, and the raw API contract behind the console."
        actions={
          <>
            <Button variant="secondary" onClick={() => void handleRefresh()} loading={refreshing}>
              <RefreshCw className="size-4" />
              Probe now
            </Button>
            <Link href="/playground" className={buttonStyles("primary")}>
              <Activity className="size-4" />
              Send a check
            </Link>
          </>
        }
      />

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
        <div
          className={cn(
            "pointer-events-none absolute -right-20 -top-24 size-72 rounded-full blur-3xl",
            healthy ? "bg-emerald-500/10" : reachable ? "bg-amber-500/10" : "bg-rose-500/10",
          )}
        />

        <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "relative flex size-14 shrink-0 items-center justify-center rounded-2xl border",
                healthy && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                !healthy && reachable && "border-amber-500/30 bg-amber-500/10 text-amber-500",
                !reachable && "border-rose-500/30 bg-rose-500/10 text-rose-500",
              )}
            >
              {(() => {
                const Icon = statusIcon;
                return <Icon className="size-6" />;
              })()}
              {healthy ? (
                <span className="absolute -right-1 -top-1 flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-3 rounded-full border-2 border-[var(--surface)] bg-emerald-400" />
                </span>
              ) : null}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">{label}</h2>
                <Badge tone={tone === "emerald" ? "emerald" : tone === "amber" ? "amber" : "rose"}>
                  {loading ? "probing" : report?.body?.status ?? "no signal"}
                </Badge>
              </div>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-[var(--muted)]">
                {healthy
                  ? "The API and every reported dependency are healthy. Rules and counters are backed by Redis."
                  : reachable
                    ? "The API responded, but a dependency is reporting DOWN. Enforcement may be degraded."
                    : "The console could not reach the Spring Boot API. Start the stack to manage policies."}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-[var(--faint)]">
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3" />
                  {report?.checkedAt ? formatRelativeTime(report.checkedAt) : "never"}
                  {now ? "" : ""}
                </span>
                <span aria-hidden>·</span>
                <span>/api/health</span>
                {report?.status ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>HTTP {report.status}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 lg:shrink-0">
            <HeroMetric label="probe" value={report?.latencyMs ? `${report.latencyMs}` : "—"} unit="ms" />
            <HeroMetric label="dependencies" value={`${upComponents}/${components.length}`} unit="up" />
            <HeroMetric label="redis" value={redis?.status ?? "—"} unit="" small />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card>
          <CardHeader icon={Server} title="API probe" description="Spring Boot HTTP endpoint." />
          <div className="space-y-2.5 px-5 pb-5 pt-4">
            <Row label="Reachable" value={reachable ? "Yes" : "No"} tone={reachable ? "emerald" : "rose"} />
            <Row label="HTTP status" value={report?.status ? String(report.status) : "—"} />
            <Row label="Latency" value={report?.latencyMs ? `${report.latencyMs} ms` : "—"} />
            <Row
              label="Checked"
              value={report?.checkedAt ? formatRelativeTime(report.checkedAt) : "—"}
            />
            {report?.error ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-2.5 py-2 text-[10px] leading-relaxed text-[var(--muted)]">
                {report.error}
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader icon={Database} title="Redis" description="Counters, windows, and rules." />
          <div className="space-y-2.5 px-5 pb-5 pt-4">
            <Row
              label="Status"
              value={redis?.status ?? "not reported"}
              tone={redis?.status === "UP" ? "emerald" : redis ? "rose" : "neutral"}
            />
            {redis?.details
              ? Object.entries(redis.details)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <Row key={key} label={humanize(key)} value={String(value)} />
                  ))
              : null}
            <p className="pt-1 text-[10px] leading-relaxed text-[var(--faint)]">
              Redis is the shared source of truth, so limits hold across every app instance.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader icon={Boxes} title="Components" description="Reported by Actuator." />
          <div className="px-5 pb-5 pt-4">
            {components.length === 0 ? (
              <p className="text-[11px] leading-relaxed text-[var(--faint)]">
                No component detail was reported. The health payload only includes a top-level status.
              </p>
            ) : (
              <ul className="space-y-2">
                {components.map(([name, component]) => (
                  <li key={name} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--muted)]">
                      <StatusDot
                        tone={
                          component.status === "UP"
                            ? "emerald"
                            : component.status === "OUT_OF_SERVICE"
                              ? "amber"
                              : "rose"
                        }
                      />
                      <span className="truncate font-mono">{name}</span>
                    </span>
                    <Badge
                      tone={
                        component.status === "UP"
                          ? "emerald"
                          : component.status === "OUT_OF_SERVICE"
                            ? "amber"
                            : "rose"
                      }
                    >
                      {component.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={Globe2}
            title="How this console connects"
            description="Every API call is proxied server-side, so there is no browser CORS setup."
          />
          <div className="px-5 pb-5 pt-4">
            <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
              <Hop icon={Globe2} title="Browser" subtitle={origin || "this origin"} />
              <HopArrow />
              <Hop icon={Terminal} title="Next.js proxy" subtitle="/api/*" />
              <HopArrow />
              <Hop icon={Server} title="Spring Boot" subtitle="BACKEND_URL" />
              <HopArrow />
              <Hop icon={Database} title="Redis" subtitle="shared state" />
            </div>
            <div className="mt-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
              <p className="text-[10px] leading-relaxed text-[var(--muted)]">
                The Next.js server forwards requests to <span className="font-mono">BACKEND_URL</span>{" "}
                (default <span className="font-mono">http://localhost:8080</span>). Set it in{" "}
                <span className="font-mono">frontend/.env.local</span> or the container environment.
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="truncate font-mono text-[10px] text-[var(--faint)]">
                  BACKEND_URL=http://localhost:8080
                </code>
                <CopyButton value="BACKEND_URL=http://localhost:8080" size="icon" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={Terminal}
            title="Run the stack"
            description="Start the backend and Redis, then the console."
          />
          <div className="space-y-2 px-5 pb-5 pt-4">
            <Command command="docker compose up --build" note="Full stack: Redis + API + console" />
            <Command command="mvn spring-boot:run" note="Backend only (Redis on port 6379)" />
            <Command command="pnpm dev" note="Console at http://localhost:3000" />
            <p className="pt-1 text-[10px] leading-relaxed text-[var(--faint)]">
              Run the first command from the repository root. The console lives in{" "}
              <span className="font-mono">frontend/</span>.
            </p>
          </div>
        </Card>
      </div>

      <Card id="api" className="scroll-mt-24 overflow-hidden">
        <CardHeader
          icon={BookOpen}
          title="API reference"
          description="The contract consumed by this console. Paths are relative to the backend base URL."
          action={
            <Link
              href="/playground"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              Try it live
              <ArrowRight className="size-3" />
            </Link>
          }
        />

        <div className="mt-4 grid grid-cols-1 gap-4 px-5 pb-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)]">
            <ul className="divide-y divide-[var(--border)]">
              {ENDPOINTS.map((endpoint) => (
                <li
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="flex items-center gap-2.5 px-3 py-2.5"
                >
                  <Badge tone={METHOD_TONE[endpoint.method] ?? "neutral"} className="w-[52px] justify-center">
                    {endpoint.method}
                  </Badge>
                  <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--text)]">
                    {endpoint.path}
                  </code>
                  <span className="hidden shrink-0 text-[10px] text-[var(--faint)] xl:inline">
                    {endpoint.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <CodeBlock
              title="Check a request"
              subtitle="200 allowed · 429 blocked · evaluations included"
              code={CHECK_SNIPPET}
            />
            <CodeBlock
              title="Create a token bucket rule"
              subtitle="limit and windowSizeSeconds are safe defaults"
              code={RULE_SNIPPET}
            />
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/40 px-5 py-2.5">
          <p className="text-[10px] leading-relaxed text-[var(--faint)]">
            From the browser, call the same paths through the Next.js proxy (for example{" "}
            <span className="font-mono">/api/rules</span>) so requests stay same-origin.
          </p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          icon={Activity}
          title="Raw health payload"
          description="The unmodified Actuator response, proxied through /api/health."
          action={
            report?.body ? (
              <CopyButton value={JSON.stringify(report.body, null, 2)} label="Copy JSON" />
            ) : null
          }
        />
        <div className="px-5 pb-5 pt-4">
          {report?.body ? (
            <pre className="max-h-72 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3 font-mono text-[10px] leading-relaxed text-[var(--muted)]">
              {JSON.stringify(
                { ...report, checkedAt: new Date(report.checkedAt).toISOString() },
                null,
                2,
              )}
            </pre>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-6 text-center">
              <p className="text-xs font-medium text-[var(--muted)]">No health payload yet</p>
              <p className="mt-1 text-[11px] text-[var(--faint)]">
                Start the backend and probe again to inspect the raw response.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  unit,
  small = false,
}: {
  label: string;
  value: string;
  unit: string;
  small?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "font-mono font-semibold leading-none tabular text-[var(--text)]",
          small ? "text-base" : "text-2xl",
        )}
      >
        {value}
        {unit ? <span className="ml-0.5 text-[10px] font-normal text-[var(--faint)]">{unit}</span> : null}
      </p>
      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">
        {label}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "rose" | "amber" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-[var(--muted)]">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1.5 font-mono text-[11px]",
          tone === "emerald" && "text-emerald-600 dark:text-emerald-300",
          tone === "rose" && "text-rose-600 dark:text-rose-300",
          tone === "amber" && "text-amber-600 dark:text-amber-300",
          !tone && "text-[var(--text)]",
        )}
      >
        {tone ? <span className="size-1.5 rounded-full bg-current" /> : null}
        {value}
      </span>
    </div>
  );
}

function Hop({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Globe2;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 px-2 py-2">
      <Icon className="size-3.5 shrink-0 text-[var(--faint)]" />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold text-[var(--text)]">{title}</p>
        <p className="truncate font-mono text-[8px] text-[var(--faint)]">{subtitle}</p>
      </div>
    </div>
  );
}

function HopArrow() {
  return <ArrowRight className="mx-auto hidden size-3 shrink-0 text-[var(--border-strong)] sm:block" />;
}

function Command({ command, note }: { command: string; note: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 px-2.5 py-2">
      <div className="min-w-0">
        <code className="block truncate font-mono text-[11px] text-[var(--text)]">{command}</code>
        <p className="mt-0.5 truncate text-[10px] text-[var(--faint)]">{note}</p>
      </div>
      <CopyButton value={command} size="icon" />
    </div>
  );
}

function CodeBlock({ title, subtitle, code }: { title: string; subtitle: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2">
        <div>
          <p className="text-[11px] font-semibold text-[var(--text)]">{title}</p>
          <p className="text-[9px] text-[var(--faint)]">{subtitle}</p>
        </div>
        <CopyButton value={code} label="Copy" />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[10px] leading-relaxed text-[var(--muted)]">
        {code}
      </pre>
    </div>
  );
}

function humanize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}
