import { notFound } from "next/navigation";

/** Catch-all: any URL that matches no page renders the locale's 404. */
export default function CatchAll() {
  notFound();
}
