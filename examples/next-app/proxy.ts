// The entire POCX integration: create the gate, export it as the proxy.
// (Next.js <= 15: same three lines, but the file is named middleware.ts.)
import { createPocxGate } from "./lib/pocx";

const gate = createPocxGate();
export default gate.nextProxy();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
