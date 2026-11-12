"use client";

import {
  CircleAlert,
  Clock3,
  Play,
  RotateCcw,
  Square,
  Timer,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { useId } from "react";
import type { BurstAttempt } from "@/lib/types";
import { cn, formatNumber, percent } from "@/lib/utils";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  ProgressBar,
  Select,
} from "@/components/ui/primitives";

const HUGE_REMAINING = 9_000_000_000_000_000_000;

export function BurstPanel({
  attempts,
  running,
  count,
  delay,
  onCountChange,
  onDelayChange,
  onRun,
  onStop,
  onReset,
  canRun,
}: {
  attempts: BurstAttempt[];
  running: boolean;
  count: number;
  delay: number;
  onCountChange: (value: number) => void;
  onDelayChange: (value: number) => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  canRun: boolean;
}) {
  const allowed = attempts.filter((attempt) => attempt.allowed).length;
  const blocked = attempts.length - allowed;
  const firstBlock = attempts.find((attempt) => !attempt.allowed)?.index;
  const lastBlocked = [...attempts].reverse().find((attempt) => !attempt.allowed);
  const unlimited = attempts.length > 0 && attempts.every((attempt) => attempt.remaining >= HUGE_REMAINING);
  const progress = count > 0 ? Math.min(100, Math.round((attempts.length / count) * 100)) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={Zap}
        title="Burst test"
        description="Fire sequential checks with the context above to watch a bucket drain in real time."
        action={
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--faint)]">
            counts against limits
          </span>
        }
      />

      <div className="px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Requests" htmlFor="burst-count" className="w-24">
            <Input
              id="burst-count"
              type="number"
              min={2}
              max={50}
              value={count}
              onChange={(event) => onCountChange(Number(event.target.value))}
              disabled={running}
              className="h-9 font-mono"
            />
          </Field>
          <Field label="Gap between" htmlFor="burst-delay" className="w-36">
            <Select
              id="burst-delay"
              value={delay}
              onChange={(event) => onDelayChange(Number(event.target.value))}
              disabled={running}
              className="h-9 text-[12px]"
            >
              <option value={0}>No gap</option>
              <option value={100}>100 ms</option>
              <option value={250}>250 ms</option>
              <option value={500}>500 ms</option>
              <option value={1000}>1 second</option>
            </Select>
          </Field>

          <div className="ml-auto flex items-center gap-2 pb-0.5">
            {attempts.length > 0 && !running ? (
              <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset burst results">
                <RotateCcw className="size-4" />
              </Button>
            ) : null}
            {running ? (
              <Button variant="danger" onClick={onStop}>
                <Square className="size-3.5" />
                Stop
              </Button>
            ) : (
              <Button variant="primary" onClick={onRun} disabled={!canRun}>
                <Play className="size-3.5" />
                Run burst
              </Button>
            )}
          </div>
        </div>

        {running ? (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--faint)]">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3 animate-pulse text-emerald-500" />
                sending checks
              </span>
              <span className="tabular">
                {attempts.length} / {count}
              </span>
            </div>
            <ProgressBar value={progress} />
          </div>
        ) : null}

        {attempts.length > 0 ? (
          <div className="mt-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-end gap-[3px] overflow-x-auto pb-1" role="img" aria-label="Burst attempt outcomes">
                {attempts.map((attempt) => (
                  <span
                    key={attempt.index}
                    title={`#${attempt.index} · ${attempt.allowed ? "allowed" : "blocked"} · remaining ${
                      attempt.remaining >= HUGE_REMAINING ? "∞" : formatNumber(attempt.remaining)
                    }`}
                    className={cn(
                      "h-8 min-w-[5px] flex-1 rounded-[2px] transition-all duration-200",
                      attempt.allowed ? "bg-emerald-400/85" : "bg-rose-400/90",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-[var(--faint)]">
              <span>#1</span>
              <span>#{attempts.length}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="card-inset p-2.5">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-[var(--faint)]">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Allowed
                </div>
                <p className="mt-1 font-mono text-lg font-semibold leading-none tabular text-[var(--text)]">
                  {allowed}
                </p>
              </div>
              <div className="card-inset p-2.5">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-[var(--faint)]">
                  <span className="size-1.5 rounded-full bg-rose-400" />
                  Blocked
                </div>
                <p className="mt-1 font-mono text-lg font-semibold leading-none tabular text-[var(--text)]">
                  {blocked}
                </p>
              </div>
              <div className="card-inset p-2.5">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-[var(--faint)]">
                  <Timer className="size-2.5" />
                  First block
                </div>
                <p className="mt-1 font-mono text-lg font-semibold leading-none tabular text-[var(--text)]">
                  {firstBlock ? `#${firstBlock}` : "—"}
                </p>
              </div>
            </div>

            {!unlimited && attempts.length > 1 ? (
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-[var(--muted)]">Remaining quota</p>
                  <span className="font-mono text-[9px] text-[var(--faint)]">
                    {percent(allowed, attempts.length)}% allowed
                  </span>
                </div>
                <RemainingChart attempts={attempts} />
              </div>
            ) : null}

            {unlimited ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                <p className="text-[10px] leading-relaxed text-[var(--muted)]">
                  No enabled rule matched this context, so every request was allowed. Create a rule to
                  see the bucket drain and 429 responses.
                </p>
              </div>
            ) : blocked === 0 && !running ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <p className="text-[10px] leading-relaxed text-[var(--muted)]">
                  The burst stayed within the limit. Send more requests or tighten the rule to observe
                  throttling.
                </p>
              </div>
            ) : null}

            {lastBlocked && lastBlocked.retryAfterSeconds > 0 ? (
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[var(--faint)]">
                <Clock3 className="size-3" />
                last block asked clients to retry after {lastBlocked.retryAfterSeconds}s
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--faint)]">
            Each request is sent sequentially and counted by the distributed limiter. Results render as
            a timeline with remaining quota.
          </p>
        )}
      </div>
    </Card>
  );
}

function RemainingChart({ attempts }: { attempts: BurstAttempt[] }) {
  const rawId = useId();
  const gradientId = `remaining-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const width = 600;
  const height = 96;
  const padX = 6;
  const padY = 10;
  const values = attempts.map((attempt) =>
    attempt.remaining >= HUGE_REMAINING ? 0 : Math.max(0, attempt.remaining),
  );
  const max = Math.max(...values, 1);
  const stepX = attempts.length > 1 ? (width - padX * 2) / (attempts.length - 1) : 0;

  const points = attempts.map((attempt, index) => {
    const value = attempt.remaining >= HUGE_REMAINING ? max : Math.max(0, attempt.remaining);
    return {
      x: padX + index * stepX,
      y: height - padY - (value / max) * (height - padY * 2),
      blocked: !attempt.allowed,
    };
  });

  const coords = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" L ");
  const areaPath = `M ${points[0].x.toFixed(1)},${height - padY} L ${coords} L ${
    points[points.length - 1].x.toFixed(1)
  },${height - padY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 h-24 w-full" role="img" aria-label="Remaining quota over attempts">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={padX}
          x2={width - padX}
          y1={height - padY - ratio * (height - padY * 2)}
          y2={height - padY - ratio * (height - padY * 2)}
          stroke="var(--border)"
          strokeDasharray="3 5"
        />
      ))}

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={`M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L ${coords}`}
        fill="none"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((point, index) =>
        point.blocked ? (
          <circle key={index} cx={point.x} cy={point.y} r="3" fill="#fb7185" stroke="var(--surface)" strokeWidth="1.5" />
        ) : null,
      )}
    </svg>
  );
}
