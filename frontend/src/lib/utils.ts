import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RateLimitRule, RuleInput } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  if (value >= 9_000_000_000_000_000_000) return "∞";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const minutes = seconds / 60;
    return Number.isInteger(minutes) ? `${minutes}m` : `${minutes.toFixed(1)}m`;
  }
  if (seconds < 86400) {
    const hours = seconds / 3600;
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  }
  const days = seconds / 86400;
  return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`;
}

export function formatRate(value: number | null | undefined): string {
  if (value == null) return "—";
  return Number.isInteger(value) ? `${value}/s` : `${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}/s`;
}

export function formatRelativeTime(timestamp: number, reference: number = Date.now()): string {
  const delta = Math.max(0, reference - timestamp);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function shortId(id: string, length = 8): string {
  if (!id) return "—";
  return id.length <= length ? id : `${id.slice(0, length)}…`;
}

export function isTokenBucket(algorithm: string): boolean {
  return algorithm === "TOKEN_BUCKET";
}

export function describeLimit(rule: Pick<RateLimitRule, "algorithmType" | "limit" | "windowSizeSeconds" | "refillRatePerSecond" | "burstCapacity">): string {
  if (isTokenBucket(rule.algorithmType)) {
    return `${formatRate(rule.refillRatePerSecond)} · burst ${formatNumber(rule.burstCapacity ?? 0)}`;
  }
  return `${formatNumber(rule.limit)} / ${formatDuration(rule.windowSizeSeconds)}`;
}

export function describeLimitLong(rule: Pick<RateLimitRule, "algorithmType" | "limit" | "windowSizeSeconds" | "refillRatePerSecond" | "burstCapacity">): string {
  if (isTokenBucket(rule.algorithmType)) {
    return `${formatRate(rule.refillRatePerSecond)} refill, ${formatNumber(rule.burstCapacity ?? 0)} burst`;
  }
  return `${formatNumber(rule.limit)} requests per ${formatDuration(rule.windowSizeSeconds)}`;
}

export function scopeLabel(scope: string): string {
  switch (scope) {
    case "GLOBAL":
      return "All traffic";
    case "USER":
      return "Per user";
    case "IP":
      return "Per IP";
    case "ENDPOINT":
      return "Per endpoint";
    default:
      return scope;
  }
}

export function rulePreview(input: {
  algorithmType: string;
  scopeType: string;
  identifierValue: string;
  endpointPattern: string;
  limit: number;
  windowSizeSeconds: number;
  refillRatePerSecond: number | null;
  burstCapacity: number | null;
}): string {
  const target =
    input.scopeType === "GLOBAL"
      ? "all traffic"
      : `${scopeLabel(input.scopeType).replace("Per ", "per ")} “${input.identifierValue || "…"}”`;

  const allowance = isTokenBucket(input.algorithmType)
    ? `bursts of ${input.burstCapacity || "…"} requests, refilling ${input.refillRatePerSecond || "…"}/sec`
    : `${input.limit || "…"} requests per ${formatDuration(input.windowSizeSeconds)}`;

  const endpoint = input.endpointPattern.trim()
    ? ` on ${input.endpointPattern}`
    : " on every endpoint";

  return `Allow ${allowance} for ${target}${endpoint}.`;
}

export function toRuleInput(rule: RateLimitRule): RuleInput {
  return {
    algorithmType: rule.algorithmType,
    limit: rule.limit,
    windowSizeSeconds: rule.windowSizeSeconds,
    refillRatePerSecond: rule.refillRatePerSecond ?? null,
    burstCapacity: rule.burstCapacity ?? null,
    scopeType: rule.scopeType,
    identifierValue: rule.identifierValue ?? null,
    endpointPattern: rule.endpointPattern ?? null,
    enabled: rule.enabled,
  };
}

export function normalizeRuleInput(input: RuleInput): RuleInput {
  const tokenBucket = isTokenBucket(input.algorithmType);
  return {
    ...input,
    // The backend validates limit and windowSizeSeconds with @Min(1) even for
    // token bucket rules, so keep a safe, unused value for those fields.
    limit: tokenBucket ? Math.max(1, input.limit || 1) : input.limit,
    windowSizeSeconds: tokenBucket ? Math.max(1, input.windowSizeSeconds || 1) : input.windowSizeSeconds,
    refillRatePerSecond: tokenBucket ? input.refillRatePerSecond : null,
    burstCapacity: tokenBucket ? input.burstCapacity : null,
    identifierValue: input.scopeType === "GLOBAL" ? null : input.identifierValue?.trim() || null,
    endpointPattern: input.endpointPattern?.trim() || null,
  };
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
