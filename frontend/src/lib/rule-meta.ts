import type { AlgorithmType, ScopeType } from "./types";

export interface AlgorithmMeta {
  value: AlgorithmType;
  label: string;
  short: string;
  description: string;
  blurb: string;
  color: string;
  badge: string;
}

export const ALGORITHMS: AlgorithmMeta[] = [
  {
    value: "FIXED_WINDOW",
    label: "Fixed window",
    short: "Fixed",
    description: "A counter that resets on a fixed schedule.",
    blurb: "Cheapest to run. Bursts can hit the boundary between two windows.",
    color: "#38bdf8",
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    value: "SLIDING_WINDOW_LOG",
    label: "Sliding window log",
    short: "Log",
    description: "Exact timestamps for every accepted request.",
    blurb: "The most precise limiter, at the cost of storing every request.",
    color: "#a78bfa",
    badge: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  {
    value: "SLIDING_WINDOW_COUNTER",
    label: "Sliding window counter",
    short: "Counter",
    description: "Weighted blend of the current and previous window.",
    blurb: "Near-exact limits with tiny memory. A strong default for APIs.",
    color: "#fbbf24",
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    value: "TOKEN_BUCKET",
    label: "Token bucket",
    short: "Bucket",
    description: "Smooth refill with room for controlled bursts.",
    blurb: "Great for public APIs: steady throughput plus short bursts.",
    color: "#34d399",
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
];

export const ALGORITHM_MAP: Record<string, AlgorithmMeta> = Object.fromEntries(
  ALGORITHMS.map((algorithm) => [algorithm.value, algorithm]),
);

export interface ScopeMeta {
  value: ScopeType;
  label: string;
  short: string;
  description: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  badge: string;
  color: string;
}

export const SCOPES: ScopeMeta[] = [
  {
    value: "GLOBAL",
    label: "Global",
    short: "Global",
    description: "One shared budget for every request.",
    identifierLabel: "Identifier",
    identifierPlaceholder: "Not required",
    badge: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    color: "#94a3b8",
  },
  {
    value: "USER",
    label: "User",
    short: "User",
    description: "A separate budget for each user ID.",
    identifierLabel: "User ID",
    identifierPlaceholder: "user-123",
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    color: "#38bdf8",
  },
  {
    value: "IP",
    label: "IP address",
    short: "IP",
    description: "A separate budget for each client IP.",
    identifierLabel: "IP address",
    identifierPlaceholder: "10.10.10.10",
    badge: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    color: "#fb923c",
  },
  {
    value: "ENDPOINT",
    label: "Endpoint",
    short: "Endpoint",
    description: "A budget per endpoint pattern.",
    identifierLabel: "Endpoint pattern",
    identifierPlaceholder: "/api/payments",
    badge: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    color: "#e879f9",
  },
];

export const SCOPE_MAP: Record<string, ScopeMeta> = Object.fromEntries(
  SCOPES.map((scope) => [scope.value, scope]),
);

export const WINDOW_PRESETS = [
  { label: "1 sec", value: 1 },
  { label: "10 sec", value: 10 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "1 hour", value: 3600 },
];

export const ENDPOINT_PRESETS = ["/api/**", "/api/payments", "/api/auth/**", "/api/search"];

export interface RuleTemplate {
  id: string;
  title: string;
  description: string;
  accent: string;
  draft: {
    algorithmType: AlgorithmType;
    scopeType: ScopeType;
    identifierValue: string;
    endpointPattern: string;
    limit: number;
    windowSizeSeconds: number;
    refillRatePerSecond: number | null;
    burstCapacity: number | null;
  };
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: "payments",
    title: "Protect payments",
    description: "5 requests per minute for each user on /api/payments.",
    accent: "#38bdf8",
    draft: {
      algorithmType: "FIXED_WINDOW",
      scopeType: "USER",
      identifierValue: "user-123",
      endpointPattern: "/api/payments",
      limit: 5,
      windowSizeSeconds: 60,
      refillRatePerSecond: null,
      burstCapacity: null,
    },
  },
  {
    id: "public-api",
    title: "Public API shield",
    description: "100 burst, 20 req/sec refill across the whole API.",
    accent: "#34d399",
    draft: {
      algorithmType: "TOKEN_BUCKET",
      scopeType: "GLOBAL",
      identifierValue: "",
      endpointPattern: "/api/**",
      limit: 100,
      windowSizeSeconds: 1,
      refillRatePerSecond: 20,
      burstCapacity: 100,
    },
  },
  {
    id: "per-ip",
    title: "Block IP bursts",
    description: "10 burst, 2 req/sec per IP on all endpoints.",
    accent: "#fb923c",
    draft: {
      algorithmType: "TOKEN_BUCKET",
      scopeType: "IP",
      identifierValue: "10.10.10.10",
      endpointPattern: "/api/**",
      limit: 10,
      windowSizeSeconds: 1,
      refillRatePerSecond: 2,
      burstCapacity: 10,
    },
  },
];
