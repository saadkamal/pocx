import type { MetadataRoute } from "next";
import { pocxOrigin } from "@/lib/utils";

/**
 * Public marketing + legal surfaces only. Gates, the dashboard, the demo
 * app and APIs are deliberately absent (and disallowed in robots.ts) —
 * customer gates are private by nature.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = pocxOrigin();

  const pages: Array<{
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly";
  }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
    { path: "/tutorials", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
  ];

  return pages.map(({ path, priority, changeFrequency }) => ({
    url: `${origin}${path || "/"}`,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        en: `${origin}${path || "/"}`,
        ja: `${origin}/ja${path}`,
      },
    },
  }));
}
