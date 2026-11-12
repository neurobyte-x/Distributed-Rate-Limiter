"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getHealth } from "@/lib/api";
import type { HealthReport } from "@/lib/types";

interface HealthContextValue {
  report: HealthReport | null;
  loading: boolean;
  refresh: () => Promise<void>;
  reachable: boolean;
  healthy: boolean;
  label: "Operational" | "Degraded" | "Offline" | "Checking";
  history: HealthProbe[];
}

export interface HealthProbe {
  at: number;
  latencyMs: number;
  ok: boolean;
}

const HealthContext = createContext<HealthContextValue | null>(null);
const POLL_INTERVAL = 20_000;

export function HealthProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [history, setHistory] = useState<HealthProbe[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const next = await getHealth();
      setReport(next);
      setHistory((current) =>
        [...current, { at: next.checkedAt, latencyMs: next.latencyMs, ok: next.ok }].slice(-16),
      );
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const reachable = Boolean(report?.reachable);
  const healthy = Boolean(report?.ok);
  const label: HealthContextValue["label"] = loading
    ? "Checking"
    : healthy
      ? "Operational"
      : reachable
        ? "Degraded"
        : "Offline";

  const value = useMemo(
    () => ({ report, loading, refresh, reachable, healthy, label, history }),
    [report, loading, refresh, reachable, healthy, label, history],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) throw new Error("useHealth must be used inside HealthProvider");
  return context;
}
