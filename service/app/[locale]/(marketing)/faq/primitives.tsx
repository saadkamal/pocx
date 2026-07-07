import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Shared styling primitives for the FAQ page. Content lives in
 * content-en.tsx / content-ja.tsx — the two locales duplicate copy,
 * never styling.
 */

export type Faq = { q: ReactNode; a: ReactNode };
export type Section = { title: string; items: Faq[] };

export function FaqSections({ sections }: { sections: Section[] }) {
  return (
    <div className="mt-16 space-y-16">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="border-b border-ink-200 pb-3 text-2xl font-semibold tracking-tight text-ink-900">
            {section.title}
          </h2>
          <div className="mt-6 space-y-3">
            {section.items.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border border-ink-200 bg-white transition-colors open:border-ink-400 hover:border-ink-300"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium text-ink-900 select-none">
                  {item.q}
                  <span
                    className="text-ink-400 transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-[15px] leading-relaxed text-ink-600">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function FaqCta({
  heading,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  heading: ReactNode;
  body: ReactNode;
  primaryHref: string;
  primaryLabel: ReactNode;
  secondaryHref: string;
  secondaryLabel: ReactNode;
}) {
  return (
    <div className="mt-20 rounded-xl bg-ink-950 p-8 text-center">
      <h2 className="text-xl font-semibold tracking-tight text-paper">
        {heading}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-400">
        {body}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className="inline-flex items-center gap-2 rounded-lg bg-paper px-5 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-100"
        >
          {primaryLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-paper transition-colors hover:border-white/40"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
