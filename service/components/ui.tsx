import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny shared UI kit — server-component friendly (no hooks). Interactive
 * behaviour lives in the feature's own client components; these only
 * standardize look and feel across the dashboard, gate and marketing.
 */

/* --- Buttons: build classNames, attach to <button>/<Link>/<a> --- */

export function buttonCn(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
  size: "sm" | "md" | "lg" = "md",
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "px-3 py-1.5 text-sm",
    size === "md" && "px-4 py-2 text-sm",
    size === "lg" && "px-6 py-3 text-base",
    variant === "primary" &&
      "bg-ink-900 text-paper hover:bg-ink-700 active:bg-ink-950",
    variant === "secondary" &&
      "border border-ink-300 bg-paper text-ink-800 hover:border-ink-500",
    variant === "ghost" && "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
    variant === "danger" &&
      "border border-danger/30 bg-danger-subtle text-danger hover:bg-danger hover:text-white",
  );
}

export const inputCn = cn(
  "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900",
  "placeholder:text-ink-400",
  "focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-900/10",
);

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-medium text-ink-700", className)}
    >
      {children}
    </label>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 bg-paper p-6 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("mb-1 text-base font-semibold text-ink-900", className)}>
      {children}
    </h2>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-ink-100 text-ink-600",
        tone === "brand" && "bg-brand-subtle text-brand-active",
        tone === "success" && "bg-success-subtle text-success",
        tone === "warning" && "bg-warning-subtle text-warning",
        tone === "danger" && "bg-danger-subtle text-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --- Table primitives --- */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-200 bg-paper shadow-card">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="border-b border-ink-200 bg-ink-50 px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-b border-ink-100 px-4 py-2.5 align-middle", className)}>
      {children}
    </td>
  );
}

export function EmptyState({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink-300 bg-ink-50 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {hint ? <p className="mt-1 text-sm text-ink-500">{hint}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

/** Monospace inline code chip (keys, ids, hashes). */
export function Mono({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <code
      title={title}
      className={cn(
        "rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.8em] text-ink-800",
        className,
      )}
    >
      {children}
    </code>
  );
}
