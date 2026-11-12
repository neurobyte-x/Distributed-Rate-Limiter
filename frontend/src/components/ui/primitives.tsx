"use client";

import {
  Check,
  Copy,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Button                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonBase =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-400 text-emerald-950 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_24px_-12px_rgba(16,185,129,0.9)] hover:bg-emerald-300",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-[var(--surface-2)]",
  ghost: "text-[var(--muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]",
  outline:
    "border border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]",
  danger:
    "bg-rose-500 text-white shadow-[0_8px_24px_-12px_rgba(244,63,94,0.55)] hover:bg-rose-400",
  subtle: "bg-[var(--surface-3)] text-[var(--text)] hover:bg-[var(--border)]",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4",
  lg: "h-11 px-5 text-[15px]",
  icon: "size-9",
};

export function buttonStyles(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : Icon ? (
        <Icon className="size-4" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form controls                                                             */
/* -------------------------------------------------------------------------- */

const controlBase =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--text)] shadow-[0_1px_0_rgba(255,255,255,0.02)_inset] transition-colors placeholder:text-[var(--faint)] hover:border-[var(--border-strong)] focus:border-emerald-500/50 focus:bg-[var(--surface-2)] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode;
  invalid?: boolean;
}

export function Input({ className, leading, invalid, ...props }: InputProps) {
  if (leading) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-[var(--faint)]">
          {leading}
        </span>
        <input
          className={cn(controlBase, "h-10 pl-10 pr-3", invalid && "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/10", className)}
          aria-invalid={invalid || undefined}
          {...props}
        />
      </div>
    );
  }
  return (
    <input
      className={cn(controlBase, "h-10 px-3", invalid && "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/10", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(controlBase, "h-10 appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pl-3 pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a99ad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-xs font-medium text-[var(--muted)]">
          {label}
          {required ? <span className="text-emerald-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[var(--faint)]">{hint}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Switch                                                                    */
/* -------------------------------------------------------------------------- */

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:opacity-50",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        checked
          ? "border-emerald-500/50 bg-emerald-500/90"
          : "border-[var(--border-strong)] bg-[var(--surface-3)]",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow-sm transition-transform duration-200",
          size === "sm" ? "size-3.5" : "size-4.5",
          checked
            ? size === "sm"
              ? "translate-x-[18px] bg-emerald-950"
              : "translate-x-[22px] bg-emerald-950"
            : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Badges & chrome                                                           */
/* -------------------------------------------------------------------------- */

export type Tone = "neutral" | "emerald" | "sky" | "violet" | "amber" | "rose" | "orange" | "fuchsia" | "cyan";

export const toneClasses: Record<Tone, string> = {
  neutral: "border-[var(--border-strong)] bg-[var(--surface-3)] text-[var(--muted)]",
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sky: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  orange: "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  fuchsia: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  cyan: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
};

export function Badge({
  tone = "neutral",
  className,
  mono = true,
  children,
}: {
  tone?: Tone;
  className?: string;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        mono && "font-mono uppercase tracking-[0.08em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  id,
  className,
  children,
  as: Component = "div",
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}) {
  return (
    <Component id={id} className={cn("card", className)}>
      {children}
    </Component>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="flex size-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]">
              <Icon className="size-3.5" />
            </span>
          ) : null}
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">{title}</h2>
        </div>
        {description ? <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "emerald",
  className,
  trackClassName,
}: {
  value: number;
  tone?: "emerald" | "amber" | "rose" | "sky" | "violet";
  className?: string;
  trackClassName?: string;
}) {
  const fills: Record<string, string> = {
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-400",
    amber: "bg-gradient-to-r from-amber-500 to-orange-400",
    rose: "bg-gradient-to-r from-rose-500 to-red-400",
    sky: "bg-gradient-to-r from-sky-500 to-cyan-400",
    violet: "bg-gradient-to-r from-violet-500 to-fuchsia-400",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]", trackClassName)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fills[tone], className)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function StatusDot({
  tone = "emerald",
  ping = false,
  className,
}: {
  tone?: "emerald" | "amber" | "rose" | "neutral" | "sky";
  ping?: boolean;
  className?: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-400 text-emerald-400",
    amber: "bg-amber-400 text-amber-400",
    rose: "bg-rose-400 text-rose-400",
    neutral: "bg-slate-400 text-slate-400",
    sky: "bg-sky-400 text-sky-400",
  };
  return (
    <span className={cn("relative inline-flex size-2 shrink-0 rounded-full", colors[tone], className)}>
      {ping ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-50" />
      ) : null}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="relative mb-4 flex size-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
        <Icon className="size-5 text-[var(--muted)]" />
        <span className="absolute inset-0 rounded-2xl bg-emerald-500/5" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Copy button                                                               */
/* -------------------------------------------------------------------------- */

export function CopyButton({
  value,
  label,
  className,
  size = "sm",
}: {
  value: string;
  label?: string;
  className?: string;
  size?: "sm" | "icon";
}) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard access can be blocked; fail silently. */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg text-[11px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]",
        size === "icon" ? "size-7 justify-center" : "px-2 py-1",
        className,
      )}
      aria-label={copied ? "Copied" : label ?? "Copy to clipboard"}
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {size === "sm" && label ? <span>{copied ? "Copied" : label}</span> : null}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal                                                                     */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 20);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const widths = {
    md: "sm:max-w-md",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default bg-[#02060b]/70 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] outline-none animate-scale-in sm:rounded-2xl",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-[var(--text)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
          >
            <XIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
