import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Public origin of this POCX deployment (emails, redirects, snippets). */
export function pocxOrigin(): string {
  return (process.env.POCX_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
}

export function formatDateTime(d: Date | number): string {
  return new Date(d).toLocaleString("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** "a-z0-9-" slug from a display name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
