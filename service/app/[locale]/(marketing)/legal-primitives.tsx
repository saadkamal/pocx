import type { ReactNode } from "react";

/**
 * Shared styling primitives for the legal pages (/terms, /privacy).
 * Content lives in each page's content-en.tsx / content-ja.tsx — the two
 * locales duplicate copy, never styling.
 */

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900">
        {title}
      </h1>
      <p className="mt-3 text-sm text-ink-500">{updated}</p>
      {intro ? (
        <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50 p-5 text-[15px] leading-relaxed text-ink-600">
          {intro}
        </div>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2
        id={id}
        className="mt-12 scroll-mt-24 border-b border-ink-200 pb-3 text-xl font-semibold tracking-tight text-ink-900"
      >
        <a href={`#${id}`} className="hover:text-brand">
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{children}</p>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex gap-3 text-[15px] leading-relaxed text-ink-600"
        >
          <span
            className="mt-[9px] size-1.5 shrink-0 rounded-full bg-ink-400"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
