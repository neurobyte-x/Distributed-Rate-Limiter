"use client";

import {
  AlertTriangle,
  CopyPlus,
  ListFilter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { ALGORITHMS, SCOPES, type RuleTemplate } from "@/lib/rule-meta";
import type { RateLimitRule } from "@/lib/types";
import {
  cn,
  describeLimit,
  describeLimitLong,
  shortId,
} from "@/lib/utils";
import { useRules } from "@/providers/rules-provider";
import { useToast } from "@/providers/toast-provider";
import { PageHeader } from "@/components/page-header";
import { AlgorithmBadge, ScopeBadge } from "@/components/rule-badges";
import {
  Button,
  Card,
  CopyButton,
  EmptyState,
  Input,
  Select,
  Skeleton,
  Switch,
} from "@/components/ui/primitives";
import { RuleFormModal } from "./rule-form";
import { DeleteRuleDialog } from "./delete-rule-dialog";
import { RuleTemplates } from "./rule-templates";

type StatusFilter = "all" | "enabled" | "paused";

export function RulesView() {
  const {
    rules,
    status,
    error,
    refresh,
    refreshing,
    toggleRule,
  } = useRules();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedFromQuery = useRef(false);

  const [search, setSearch] = useState("");
  const [algorithmFilter, setAlgorithmFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RateLimitRule | null>(null);
  const [draft, setDraft] = useState<RuleTemplate["draft"] | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<RateLimitRule | null>(null);

  const offline = status === "error";

  useEffect(() => {
    if (searchParams.get("new") === "1" && !openedFromQuery.current) {
      openedFromQuery.current = true;
      setEditing(null);
      setDraft(null);
      setFormOpen(true);
      setFormSession((session) => session + 1);
      router.replace("/rules", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function openCreate() {
    setEditing(null);
    setDraft(null);
    setFormSession((session) => session + 1);
    setFormOpen(true);
  }

  function openEdit(rule: RateLimitRule) {
    setEditing(rule);
    setDraft(null);
    setFormSession((session) => session + 1);
    setFormOpen(true);
  }

  function openTemplate(template: RuleTemplate) {
    setEditing(null);
    setDraft(template.draft);
    setFormSession((session) => session + 1);
    setFormOpen(true);
  }

  function openDuplicate(rule: RateLimitRule) {
    setEditing(null);
    setDraft({
      algorithmType: rule.algorithmType,
      scopeType: rule.scopeType,
      identifierValue: rule.identifierValue ?? "",
      endpointPattern: rule.endpointPattern ?? "",
      limit: rule.limit,
      windowSizeSeconds: rule.windowSizeSeconds,
      refillRatePerSecond: rule.refillRatePerSecond,
      burstCapacity: rule.burstCapacity,
    });
    setFormSession((session) => session + 1);
    setFormOpen(true);
  }

  async function handleToggle(rule: RateLimitRule) {
    try {
      await toggleRule(rule);
      toast({
        title: rule.enabled ? "Rule paused" : "Rule enabled",
        description: `${describeLimit(rule)} · ${rule.identifierValue ?? "all traffic"}`,
      });
    } catch (toggleError) {
      toast({
        title: "Could not update rule",
        description:
          toggleError instanceof ApiError ? toggleError.message : "Try again in a moment.",
        variant: "error",
      });
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...rules]
      .filter((rule) => {
        if (statusFilter === "enabled" && !rule.enabled) return false;
        if (statusFilter === "paused" && rule.enabled) return false;
        if (algorithmFilter !== "ALL" && rule.algorithmType !== algorithmFilter) return false;
        if (scopeFilter !== "ALL" && rule.scopeType !== scopeFilter) return false;
        if (!query) return true;
        return [
          rule.ruleId,
          rule.identifierValue ?? "",
          rule.endpointPattern ?? "",
          rule.algorithmType,
          rule.scopeType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort(
        (a, b) =>
          Number(b.enabled) - Number(a.enabled) ||
          (a.endpointPattern ?? "").localeCompare(b.endpointPattern ?? "") ||
          a.ruleId.localeCompare(b.ruleId),
      );
  }, [rules, search, algorithmFilter, scopeFilter, statusFilter]);

  const enabled = rules.filter((rule) => rule.enabled).length;
  const paused = rules.length - enabled;
  const hasFilters =
    search.trim().length > 0 ||
    algorithmFilter !== "ALL" ||
    scopeFilter !== "ALL" ||
    statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setAlgorithmFilter("ALL");
    setScopeFilter("ALL");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Policy engine"
        title="Rate limit rules"
        description="Every enabled rule is evaluated on each request. The strictest outcome wins across scopes."
        actions={
          <>
            <Button variant="secondary" onClick={() => void refresh()} loading={refreshing}>
              <RefreshCw className="size-4" />
              Sync
            </Button>
            <Button variant="primary" onClick={openCreate} disabled={offline}>
              <Plus className="size-4" />
              New rule
            </Button>
          </>
        }
      />

      {offline ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-rose-500" />
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">Policy engine unreachable</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">
                {error ?? "The console cannot reach the rate limiter API."} Start the backend and Redis,
                then sync again.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <code className="rounded-lg bg-[var(--surface)] px-2 py-1.5 font-mono text-[10px] text-[var(--muted)]">
              docker compose up --build
            </code>
            <CopyButton value="docker compose up --build" size="icon" />
            <Button variant="secondary" size="sm" onClick={() => void refresh()} loading={refreshing}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {status === "loading" ? (
        <Card className="overflow-hidden">
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        </Card>
      ) : status === "ready" && rules.length === 0 ? (
        <RuleTemplates onUse={openTemplate} />
      ) : status === "ready" ? (
        <>
          <Card className="p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1 lg:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--faint)]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search rules, IDs, endpoints…"
                  className="h-9 pl-9"
                  aria-label="Search rules"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-[var(--faint)] hover:text-[var(--text)]"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={algorithmFilter}
                  onChange={(event) => setAlgorithmFilter(event.target.value)}
                  className="h-9 w-auto min-w-[142px] text-[12px]"
                  aria-label="Filter by algorithm"
                >
                  <option value="ALL">All algorithms</option>
                  {ALGORITHMS.map((algorithm) => (
                    <option key={algorithm.value} value={algorithm.value}>
                      {algorithm.label}
                    </option>
                  ))}
                </Select>

                <Select
                  value={scopeFilter}
                  onChange={(event) => setScopeFilter(event.target.value)}
                  className="h-9 w-auto min-w-[120px] text-[12px]"
                  aria-label="Filter by scope"
                >
                  <option value="ALL">All scopes</option>
                  {SCOPES.map((scope) => (
                    <option key={scope.value} value={scope.value}>
                      {scope.label}
                    </option>
                  ))}
                </Select>

                <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
                  {(
                    [
                      { value: "all", label: "All", count: rules.length },
                      { value: "enabled", label: "On", count: enabled },
                      { value: "paused", label: "Off", count: paused },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                        statusFilter === option.value
                          ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                          : "text-[var(--faint)] hover:text-[var(--text)]",
                      )}
                    >
                      {option.label}
                      <span className="ml-1 font-mono text-[9px] text-[var(--faint)]">{option.count}</span>
                    </button>
                  ))}
                </div>

                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[var(--faint)] transition-colors hover:text-[var(--text)]"
                  >
                    <X className="size-3" />
                    Clear
                  </button>
                ) : null}
              </div>

              <span className="font-mono text-[10px] text-[var(--faint)] lg:ml-auto">
                {filtered.length} / {rules.length} shown
              </span>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={ListFilter}
                title="No rules match these filters"
                description="Try a different algorithm, scope, or search term."
                action={
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/50">
                      {["Policy", "Scope", "Limit", "Endpoint", "State", ""].map((heading, index) => (
                        <th
                          key={heading || "actions"}
                          className={cn(
                            "px-4 py-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--faint)] first:pl-5",
                            index === 5 && "pr-5 text-right",
                          )}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map((rule) => (
                      <tr
                        key={rule.ruleId}
                        className={cn(
                          "group transition-colors hover:bg-[var(--surface-2)]/50",
                          !rule.enabled && "opacity-65",
                        )}
                      >
                        <td className="max-w-[190px] pl-5 pr-4 py-3">
                          <div className="flex flex-col gap-1">
                            <AlgorithmBadge value={rule.algorithmType} className="w-fit" />
                            <span className="font-mono text-[10px] text-[var(--faint)]">
                              #{shortId(rule.ruleId, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[190px] px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <ScopeBadge value={rule.scopeType} />
                            <span
                              className="max-w-[170px] truncate font-mono text-[10px] text-[var(--muted)]"
                              title={rule.identifierValue ?? "All traffic"}
                            >
                              {rule.identifierValue ?? "all traffic"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="whitespace-nowrap font-mono text-[11px] text-[var(--text)]"
                            title={describeLimitLong(rule)}
                          >
                            {describeLimit(rule)}
                          </span>
                        </td>
                        <td className="max-w-[180px] px-4 py-3">
                          <span
                            className="block max-w-[180px] truncate font-mono text-[11px] text-[var(--muted)]"
                            title={rule.endpointPattern ?? "All endpoints"}
                          >
                            {rule.endpointPattern ?? "all endpoints"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.enabled}
                              onChange={() => void handleToggle(rule)}
                              size="sm"
                              label={`${rule.enabled ? "Pause" : "Enable"} rule ${rule.ruleId}`}
                            />
                            <span
                              className={cn(
                                "font-mono text-[9px] uppercase tracking-[0.1em]",
                                rule.enabled
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : "text-[var(--faint)]",
                              )}
                            >
                              {rule.enabled ? "on" : "off"}
                            </span>
                          </div>
                        </td>
                        <td className="pr-5 pl-4 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            <RowAction
                              label="Edit rule"
                              onClick={() => openEdit(rule)}
                              icon={<Pencil className="size-3.5" />}
                            />
                            <RowAction
                              label="Duplicate rule"
                              onClick={() => openDuplicate(rule)}
                              icon={<CopyPlus className="size-3.5" />}
                            />
                            <RowAction
                              label="Delete rule"
                              onClick={() => setDeleteTarget(rule)}
                              icon={<Trash2 className="size-3.5" />}
                              danger
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-[var(--border)] md:hidden">
                {filtered.map((rule) => (
                  <li key={rule.ruleId} className={cn("p-4", !rule.enabled && "opacity-70")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AlgorithmBadge value={rule.algorithmType} />
                        <ScopeBadge value={rule.scopeType} />
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onChange={() => void handleToggle(rule)}
                        size="sm"
                        label={`${rule.enabled ? "Pause" : "Enable"} rule ${rule.ruleId}`}
                      />
                    </div>
                    <p className="mt-2 truncate font-mono text-[11px] text-[var(--muted)]">
                      {rule.identifierValue ?? "all traffic"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                      <span className="font-mono text-[var(--text)]">{describeLimit(rule)}</span>
                      <span aria-hidden className="text-[var(--faint)]">·</span>
                      <span className="truncate font-mono text-[var(--faint)]">
                        {rule.endpointPattern ?? "all endpoints"}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-[var(--faint)]">#{shortId(rule.ruleId, 8)}</span>
                      <div className="flex items-center gap-1">
                        <RowAction
                          label="Edit rule"
                          onClick={() => openEdit(rule)}
                          icon={<Pencil className="size-3.5" />}
                        />
                        <RowAction
                          label="Duplicate rule"
                          onClick={() => openDuplicate(rule)}
                          icon={<CopyPlus className="size-3.5" />}
                        />
                        <RowAction
                          label="Delete rule"
                          onClick={() => setDeleteTarget(rule)}
                          icon={<Trash2 className="size-3.5" />}
                          danger
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2 border-t border-[var(--border)] px-5 py-2.5 text-[10px] text-[var(--faint)] sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {enabled} enforcing · {paused} paused · strictest decision wins per request
                </span>
                <span className="font-mono">GET /api/rules</span>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="Rules could not be loaded"
            description={error ?? "The API did not return a policy list."}
            action={
              <Button variant="secondary" size="sm" onClick={() => void refresh()} loading={refreshing}>
                <RefreshCw className="size-3.5" />
                Try again
              </Button>
            }
          />
        </Card>
      )}

      {formOpen ? (
        <RuleFormModal
          key={`${editing?.ruleId ?? "new"}-${formSession}`}
          open
          onClose={() => setFormOpen(false)}
          rule={editing}
          draft={draft}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteRuleDialog rule={deleteTarget} onClose={() => setDeleteTarget(null)} />
      ) : null}
    </div>
  );
}

function RowAction({
  label,
  onClick,
  icon,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-lg text-[var(--faint)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]",
        danger && "hover:bg-rose-500/10 hover:text-rose-500",
      )}
    >
      {icon}
    </button>
  );
}
