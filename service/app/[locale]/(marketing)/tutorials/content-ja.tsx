import Link from "next/link";
import { pocxOrigin } from "@/lib/utils";
import { TERMS_VARIABLES } from "@/lib/terms";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { CopyButton } from "../copy-button";
import {
  GuideHeading,
  P,
  Code,
  UiPath,
  CodeBlock,
  Steps,
  Step,
} from "./primitives";

const locale: Locale = "ja";

const TOC = [
  { id: "protect-nextjs", label: "Next.jsアプリをエンドツーエンドで保護する" },
  { id: "protect-express", label: "Expressアプリを保護する" },
  { id: "coding-agent", label: "コーディングエージェントに任せる" },
  { id: "customize-terms", label: "Terms of Accessをカスタマイズする" },
  { id: "manage-access", label: "招待・無効化・失効" },
  { id: "evidence", label: "証拠トレイル（Pro）" },
] as const;

export function TutorialsContentJa() {
  const origin = pocxOrigin();

  const envSnippet = `POCX_URL=${origin}
POCX_PROJECT_KEY=pocx_pk_…
POCX_SECRET=pocx_sk_…   # server-side only — never expose to the browser`;
  const curlCmd = `curl -o lib/pocx.ts ${origin}/sdk/pocx.ts`;
  const proxySnippet = `import { createPocxGate } from "./lib/pocx";

const gate = createPocxGate();

export const proxy = gate.nextProxy();
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};`;
  const expressSnippet = `import express from "express";
import { createPocxGate } from "./lib/pocx";

const app = express();
const gate = createPocxGate();

app.use(gate.expressMiddleware());

// …your routes below are now protected`;
  const agentPrompt = `Add POCX protection to this app. Follow the instructions at ${origin}/llms.txt exactly.`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <p className="eyebrow">チュートリアル</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900">
        チュートリアル
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        素のアプリから、署名済み規約・失効可能なセッション・証拠トレイルを備えた保護済みPoCまで導く、6つのステップバイステップガイドです。
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
        <GuideHeading id="protect-nextjs" time="約10分">
          1. Next.jsアプリをエンドツーエンドで保護する
        </GuideHeading>
        <P>
          全行程を体験します。PoCを作成し、Next.jsアプリにSDKを組み込み、その後自分自身が評価者としてゲートを通過して、クライアントが目にする流れを正確に把握します。
        </P>
        <Steps>
          <Step title="サインアップする">
            <Link
              href={localePath(locale, "/signup")}
              className="font-semibold text-brand hover:underline"
            >
              /signup
            </Link>{" "}
            を開いてメールアドレスを入力します。POCXが6桁のコードを送信します。パスワードを考える必要も、漏洩の心配もありません。コードを入力すればダッシュボードに入れます。
          </Step>
          <Step title="PoCを作成する">
            ダッシュボードで <UiPath>New PoC</UiPath>{" "}
            をクリックし、各フィールドを入力します。それぞれが実際の役割を持ちます。
            <ul className="mt-3 space-y-2">
              <li>
                <strong className="text-ink-900">Name（名前）</strong> —
                ホスト型ゲートに表示され、規約内の{" "}
                <Code>{"{{POC_NAME}}"}</Code> に差し込まれます。
              </li>
              <li>
                <strong className="text-ink-900">
                  Owner entity + registration number（所有者事業体と登記番号）
                </strong>{" "}
                — あなたの会社です。Terms of
                Access全体を通じて知的財産の所有者として明記されます。
              </li>
              <li>
                <strong className="text-ink-900">
                  Client entity（クライアント事業体）
                </strong>{" "}
                —
                PoCを評価する組織です。署名する個人とともに規約に拘束されます。
              </li>
              <li>
                <strong className="text-ink-900">Purpose（目的）</strong> —
                評価者がPoCを利用できる範囲を限定します（「…の目的に限り」）。
              </li>
              <li>
                <strong className="text-ink-900">
                  Brand color（ブランドカラー）
                </strong>{" "}
                —
                ホスト型ゲートのアクセントカラーです。ログインページが当社ではなく、あなたのブランドに見えるようにします。
              </li>
            </ul>
          </Step>
          <Step title="3つの環境変数をコピーする">
            <UiPath>ダッシュボード → 対象のPoC → Overview</UiPath>{" "}
            を開き、認証情報をアプリの <Code>.env.local</Code>{" "}
            にコピーします。
            <CodeBlock
              title=".env.local"
              code={envSnippet}
              copyText={envSnippet}
            />
          </Step>
          <Step title="SDKをダウンロードする">
            依存関係のないTypeScriptファイル1つを、プロジェクトに直接取り込みます。
            <CodeBlock title="terminal" code={curlCmd} copyText={curlCmd} />
          </Step>
          <Step title="ゲートを組み込む">
            プロジェクトルートに <Code>proxy.ts</Code> を作成します（Next.js
            16の場合）。Next.js 15以前ではファイル名を{" "}
            <Code>middleware.ts</Code> とし、<Code>proxy</Code> の代わりに{" "}
            <Code>middleware</Code> をエクスポートします。
            <CodeBlock
              title="proxy.ts"
              code={proxySnippet}
              copyText={proxySnippet}
            />
          </Step>
          <Step title="保護対象アプリのURLを設定する">
            <UiPath>ダッシュボード → 対象のPoC → Settings</UiPath> で{" "}
            <strong className="text-ink-900">Protected app URL</strong>{" "}
            にアプリの稼働先（デプロイ先のURLなど）を設定します。ゲートが評価者を戻す先は、この登録済みURLだけです。これがフローの復路を安全なものにしています。
          </Step>
          <Step title="自分を評価者として招待する">
            <UiPath>ダッシュボード → 対象のPoC → Evaluators</UiPath>{" "}
            を開き、自分のメールアドレスを追加します。ログインコードが届くのは許可リスト上のメールアドレスだけで、それ以外の人には丁重なお断りが表示されます。FreeプランはPoCごとに評価者3席まで、Proでは上限がなくなります。
          </Step>
          <Step title="フロー全体をテストする">
            プライベート（シークレット）ウィンドウでアプリを開きます。
            <Code>{origin}/gate/&lt;slug&gt;</Code>{" "}
            のゲートへ307リダイレクトされるはずです。メールアドレスを入力し、受信した6桁のコードを入力し、Terms
            of
            Accessを読んで電子署名すると、有効なセッションとともにアプリへ戻ります。その後{" "}
            <UiPath>ダッシュボード → 対象のPoC → Sessions</UiPath> と{" "}
            <UiPath>Signatures</UiPath>{" "}
            を確認してください。後日、評価者について確認するのとまったく同じ形で、自分自身のセッションと署名済み規約の記録が表示されます。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="protect-express" time="約5分">
          2. Expressアプリを保護する
        </GuideHeading>
        <P>
          同じPoC、同じ3つの環境変数、同じ1つのSDKファイル。Expressではプロキシの代わりに、ミドルウェアとしてマウントするだけです。
        </P>
        <Steps>
          <Step title="上記のステップ1〜4を再利用する">
            PoCを作成し、<Code>POCX_URL</Code>、
            <Code>POCX_PROJECT_KEY</Code>、<Code>POCX_SECRET</Code>{" "}
            をサーバーの環境に設定し、SDKをcurlで <Code>lib/pocx.ts</Code>{" "}
            に取得します。
          </Step>
          <Step title="ルートより前にミドルウェアをマウントする">
            ゲートより後に登録されたものは、すべて保護されます。
            <CodeBlock
              title="server.ts"
              code={expressSnippet}
              copyText={expressSnippet}
            />
          </Step>
          <Step title="JavaScriptのみのプロジェクトの場合">
            SDKはTypeScriptとして提供されます。ExpressアプリがまだTSでない場合は、
            <Code>tsx</Code> のようなTS対応ランナーで実行する（または{" "}
            <Code>esbuild</Code> でバンドルする）だけです。
            <Code>npx tsx server.ts</Code> 以外の設定は必要ありません。
          </Step>
          <Step title="保護対象アプリのURLを設定してテストする">
            Next.jsの場合と同様に、<UiPath>Settings</UiPath> で{" "}
            <strong className="text-ink-900">Protected app URL</strong>{" "}
            を設定し、<UiPath>Evaluators</UiPath>{" "}
            で自分を招待して、プライベートウィンドウでゲートを通過してみてください。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="coding-agent" time="約2分">
          3. コーディングエージェントに任せる
        </GuideHeading>
        <P>
          最速の統合方法は、自分で作業しないことです。POCXはエージェントが実行可能な手順を{" "}
          <a
            href="/llms.txt"
            className="font-mono font-semibold text-brand hover:underline"
          >
            /llms.txt
          </a>{" "}
          で公開しています。
        </P>
        <Steps>
          <Step title="プロンプトを1つ貼り付ける">
            アプリのリポジトリ内でClaude
            Code、Codex、Cursorを開き、次を貼り付けます（コーディングエージェントが読むため、プロンプトは英語のままです）。
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-ink-950 p-4">
              <p className="flex-1 font-mono text-sm leading-relaxed text-ink-100">
                {agentPrompt}
              </p>
              <CopyButton text={agentPrompt} />
            </div>
          </Step>
          <Step title="エージェントが行うこと">
            手順を読み、3つの環境変数を追加し（値はPoCの{" "}
            <UiPath>Overview</UiPath>{" "}
            タブから確認するよう求められます）、
            <Code>lib/pocx.ts</Code>{" "}
            をダウンロードして、スタックに応じた適切なエントリポイントを組み込みます。Next.js
            16なら <Code>proxy.ts</Code>、それ以前のNext.jsなら{" "}
            <Code>middleware.ts</Code>、Expressなら{" "}
            <Code>expressMiddleware()</Code> です。
          </Step>
          <Step title="作業を検証する">
            プライベートウィンドウでアプリを開き、
            <Code>{origin}/gate/&lt;slug&gt;</Code>{" "}
            にリダイレクトされることを確認します。招待済みのメールアドレスでOTPと規約のフローを完了し、
            <UiPath>Sessions</UiPath>{" "}
            で自分のセッションが有効になっていることを確認してください。リダイレクトが発生しない場合は、環境変数が読み込まれているか、ミドルウェアファイルがプロジェクトルートにあるかを確認します。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="customize-terms" time="約5分">
          4. Terms of Accessをカスタマイズする
        </GuideHeading>
        <P>
          すべてのPoCは、「エンゲージメントなき再利用の禁止」条項を含む標準の保護テンプレートから始まります。そのまま使うことも、調整することも、丸ごと差し替えることもできます。
        </P>
        <Steps>
          <Step title="Termsタブを開く">
            <UiPath>ダッシュボード → 対象のPoC → Terms</UiPath>
            。モードは2つあります。
            <strong className="text-ink-900">Template</strong>
            （PoCの詳細が差し込まれた標準規約）と{" "}
            <strong className="text-ink-900">Custom</strong>
            （独自の法的文書をそのまま使用）です。
          </Step>
          <Step title="プレースホルダーはどこでも使える">
            どちらのモードでも、PoCのフィールドから自動入力される同じプレースホルダーが解決されます。
            <div className="mt-3 flex flex-wrap gap-2">
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
          </Step>
          <Step title="ライブプレビューを確認する">
            Termsタブには、評価者に表示されるものと同じ、完全に解決済みのテキストが表示されます。プレビューの内容は、署名・ハッシュ化・PDF化される内容とバイト単位で一致します。
          </Step>
          <Step title="バージョン更新の仕組みを理解する">
            <strong className="text-ink-900">同じバージョン</strong>
            のままテキストを編集した場合、適用されるのは今後の署名者だけです。
            <strong className="text-ink-900">バージョン</strong>
            を上げると、すべての評価者は次のリクエストが通る前に再同意を求められます。変更が重要で、次回の再検証を待たずに直ちに再同意させたい場合は、オプションの{" "}
            <strong className="text-ink-900">
              「revoke all live sessions now」
            </strong>
            （すべての有効セッションを直ちに失効）チェックボックスをオンにしてください。
          </Step>
          <Step title="署名済みコピーの保存場所を知る">
            すべての同意は{" "}
            <UiPath>ダッシュボード → 対象のPoC → Signatures</UiPath>{" "}
            に記録され（タイムスタンプ、IPアドレス、ユーザーエージェント、規約本文そのもののSHA-256ハッシュ付き）、署名済みPDF証明書が署名者にメールで送付されます。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="manage-access" time="約5分">
          5. 招待・無効化・失効
        </GuideHeading>
        <P>
          日々のアクセス管理です。誰がログインできるのか、今誰がログインしているのか、そしてどちらかを変えたいときに使う操作を説明します。
        </P>
        <Steps>
          <Step title="評価者を追加する">
            <UiPath>ダッシュボード → 対象のPoC → Evaluators</UiPath> →
            メールアドレスを追加します。ログインコードが届くのは、ここに登録されたアドレスだけです。FreeはPoCごとに3席まで、Pro（月額US$39）は無制限です。
          </Step>
          <Step title="席を無効化する">
            評価者を無効化すると、
            <strong className="text-ink-900">次回のログイン</strong>
            がブロックされ、コードを要求できなくなります。現在のセッションがある場合は、期限切れになるか失効させるまで有効なままです。
          </Step>
          <Step title="セッションを失効させる">
            <UiPath>ダッシュボード → 対象のPoC → Sessions</UiPath>{" "}
            にすべての有効なセッションが一覧表示され、セッションごとの{" "}
            <strong className="text-ink-900">Revoke</strong> と{" "}
            <strong className="text-ink-900">Revoke all</strong>{" "}
            が用意されています。SDKは毎分POCXに再検証するため、失効は約60秒以内に保護対象アプリへ反映されます。
          </Step>
          <Step title="PoC全体を一時停止する">
            <UiPath>Settings → Pause</UiPath> は、新規ログイン
            <em>と</em>
            有効セッションの検証をスイッチ1つでブロックします。再開するまでデモは停止状態になります。セッションTTL、アイドルタイムアウト、OTPの有効期限も同じタブで設定できます。
          </Step>
          <Step title="シークレットをローテーションする">
            環境ファイルにアクセスできた協力者が離任したときは、
            <UiPath>Settings → Rotate secret</UiPath> で新しい{" "}
            <Code>POCX_SECRET</Code>{" "}
            を発行します。古いシークレットで署名された交換は直ちに無効になります。アプリの環境変数を更新して再デプロイしてください。
          </Step>
          <Step title="終わったらアーカイブする">
            評価が終了したら、<UiPath>Settings → Archive</UiPath>{" "}
            でPoCを退役させます。署名を含む記録は、そのまま保存され続けます。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="evidence" time="約5分">
          6. 証拠トレイル（Pro）
        </GuideHeading>
        <P>
          もしクライアントが、どこか見覚えのあるものをリリースしたら——必要になるのは記録です。POCXはすべてのプランで初日から記録を残し、Proプランでその閲覧が解放されます。
        </P>
        <Steps>
          <Step title="監査ログが記録するもの">
            すべてのOTP要求と拒否、すべてのログイン、すべての規約署名、すべての失効。それぞれに実行者、タイムスタンプ、コンテキストが付きます。
            <Code>createPocxGate()</Code> に <Code>logEvents: true</Code>{" "}
            を追加すると、アプリ内の <Code>page_view</Code>{" "}
            イベントもストリーミングされ、各評価者が実際にどの画面を開いたかがわかります。
          </Step>
          <Step title="フィルタとエクスポート">
            <UiPath>ダッシュボード → 対象のPoC → Audit</UiPath>{" "}
            では評価者やイベント種別でフィルタでき、記録一式をCSVでエクスポートできます。自分の記録用にも、弁護士に渡す用にも。
          </Step>
          <Step title="証拠の組み合わさり方">
            署名記録は、<em>誰が</em>
            （OTPで検証されたメールアドレス）<em>何に</em>
            （SHA-256ハッシュが規約本文そのものを固定し、署名済みPDFが同じ文字列の人間可読な証拠になります）同意したかを証明します。監査ログは、同意後に
            <em>何をしたか</em>
            を証明します。何が合意され、何がアクセスされたかを示す必要が生じたとき、この3つは自然に整合します。
          </Step>
          <Step title="記録はアップグレード前から始まっている">
            イベントはすべてのプランで初日から記録されます。後からProにアップグレードすると、アップグレード後のイベントだけでなく、全履歴が閲覧できるようになります。
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <div className="mt-20 rounded-xl border border-ink-200 bg-white p-8">
          <h2 className="text-xl font-semibold tracking-tight text-ink-900">
            まだ解決しませんか？
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            <Link
              href={localePath(locale, "/faq")}
              className="font-semibold text-brand hover:underline"
            >
              よくある質問
            </Link>
            では「もし〜だったら」というよくある疑問に答えており、
            <Link
              href={localePath(locale, "/docs")}
              className="font-semibold text-brand hover:underline"
            >
              ドキュメント
            </Link>
            では設定リファレンスとセキュリティモデルの全体を扱っています。
          </p>
        </div>
      </div>
    </div>
  );
}
