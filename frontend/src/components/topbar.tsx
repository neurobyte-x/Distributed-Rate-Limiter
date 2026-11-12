"use client";

import { Menu, Moon, Plus, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHealth } from "@/providers/health-provider";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { buttonStyles, StatusDot } from "./ui/primitives";
import { NAV_ITEMS } from "./sidebar";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { label, healthy, report } = useHealth();

  const current = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  const onRulesPage = pathname.startsWith("/rules");
  const tone = label === "Operational" ? "emerald" : label === "Degraded" ? "amber" : "rose";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="flex size-9 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2 text-[13px]">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)] sm:inline">
            Console
          </span>
          <span className="hidden text-[var(--border-strong)] sm:inline">/</span>
          <span className="truncate font-medium text-[var(--text)]">{current?.label ?? "Overview"}</span>
          {current?.description ? (
            <span className="hidden truncate text-[var(--muted)] md:inline">· {current.description}</span>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/status"
            className={cn(
              "hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-2.5 py-1.5 transition-colors hover:border-[var(--border-strong)] sm:inline-flex",
            )}
            title={report?.error ?? "Backend health"}
          >
            <StatusDot tone={tone} ping={healthy} />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
              {label}
            </span>
            {report?.latencyMs ? (
              <span className="font-mono text-[10px] text-[var(--faint)] tabular">{report.latencyMs}ms</span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="flex size-9 items-center justify-center rounded-lg border border-transparent text-[var(--muted)] transition-colors hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <span className="hidden h-5 w-px bg-[var(--border)] sm:block" />

          {!onRulesPage ? (
            <>
              <Link
                href="/rules?new=1"
                className={buttonStyles("primary", "sm", "hidden sm:inline-flex")}
              >
                <Plus className="size-3.5" />
                New rule
              </Link>

              <Link
                href="/rules?new=1"
                aria-label="Create a new rule"
                className={buttonStyles("primary", "icon", "sm:hidden")}
              >
                <Plus className="size-4" />
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
