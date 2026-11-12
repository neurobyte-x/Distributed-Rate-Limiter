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
import type { ActivityDecision, ActivityEntry } from "@/lib/types";

interface RecordInput {
  endpoint: string;
  decision: ActivityDecision;
  algorithm: string;
  httpStatus: number;
  remaining: number;
  source: ActivityEntry["source"];
  userId?: string | null;
  ipAddress?: string | null;
}

interface ActivityStats {
  total: number;
  allowed: number;
  blocked: number;
  errors: number;
  blockRate: number;
  endpoints: number;
}

interface ActivityContextValue {
  entries: ActivityEntry[];
  stats: ActivityStats;
  record: (input: RecordInput) => void;
  clear: () => void;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);
const STORAGE_KEY = "throttle-activity";
const MAX_ENTRIES = 80;

function readStorage(): ActivityEntry[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is ActivityEntry => Boolean(entry) && typeof entry === "object" && "id" in entry)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const entriesRef = useRef<ActivityEntry[]>([]);

  useEffect(() => {
    const stored = readStorage();
    entriesRef.current = stored;
    setEntries(stored);
  }, []);

  const commit = useCallback((next: ActivityEntry[]) => {
    entriesRef.current = next;
    setEntries(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Ignore quota or privacy-mode failures. */
    }
  }, []);

  const record = useCallback(
    (input: RecordInput) => {
      const entry: ActivityEntry = {
        ...input,
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: Date.now(),
      };
      commit([entry, ...entriesRef.current].slice(0, MAX_ENTRIES));
    },
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const stats = useMemo<ActivityStats>(() => {
    const allowed = entries.filter((entry) => entry.decision === "allowed").length;
    const blocked = entries.filter((entry) => entry.decision === "blocked").length;
    const errors = entries.filter((entry) => entry.decision === "error").length;
    const endpoints = new Set(entries.map((entry) => entry.endpoint)).size;
    return {
      total: entries.length,
      allowed,
      blocked,
      errors,
      blockRate: entries.length ? Math.round((blocked / entries.length) * 100) : 0,
      endpoints,
    };
  }, [entries]);

  const value = useMemo(() => ({ entries, stats, record, clear }), [entries, stats, record, clear]);

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useActivity must be used inside ActivityProvider");
  return context;
}
