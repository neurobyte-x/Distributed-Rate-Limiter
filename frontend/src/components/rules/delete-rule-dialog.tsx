"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { RateLimitRule } from "@/lib/types";
import { describeLimit, shortId } from "@/lib/utils";
import { useRules } from "@/providers/rules-provider";
import { useToast } from "@/providers/toast-provider";
import { AlgorithmBadge, ScopeBadge } from "@/components/rule-badges";
import { Button, Modal } from "@/components/ui/primitives";

export function DeleteRuleDialog({
  rule,
  onClose,
}: {
  rule: RateLimitRule;
  onClose: () => void;
}) {
  const { deleteRule } = useRules();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setDeleting(true);
    setError(null);
    try {
      await deleteRule(rule.ruleId);
      toast({
        title: "Rule deleted",
        description: `${describeLimit(rule)} on ${rule.endpointPattern ?? "all endpoints"}`,
      });
      onClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError ? deleteError.message : "Could not delete the rule.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onClose={() => {
        if (!deleting) onClose();
      }}
      title="Delete this rule?"
      description="This removes the policy from Redis. The limiter stops enforcing it immediately."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={deleting}>
            Keep rule
          </Button>
          <Button variant="danger" onClick={() => void confirm()} loading={deleting}>
            {!deleting ? <Trash2 className="size-3.5" /> : null}
            Delete permanently
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <AlgorithmBadge value={rule.algorithmType} />
            <ScopeBadge value={rule.scopeType} />
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {rule.identifierValue ?? "all traffic"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--muted)]">
            <span className="font-mono">{describeLimit(rule)}</span>
            <span aria-hidden>·</span>
            <span className="font-mono text-[var(--faint)]">{rule.endpointPattern ?? "all endpoints"}</span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-[var(--faint)]">#{shortId(rule.ruleId, 12)}</p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-[var(--muted)]">
            Existing counters in Redis expire naturally. Other rules continue to apply.
          </p>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-[11px] text-rose-600 dark:text-rose-300">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
