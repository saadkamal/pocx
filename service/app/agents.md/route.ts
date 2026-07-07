import { buildLlmsText } from "@/lib/llms-text";

export function GET(): Response {
  return new Response(buildLlmsText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
