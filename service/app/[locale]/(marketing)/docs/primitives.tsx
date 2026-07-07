import type { ReactNode } from "react";
import { CopyButton } from "../copy-button";

/**
 * Shared styling primitives for the docs page. Content lives in
 * content-en.tsx / content-ja.tsx — the two locales duplicate copy,
 * never styling.
 */

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-16 scroll-mt-24 border-b border-ink-200 pb-3 text-2xl font-semibold tracking-tight text-ink-900 first:mt-0"
    >
      <a href={`#${id}`} className="hover:text-brand">
        {children}
      </a>
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{children}</p>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-ink-200 bg-ink-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ink-800">
      {children}
    </code>
  );
}

export function CodeBlock({
  title,
  code,
  copyText,
}: {
  title?: string;
  code: ReactNode;
  copyText?: string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg bg-ink-950">
      {(title || copyText) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
          <span className="font-mono text-xs text-ink-400">{title}</span>
          {copyText ? <CopyButton text={copyText} /> : null}
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="mt-5 list-none space-y-6 [counter-reset:step]">
      {children}
    </ol>
  );
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="relative pl-11 [counter-increment:step] before:absolute before:top-0 before:left-0 before:flex before:size-7 before:items-center before:justify-center before:rounded-full before:bg-ink-900 before:font-mono before:text-xs before:font-bold before:text-paper before:content-[counter(step)]">
      <p className="text-[15px] font-semibold text-ink-900">{title}</p>
      <div className="mt-1.5 text-[15px] leading-relaxed text-ink-600">
        {children}
      </div>
    </li>
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
