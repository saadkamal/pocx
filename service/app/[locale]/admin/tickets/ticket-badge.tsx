import { Badge } from "@/components/ui";
import type { TicketStatus } from "@/lib/db/tickets";

/** Admin-facing status badge: "open" = the ball is in our court. */
export function AdminTicketBadge({ status }: { status: TicketStatus }) {
  if (status === "open") return <Badge tone="danger">Needs reply</Badge>;
  if (status === "pending")
    return <Badge tone="warning">Waiting on customer</Badge>;
  return <Badge tone="neutral">Closed</Badge>;
}
