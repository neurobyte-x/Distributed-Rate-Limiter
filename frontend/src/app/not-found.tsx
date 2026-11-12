import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">
        This route is not limited — or found
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
        The page you are looking for does not exist. Head back to the control plane.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-medium text-emerald-950 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.9)] transition-colors hover:bg-emerald-300"
      >
        Back to overview
      </Link>
    </div>
  );
}
