import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { adminSettings } from "./schema";

/** Owner settings store (key → JSON). Small, read rarely, cache-free. */

export function getSetting(key: string): string | null {
  return (
    getDb()
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key))
      .get()?.value ?? null
  );
}

export function getJsonSetting<T>(key: string, fallback: T): T {
  const raw = getSetting(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJsonSetting(key: string, value: unknown): void {
  getDb()
    .insert(adminSettings)
    .values({ key, value: JSON.stringify(value), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: adminSettings.key,
      set: { value: JSON.stringify(value), updatedAt: new Date() },
    })
    .run();
}
