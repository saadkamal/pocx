import Link from "next/link";
import { pocxOrigin } from "@/lib/utils";
import { TERMS_VARIABLES } from "@/lib/terms";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { CopyButton } from "../copy-button";
import { H2, P, Code, CodeBlock, Steps, Step, Bullets } from "./primitives";

const locale: Locale = "ja";

const TOC = [
  { id: "quickstart", label: "クイックスタート（5分）" },
  { id: "flow", label: "フローの仕組み" },
  { id: "express", label: "Express / 任意のNodeアプリ" },
  { id: "configuration", label: "設定リファレンス" },
  { id: "terms", label: "規約のカスタマイズ" },
  { id: "security", label: "セキュリティモデル" },
  { id: "agents", label: "コーディングエージェント向け" },
] as const;

export function DocsContentJa() {
  const origin = pocxOrigin();

  const curlCmd = `curl -o lib/pocx.ts ${origin}/sdk/pocx.ts`;
  const proxySnippet = `import { createPocxGate } from "./lib/pocx";

const gate = createPocxGate();

export const proxy = gate.nextProxy();
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};`;
  const envSnippet = `POCX_URL=${origin}
POCX_PROJECT_KEY=pocx_pk_…
POCX_SECRET=pocx_sk_…   # server-side only — never expose to the browser`;
  const expressSnippet = `import express from "express";
import { createPocxGate } from "./lib/pocx";

const app = express();
const gate = createPocxGate();

app.use(gate.expressMiddleware());`;
  const optionsSnippet = `const gate = createPocxGate({
  cookieName: "pocx_session",        // default
  publicPaths: ["/api/health"],      // prefixes left unprotected
  logEvents: true,                   // stream page_view events (Pro)
});`;
  const agentPrompt = `Add POCX protection to this app. Follow the instructions at ${origin}/llms.txt exactly.`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <p className="eyebrow">ドキュメント</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900">
        PoCを5分で保護する
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        POCXはホスト型のアクセスゲートです。アプリ側に置くのは署名付きセッショントークンを検証する単一ファイルのSDKだけで、本人確認・規約・セッションはPOCXのサーバー上で動作します。
      </p>
      <p className="mt-4 text-sm text-ink-500">
        はじめての方は{" "}
        <Link
          href={localePath(locale, "/tutorials")}
          className="font-semibold text-brand hover:underline"
        >
          ステップバイステップのチュートリアルから →
        </Link>{" "}
        または{" "}
        <Link
          href={localePath(locale, "/faq")}
          className="font-semibold text-brand hover:underline"
        >
          よくある質問
        </Link>
        もご覧ください。
      </p>

      <nav className="mt-8 rounded-xl border border-ink-200 bg-ink-50 p-5">
        <p className="eyebrow">このページの内容</p>
        <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {TOC.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-brand hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-16">
        {/* ---------------------------------------------------------- */}
        <H2 id="quickstart">クイックスタート（5分）</H2>
        <Steps>
          <Step title="PoCを作成する">
            <Link
              href={localePath(locale, "/signup")}
              className="font-semibold text-brand hover:underline"
            >
              サインアップ
            </Link>
            （メールOTP、パスワード不要）して、ダッシュボードでPoCを作成し、評価者のメールアドレスを招待します。ログインコードが届くのは、許可リストに登録されたメールアドレスだけです。
          </Step>
          <Step title="3つの環境変数をコピーする">
            <p>
              PoCのOverviewページから認証情報をコピーし、アプリのサーバー環境（Next.jsなら{" "}
              <Code>.env.local</Code>）に設定します。
            </p>
            <CodeBlock title=".env.local" code={envSnippet} copyText={envSnippet} />
            <p className="mt-3">
              <Code>POCX_SECRET</Code>{" "}
              はサーバー間呼び出しの認証に使う値です。ブラウザにもgitにも決して含めないでください。
            </p>
          </Step>
          <Step title="SDKをダウンロードする">
            <p>
              依存関係ゼロのTypeScriptファイル1つで、Nodeとエッジランタイムの両方で動作します。
            </p>
            <CodeBlock title="terminal" code={curlCmd} copyText={curlCmd} />
          </Step>
          <Step title="ゲートを組み込む">
            <p>
              Next.js 16（App Router）の場合はプロジェクトルートに{" "}
              <Code>proxy.ts</Code> を作成します。Next.js 15以前ではファイル名を{" "}
              <Code>middleware.ts</Code> とし、<Code>proxy</Code> の代わりに{" "}
              <Code>middleware</Code> をエクスポートしてください。
            </p>
            <CodeBlock
              title="proxy.ts"
              code={proxySnippet}
              copyText={proxySnippet}
            />
          </Step>
          <Step title="デプロイする">
            これでアプリにアクセスすると、あなたのブランドを反映したゲート{" "}
            <Code>{origin}/gate/&lt;slug&gt;</Code>{" "}
            へ307リダイレクトされます。OTPログインと規約への同意を終えると、評価者は署名付きセッションを持ってアプリに戻ります。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <H2 id="flow">フローの仕組み</H2>
        <P>内部では、初回アクセス時に次のシーケンスが実行されます。</P>
        <Steps>
          <Step title="リダイレクト">
            未認証のリクエストがSDKに到達すると、このPoC用のホスト型ゲートへ307リダイレクトされます。
          </Step>
          <Step title="ゲートでのOTP">
            評価者がメールアドレスを入力します。許可リストに登録されていれば、POCXが6桁のコードをメールで送信します（保存時はハッシュ化、単回使用、レート制限付き、5回失敗でロックアウト）。
          </Step>
          <Step title="規約への電子署名">
            現行のTerms of Access（アクセス規約）が表示され、評価者が電子署名します。POCXはタイムスタンプ、IPアドレス、ユーザーエージェント、表示された規約本文そのもののSHA-256ハッシュを記録し、署名済みPDF証明書をメールで送付します。
          </Step>
          <Step title="単回使用グラント">
            POCXは、2分で失効する単回使用のグラントを付けて、アプリのコールバックへリダイレクトします。
          </Step>
          <Step title="サーバーサイドでの交換">
            SDKがそのグラントをサーバー間通信（<Code>POCX_SECRET</Code>{" "}
            で認証）でHS256署名のセッショントークンと交換します。
          </Step>
          <Step title="自分のドメインへのCookie">
            セッショントークンは、アプリ自身のドメイン上のCookieとして設定されます。これ以降、POCXはリクエスト経路から外れます。
          </Step>
          <Step title="ローカルでの検証">
            すべてのリクエストはトークン署名に対してローカルで検証され、さらに60秒ごとにPOCXに対して再検証されます。これにより、セッションの失効、PoCの一時停止、規約バージョンの更新が反映されます。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <H2 id="express">Express / 任意のNodeアプリ</H2>
        <P>
          同じSDKファイルにExpressスタイルのミドルウェアが同梱されています。ルートより前にマウントしてください。
        </P>
        <CodeBlock
          title="server.ts"
          code={expressSnippet}
          copyText={expressSnippet}
        />
        <P>
          Nodeのミドルウェアチェーンを実行できる環境なら、何でも同じように動作します。ゲートより後ろのすべてのルートが保護されます。
        </P>

        {/* ---------------------------------------------------------- */}
        <H2 id="configuration">設定リファレンス</H2>
        <P>環境変数（すべて必須）:</P>
        <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  変数
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  説明
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "POCX_URL",
                  `POCXデプロイメントのオリジン。例: ${origin}`,
                ],
                [
                  "POCX_PROJECT_KEY",
                  "このPoCの公開プロジェクトキー（pocx_pk_…）。ゲートに対してPoCを識別します。",
                ],
                [
                  "POCX_SECRET",
                  "サーバーシークレット（pocx_sk_…）。交換呼び出しとセッション検証の署名に使用します。サーバーサイド専用です。",
                ],
              ].map(([name, desc]) => (
                <tr key={name} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-3 align-top font-mono text-xs whitespace-nowrap text-ink-900">
                    {name}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P>
          <Code>createPocxGate(options)</Code> のオプション:
        </P>
        <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  オプション
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  デフォルト
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  説明
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "cookieName",
                  '"pocx_session"',
                  "アプリのドメインに設定されるセッションCookieの名前。",
                ],
                [
                  "publicPaths",
                  "[]",
                  "保護対象から除外するパスのプレフィックス（例: [\"/api/health\"]）。それ以外はすべてゲートで保護されます。",
                ],
                [
                  "logEvents",
                  "false",
                  "page_view イベントをProの監査ログにストリーミングします。環境変数 POCX_LOG_EVENTS=true でも設定できます。",
                ],
              ].map(([name, def, desc]) => (
                <tr key={name} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-3 align-top font-mono text-xs whitespace-nowrap text-ink-900">
                    {name}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs whitespace-nowrap text-ink-500">
                    {def}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock title="example" code={optionsSnippet} copyText={optionsSnippet} />

        {/* ---------------------------------------------------------- */}
        <H2 id="terms">規約のカスタマイズ</H2>
        <P>
          すべてのPoCには、標準の保護的なTerms of
          Accessテンプレートが付属します。POCXを使う価値の核心となる、次の条項も含まれています。
        </P>
        <blockquote className="mt-5 border-l-2 border-brand bg-ink-50 p-5 text-[15px] leading-relaxed text-ink-700 italic">
          「エンゲージメントなき再利用の禁止。あなたまたはあなたの組織が（直接か第三者を通じてかを問わず）、本PoCまたはそこに具現化されたコンセプトに由来する、実質的に基づく、あるいはそれらを組み込んだ製品・サービス・ソリューションを開発、委託または実装する場合、当該業務について{" "}
          {"{{OWNER_ENTITY}}"}{" "}
          と誠実に合意される条件のもとで契約を締結することに同意するものとします。」
        </blockquote>
        <P>
          テンプレートはPoCごとのプレースホルダーを解決します。完全に独自のテキストを指定することもでき、その場合も同じプレースホルダーを使用できます。
        </P>
        <div className="mt-4 flex flex-wrap gap-2">
          {TERMS_VARIABLES.map((v) => (
            <span
              key={v}
              className="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-xs text-ink-700"
            >
              {"{{"}
              {v}
              {"}}"}
            </span>
          ))}
        </div>
        <Bullets
          items={[
            <>
              <strong className="text-ink-900">テンプレートモード</strong>{" "}
              — 標準の保護的な規約に、あなたの事業体、PoC名、目的が差し込まれます。
            </>,
            <>
              <strong className="text-ink-900">カスタムモード</strong>{" "}
              — 独自のテキストをそのまま使用します。プレースホルダーを使えば、同様に解決されます。
            </>,
            <>
              <strong className="text-ink-900">バージョン更新</strong>{" "}
              — 規約のバージョンを上げると、すべての評価者は次のリクエストが通る前に再同意を求められます。
            </>,
          ]}
        />
        <P>
          画面に表示される規約、署名済みPDF、保存されるSHA-256ハッシュは、すべて同一の解決済み文字列から生成されるため、3つが一致することが保証されます。
        </P>

        {/* ---------------------------------------------------------- */}
        <H2 id="security">セキュリティモデル</H2>
        <Bullets
          items={[
            "OTPコードは保存時にハッシュ化され、単回使用・レート制限付きで、5回失敗するとそのメールアドレスはロックアウトされます。",
            "評価者のパスワードはどこにも存在しません。漏洩し得るものが何もありません。",
            "セッションはサーバーサイドで失効可能です。SDKは60秒ごとにPOCXに対して再検証するため、失効、PoCの一時停止、規約バージョンの更新は1分以内に反映されます。",
            <>
              <Code>POCX_SECRET</Code>{" "}
              がブラウザに到達することはありません。グラントとトークンの交換はサーバー間で行われます。
            </>,
            "コールバックのグラントは単回使用で、2分後に失効します。",
            "ゲートがオープンリダイレクトすることはありません。登録済みの保護対象アプリURLにのみ評価者を戻します。",
          ]}
        />

        {/* ---------------------------------------------------------- */}
        <H2 id="agents">コーディングエージェント向け</H2>
        <P>
          最速の統合方法は、自分で作業しないことです。POCXはエージェントが実行可能な手順を{" "}
          <a
            href="/llms.txt"
            className="font-mono font-semibold text-brand hover:underline"
          >
            /llms.txt
          </a>{" "}
          で公開しています。次のプロンプトをClaude Code、Codex、Cursorに貼り付けてください（コーディングエージェントが読むため、プロンプトは英語のままです）。
        </P>
        <div className="mt-5 flex items-center gap-3 rounded-lg bg-ink-950 p-4">
          <p className="flex-1 font-mono text-sm leading-relaxed text-ink-100">
            {agentPrompt}
          </p>
          <CopyButton text={agentPrompt} />
        </div>
        <P>
          エージェントが手順を読み、単一ファイルのSDKをダウンロードし、ミドルウェアを組み込み、リダイレクトの動作確認まで、エンドツーエンドで行います。
        </P>
      </div>
    </div>
  );
}
