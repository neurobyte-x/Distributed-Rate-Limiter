"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <div key={pathname} className="animate-rise">
            {children}
          </div>
        </main>
        <footer className="mx-auto w-full max-w-[1500px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-2 border-t border-[var(--border)] pt-4 text-[11px] text-[var(--faint)] sm:flex-row sm:items-center">
            <span>
              Throttle Console · Redis-backed distributed rate limiting for Spring Boot
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
              Next.js · Tailwind · pnpm
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
