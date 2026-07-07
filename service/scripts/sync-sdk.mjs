#!/usr/bin/env node
/**
 * Sync the SDK source into the service's public folder so customers can
 * vendor it straight from a running POCX instance:
 *
 *     curl -o lib/pocx.ts https://YOUR-POCX-HOST/sdk/pocx.ts
 *
 * Usage: npm run sync-sdk (from service/). The copy must never drift from
 * sdk/src/pocx.ts — this script is the only writer of public/sdk/pocx.ts.
 */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..", "..", "sdk", "src", "pocx.ts");
const dest = path.resolve(here, "..", "public", "sdk", "pocx.ts");

await mkdir(path.dirname(dest), { recursive: true });
await copyFile(src, dest);
console.log(`[sync-sdk] ${src} -> ${dest}`);
