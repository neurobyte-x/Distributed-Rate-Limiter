"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { RULE_TEMPLATES, type RuleTemplate } from "@/lib/rule-meta";
import { AlgorithmBadge, ScopeBadge } from "@/components/rule-badges";
import { Card } from "@/components/ui/primitives";
import { AlgorithmIcon } from "./algorithm-icon";

export function RuleTemplates({ onUse }: { onUse: (template: RuleTemplate) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface-2)]/40 px-5 py-5">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-emerald-500" />
            <span className="eyebrow">No rules yet</span>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--text)]">
            Start with a proven pattern
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-[var(--muted)]">
            Templates prefill the policy builder with sensible limits. Adjust anything before saving.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        {RULE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onUse(template)}
            className="group relative flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[0_12px_30px_-20px_rgba(0,0,0,0.5)]"
          >
            <span
              className="absolute inset-x-3 top-0 h-px opacity-70"
              style={{ background: `linear-gradient(90deg, transparent, ${template.accent}, transparent)` }}
            />
            <span
              className="flex size-8 items-center justify-center rounded-lg border"
              style={{
                borderColor: `${template.accent}55`,
                backgroundColor: `${template.accent}14`,
                color: template.accent,
              }}
            >
              <AlgorithmIcon type={template.draft.algorithmType} />
            </span>
            <span className="mt-2.5 text-[13px] font-semibold text-[var(--text)]">{template.title}</span>
            <span className="mt-1 flex-1 text-[10px] leading-relaxed text-[var(--muted)]">
              {template.description}
            </span>
            <span className="mt-2.5 flex flex-wrap items-center gap-1">
              <AlgorithmBadge value={template.draft.algorithmType} />
              <ScopeBadge value={template.draft.scopeType} />
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              Use template
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
