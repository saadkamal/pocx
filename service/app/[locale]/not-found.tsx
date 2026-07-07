import Link from "next/link";

/**
 * not-found receives no params (and useParams is client-only), so this page
 * is deliberately bilingual — one design, English line with Japanese beneath.
 * Links use unprefixed paths; the proxy bounces /ja users via their cookie.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        This door doesn’t exist.
      </h1>
      <p className="mt-2 text-lg font-medium text-ink-700" lang="ja">
        このページは存在しません。
      </p>
      <p className="mt-4 max-w-md text-base text-ink-600">
        The page you’re looking for was moved, revoked, or never gated in the
        first place.
      </p>
      <p className="mt-1 max-w-md text-sm text-ink-500" lang="ja">
        お探しのページは移動または取り消されたか、そもそも存在していません。
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink-700 active:bg-ink-950"
        >
          Back home · ホームへ
        </Link>
        <Link
          href="/docs"
          className="rounded-lg border border-ink-300 bg-paper px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-500"
        >
          Docs · ドキュメント
        </Link>
      </div>
    </div>
  );
}
