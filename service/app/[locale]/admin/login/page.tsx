import type { Metadata } from "next";
import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Owner sign-in — POCX ops console",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12">
      <LoginClient />
      <p className="mt-6 max-w-md text-center text-xs text-ink-400">
        This is the POCX owner console. Customer dashboards sign in at{" "}
        <span className="font-mono">/login</span>.
      </p>
    </div>
  );
}
