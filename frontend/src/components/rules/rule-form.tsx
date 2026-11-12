"use client";

import { AlertTriangle, Check, CircleAlert, Save, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import {
  ALGORITHMS,
  ENDPOINT_PRESETS,
  SCOPE_MAP,
  SCOPES,
  WINDOW_PRESETS,
} from "@/lib/rule-meta";
import type { AlgorithmType, RateLimitRule, RuleInput, ScopeType } from "@/lib/types";
import { cn, rulePreview } from "@/lib/utils";
import { useRules } from "@/providers/rules-provider";
import { useToast } from "@/providers/toast-provider";
import {
  Button,
  Field,
  Input,
  Modal,
  Switch,
} from "@/components/ui/primitives";
import { AlgorithmIcon } from "./algorithm-icon";

interface Draft {
  algorithmType: AlgorithmType;
  scopeType: ScopeType;
  identifierValue: string;
  endpointPattern: string;
  limit: number;
  windowSizeSeconds: number;
  refillRatePerSecond: number | null;
  burstCapacity: number | null;
}

interface FormState {
  algorithmType: AlgorithmType;
  scopeType: ScopeType;
  identifierValue: string;
  endpointPattern: string;
  limit: string;
  windowSizeSeconds: string;
  refillRatePerSecond: string;
  burstCapacity: string;
  enabled: boolean;
}

function initialState(rule?: RateLimitRule | null, draft?: Draft | null): FormState {
  if (rule) {
    return {
      algorithmType: rule.algorithmType,
      scopeType: rule.scopeType,
      identifierValue: rule.identifierValue ?? "",
      endpointPattern: rule.endpointPattern ?? "",
      limit: String(rule.limit || 10),
      windowSizeSeconds: String(rule.windowSizeSeconds || 60),
      refillRatePerSecond: rule.refillRatePerSecond != null ? String(rule.refillRatePerSecond) : "2",
      burstCapacity: rule.burstCapacity != null ? String(rule.burstCapacity) : "10",
      enabled: rule.enabled,
    };
  }

  if (draft) {
    return {
      algorithmType: draft.algorithmType,
      scopeType: draft.scopeType,
      identifierValue: draft.identifierValue,
      endpointPattern: draft.endpointPattern,
      limit: String(draft.limit || 10),
      windowSizeSeconds: String(draft.windowSizeSeconds || 60),
      refillRatePerSecond: draft.refillRatePerSecond != null ? String(draft.refillRatePerSecond) : "2",
      burstCapacity: draft.burstCapacity != null ? String(draft.burstCapacity) : "10",
      enabled: true,
    };
  }

  return {
    algorithmType: "FIXED_WINDOW",
    scopeType: "USER",
    identifierValue: "",
    endpointPattern: "/api/**",
    limit: "10",
    windowSizeSeconds: "60",
    refillRatePerSecond: "2",
    burstCapacity: "10",
    enabled: true,
  };
}

export function RuleFormModal({
  open,
  onClose,
  rule,
  draft,
}: {
  open: boolean;
  onClose: () => void;
  rule?: RateLimitRule | null;
  draft?: Draft | null;
}) {
  const { createRule, updateRule } = useRules();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => initialState(rule, draft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<{ message: string; details: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const tokenBucket = form.algorithmType === "TOKEN_BUCKET";
  const scopeMeta = SCOPE_MAP[form.scopeType];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
    setServerError(null);
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};

    if (form.scopeType !== "GLOBAL" && !form.identifierValue.trim()) {
      next.identifierValue = `${scopeMeta.identifierLabel} is required for the ${scopeMeta.label.toLowerCase()} scope.`;
    }

    if (tokenBucket) {
      const refill = Number(form.refillRatePerSecond);
      if (!form.refillRatePerSecond.trim() || !Number.isFinite(refill) || refill <= 0) {
        next.refillRatePerSecond = "Enter a refill rate greater than 0.";
      }
      const burst = Number(form.burstCapacity);
      if (!Number.isInteger(burst) || burst < 1) {
        next.burstCapacity = "Burst capacity must be at least 1.";
      }
    } else {
      const limit = Number(form.limit);
      if (!Number.isInteger(limit) || limit < 1) {
        next.limit = "Limit must be at least 1.";
      }
      const window = Number(form.windowSizeSeconds);
      if (!Number.isInteger(window) || window < 1) {
        next.windowSizeSeconds = "Window must be at least 1 second.";
      }
    }

    if (form.endpointPattern.trim() && !form.endpointPattern.trim().startsWith("/")) {
      next.endpointPattern = "Patterns should start with “/” to match request paths.";
    }

    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: RuleInput = {
      algorithmType: form.algorithmType,
      limit: Number(form.limit) || 1,
      windowSizeSeconds: Number(form.windowSizeSeconds) || 1,
      refillRatePerSecond: tokenBucket ? Number(form.refillRatePerSecond) : null,
      burstCapacity: tokenBucket ? Number(form.burstCapacity) : null,
      scopeType: form.scopeType,
      identifierValue: form.identifierValue.trim() || null,
      endpointPattern: form.endpointPattern.trim() || null,
      enabled: form.enabled,
    };

    setSaving(true);
    setServerError(null);

    try {
      if (rule) {
        await updateRule(rule.ruleId, payload);
        toast({
          title: "Rule updated",
          description: `Changes are live for ${form.scopeType === "GLOBAL" ? "all traffic" : form.identifierValue}.`,
        });
      } else {
        await createRule(payload);
        toast({
          title: "Rule created",
          description: "The limiter will evaluate it on the next request.",
        });
      }
      onClose();
    } catch (error) {
      setServerError({
        message: error instanceof ApiError ? error.message : "Could not save the rule.",
        details: error instanceof ApiError ? error.details : [],
      });
    } finally {
      setSaving(false);
    }
  }

  const preview = rulePreview({
    algorithmType: form.algorithmType,
    scopeType: form.scopeType,
    identifierValue: form.identifierValue,
    endpointPattern: form.endpointPattern,
    limit: Number(form.limit) || 0,
    windowSizeSeconds: Number(form.windowSizeSeconds) || 0,
    refillRatePerSecond: form.refillRatePerSecond ? Number(form.refillRatePerSecond) : null,
    burstCapacity: form.burstCapacity ? Number(form.burstCapacity) : null,
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={rule ? "Edit rate limit rule" : "Create rate limit rule"}
      description={
        rule
          ? "Changes apply immediately to every instance reading from Redis."
          : "Choose an algorithm, scope, and limit. The preview shows exactly what will be enforced."
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-[10px] text-[var(--faint)] sm:block">
            Evaluated by <span className="font-mono">/api/rate-limit/check</span>
          </p>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="rule-form" variant="primary" loading={saving}>
              {!saving ? <Save className="size-3.5" /> : null}
              {rule ? "Save changes" : "Create rule"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="rule-form" onSubmit={handleSubmit} className="space-y-6">
        {serverError ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-rose-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text)]">{serverError.message}</p>
              {serverError.details.length ? (
                <ul className="mt-1 space-y-0.5">
                  {serverError.details.map((detail) => (
                    <li key={detail} className="text-[11px] text-[var(--muted)]">
                      {detail}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        <section>
          <SectionLabel index="01" title="Algorithm" hint="How requests are counted" />
          <div role="radiogroup" aria-label="Algorithm" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALGORITHMS.map((algorithm) => {
              const selected = form.algorithmType === algorithm.value;
              return (
                <button
                  key={algorithm.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("algorithmType", algorithm.value)}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                    selected
                      ? "border-emerald-500/45 bg-emerald-500/[0.06] shadow-[0_0_0_1px_rgba(16,185,129,0.14)]"
                      : "border-[var(--border)] bg-[var(--surface-2)]/40 hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
                  )}
                >
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `${algorithm.color}55`,
                      backgroundColor: `${algorithm.color}14`,
                      color: algorithm.color,
                    }}
                  >
                    <AlgorithmIcon type={algorithm.value} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
                      {algorithm.label}
                      {selected ? <Check className="size-3.5 text-emerald-500" /> : null}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--muted)]">
                      {algorithm.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--faint)]">
            <Sparkles className="mt-0.5 size-3 shrink-0" />
            {ALGORITHMS.find((algorithm) => algorithm.value === form.algorithmType)?.blurb}
          </p>
        </section>

        <section>
          <SectionLabel index="02" title="Scope" hint="Who shares the budget" />
          <div role="radiogroup" aria-label="Scope" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SCOPES.map((scope) => {
              const selected = form.scopeType === scope.value;
              return (
                <button
                  key={scope.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("scopeType", scope.value)}
                  className={cn(
                    "rounded-xl border px-2.5 py-2 text-left transition-all",
                    selected
                      ? "border-emerald-500/45 bg-emerald-500/[0.06]"
                      : "border-[var(--border)] bg-[var(--surface-2)]/40 hover:border-[var(--border-strong)]",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text)]">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: scope.color }} />
                    {scope.label}
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-snug text-[var(--faint)]">
                    {scope.description}
                  </span>
                </button>
              );
            })}
          </div>

          {form.scopeType !== "GLOBAL" ? (
            <div className="mt-3">
              <Field
                label={scopeMeta.identifierLabel}
                htmlFor="rule-identifier"
                required
                error={errors.identifierValue}
                hint={
                  form.scopeType === "ENDPOINT"
                    ? "Requests whose path matches this pattern share one bucket."
                    : `Only requests carrying this ${scopeMeta.identifierLabel.toLowerCase()} are matched.`
                }
              >
                <Input
                  id="rule-identifier"
                  value={form.identifierValue}
                  onChange={(event) => set("identifierValue", event.target.value)}
                  placeholder={scopeMeta.identifierPlaceholder}
                  invalid={Boolean(errors.identifierValue)}
                  autoComplete="off"
                  className="font-mono"
                />
              </Field>
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2 text-[10px] leading-relaxed text-[var(--muted)]">
              A single budget is shared by every request. No identifier is needed.
            </p>
          )}
        </section>

        <section>
          <SectionLabel
            index="03"
            title="Limits"
            hint={tokenBucket ? "Refill and burst" : "Quota and window"}
          />
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3.5">
            {tokenBucket ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Refill rate"
                    htmlFor="rule-refill"
                    required
                    error={errors.refillRatePerSecond}
                    hint="Tokens added per second"
                  >
                    <div className="relative">
                      <Input
                        id="rule-refill"
                        type="number"
                        min="0.0001"
                        step="0.1"
                        value={form.refillRatePerSecond}
                        onChange={(event) => set("refillRatePerSecond", event.target.value)}
                        invalid={Boolean(errors.refillRatePerSecond)}
                        className="pr-10 font-mono"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-[var(--faint)]">
                        /sec
                      </span>
                    </div>
                  </Field>
                  <Field
                    label="Burst capacity"
                    htmlFor="rule-burst"
                    required
                    error={errors.burstCapacity}
                    hint="Maximum tokens stored"
                  >
                    <Input
                      id="rule-burst"
                      type="number"
                      min="1"
                      step="1"
                      value={form.burstCapacity}
                      onChange={(event) => set("burstCapacity", event.target.value)}
                      invalid={Boolean(errors.burstCapacity)}
                      className="font-mono"
                    />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {[
                    { label: "1/s · 10", refill: "1", burst: "10" },
                    { label: "5/s · 50", refill: "5", burst: "50" },
                    { label: "20/s · 100", refill: "20", burst: "100" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        set("refillRatePerSecond", preset.refill);
                        set("burstCapacity", preset.burst);
                      }}
                      className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-[10px] text-[var(--muted)] transition-colors hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Request limit"
                    htmlFor="rule-limit"
                    required
                    error={errors.limit}
                    hint="Allowed requests per window"
                  >
                    <Input
                      id="rule-limit"
                      type="number"
                      min="1"
                      step="1"
                      value={form.limit}
                      onChange={(event) => set("limit", event.target.value)}
                      invalid={Boolean(errors.limit)}
                      className="font-mono"
                    />
                  </Field>
                  <Field
                    label="Window size"
                    htmlFor="rule-window"
                    required
                    error={errors.windowSizeSeconds}
                    hint="Length of the counting window"
                  >
                    <div className="relative">
                      <Input
                        id="rule-window"
                        type="number"
                        min="1"
                        step="1"
                        value={form.windowSizeSeconds}
                        onChange={(event) => set("windowSizeSeconds", event.target.value)}
                        invalid={Boolean(errors.windowSizeSeconds)}
                        className="pr-10 font-mono"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-[var(--faint)]">
                        sec
                      </span>
                    </div>
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {WINDOW_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => set("windowSizeSeconds", String(preset.value))}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] transition-colors",
                        Number(form.windowSizeSeconds) === preset.value
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <SectionLabel index="04" title="Match & state" hint="Endpoint filter and availability" />
          <div className="mt-3 space-y-3">
            <Field
              label="Endpoint pattern"
              htmlFor="rule-endpoint"
              error={errors.endpointPattern}
              hint="Ant-style glob applied to request paths. Leave blank to match everything."
            >
              <Input
                id="rule-endpoint"
                value={form.endpointPattern}
                onChange={(event) => set("endpointPattern", event.target.value)}
                placeholder="/api/**"
                invalid={Boolean(errors.endpointPattern)}
                className="font-mono"
                autoComplete="off"
              />
            </Field>
            <div className="flex flex-wrap gap-1">
              {ENDPOINT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => set("endpointPattern", preset)}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 font-mono text-[10px] text-[var(--muted)] transition-colors hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 px-3.5 py-3">
              <div>
                <p className="text-xs font-semibold text-[var(--text)]">Rule enabled</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                  Disabled rules stay saved but are skipped during evaluation.
                </p>
              </div>
              <Switch checked={form.enabled} onChange={(next) => set("enabled", next)} label="Rule enabled" />
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-emerald-500" />
            <p className="eyebrow !text-emerald-700 dark:!text-emerald-300">Policy preview</p>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text)]">{preview}</p>
          {form.scopeType === "ENDPOINT" && form.endpointPattern ? (
            <p className="mt-1 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
              <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
              Endpoint-scoped rules also apply the endpoint pattern filter, so both must match.
            </p>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

function SectionLabel({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] text-[var(--faint)]">{index}</span>
      <h3 className="text-xs font-semibold text-[var(--text)]">{title}</h3>
      {hint ? <span className="hidden text-[10px] text-[var(--faint)] sm:inline">· {hint}</span> : null}
      <span className="ml-1 h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}
