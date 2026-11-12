"use client";

import {
  Activity,
  FlaskConical,
  Gauge,
  SlidersHorizontal,
  X,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useHealth } from "@/providers/health-provider";
import { useRules } from "@/providers/rules-provider";
import { cn } from "@/lib/utils";
import { StatusDot } from "./ui/primitives";

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: Gauge, description: "Traffic at a glance" },
  { href: "/rules", label: "Rules", icon: SlidersHorizontal, description: "Policies & scopes" },
  { href: "/playground", label: "Playground", icon: FlaskConical, description: "Test the limiter" },
  { href: "/status", label: "System", icon: Activity, description: "Health & API" },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500 shadow-[0_8px_20px_-8px_rgba(16,185,129,0.85)] transition-transform duration-200 group-hover:scale-[1.03]">
        <svg
          viewBox="0 0 24 24"
          className="size-5 text-emerald-950"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M2.5 12h3.8L9 4.5l4.2 15 2.6-7.5H21.5" />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Throttle</span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--faint)]">
            Rate limiter
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { rules } = useRules();
  const { label, report, refresh, loading } = useHealth();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const tone = label === "Operational" ? "emerald" : label === "Degraded" ? "amber" : "rose";
  const enabledCount = rules.filter((rule) => rule.enabled).length;

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#02060b]/60 backdrop-blur-sm animate-fade-in lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-3)] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-2.5 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--faint)]">
            Console
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-emerald-500/[0.09] text-[var(--text)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400 transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        active ? "text-emerald-500 dark:text-emerald-300" : "text-[var(--faint)] group-hover:text-[var(--muted)]",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/rules" && rules.length > 0 ? (
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 font-mono text-[10px] tabular",
                          active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--faint)]",
                        )}
                        title={`${enabledCount} enabled of ${rules.length} total`}
                      >
                        {enabledCount}/{rules.length}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mx-2.5 my-5 hairline" />

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--faint)]">
                Backend
              </span>
              <StatusDot tone={tone} ping={label === "Operational"} />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--text)]">{label}</span>
              {report?.latencyMs ? (
                <span className="font-mono text-[10px] text-[var(--faint)] tabular">{report.latencyMs}ms</span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
              {label === "Offline"
                ? "Start the Spring Boot service to manage live rules."
                : `${enabledCount} enforcing · Redis-backed`}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <Link
                href="/status"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 transition-colors hover:text-emerald-600 dark:text-emerald-300"
              >
                System status
                <ArrowUpRight className="size-3" />
              </Link>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="font-mono text-[10px] text-[var(--faint)] transition-colors hover:text-[var(--text)] disabled:opacity-50"
              >
                {loading ? "…" : "refresh"}
              </button>
            </div>
          </div>
        </nav>

        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">
            <span>Console v1.0</span>
            <span>Next · Spring</span>
          </div>
        </div>
      </aside>
    </>
  );
}
