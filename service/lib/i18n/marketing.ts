import type { Locale } from "./locales";
import {
  PRO_PRICE_USD,
  PRO_PRICE_YEARLY_USD,
  YEARLY_SAVINGS_PCT,
} from "../plans";

/**
 * Marketing-core strings (nav/footer layout, landing page, pricing page).
 * `en` is the source of truth for the shape; `ja: MarketingStrings` makes
 * TypeScript enforce key parity between the two locales.
 *
 * Kept in English everywhere: product terms (POCX, PoC, OTP, SDK, API),
 * code snippets, the copyable agent prompt, /llms.txt and /sdk/* labels,
 * and the gate-mock's fictional content (ACME, Project Falcon, emails).
 */

const en = {
  meta: {
    landingTitle: "POCX — Protect your proof of concept",
    landingDescription:
      "POCX puts an access gate in front of your proof of concept: email OTP login, enforceable Terms of Access with electronic signatures, session control and a full audit trail. Add it to any app in minutes.",
    pricingTitle: "Pricing",
    pricingDescription:
      "POCX pricing — protect proofs of concept free with up to 3 evaluator seats per PoC, or go Pro for unlimited seats and a full audit trail.",
  },

  nav: {
    how: "How it works",
    features: "Features",
    pricing: "Pricing",
    docs: "Docs",
    tutorials: "Tutorials",
    faq: "FAQ",
    login: "Log in",
    startFree: "Start free",
  },

  footer: {
    tagline:
      "The access layer for your proof of concept — identity-verified entry, e-signed terms, every access on the record.",
    product: "Product",
    forAgents: "For agents",
    account: "Account",
    pricing: "Pricing",
    docs: "Docs",
    tutorials: "Tutorials",
    faq: "FAQ",
    login: "Log in",
    signup: "Sign up",
    copyright: "© 2026 POCX. Built to protect the people who build.",
  },

  hero: {
    eyebrow: "Access gate · e-signed terms · audit trail",
    titleMain: "Your PoC is your IP. ",
    titleAccent: "Gate it.",
    subtitle:
      "POCX puts an identity-verified gate, enforceable Terms of Access and a complete audit trail in front of any proof of concept — in one file and three env vars.",
    startFree: "Start free",
    readDocs: "Read the docs",
    finePrint: "Free for up to 3 evaluators per PoC · no card required",
  },

  heroVisual: {
    termsTitle: "Terms of Access",
    agreeContinue: "Agree & continue",
    emailCode: "Email me a code",
    protectedLine: "Protected by POCX — access is logged and terms-gated",
  },

  trustChips: [
    "6-digit OTP — hashed & single-use",
    "SHA-256 signed terms",
    "Every access on the record",
  ],

  how: {
    eyebrow: "How it works",
    title: "Protected in three steps. Minutes, not sprints.",
    step1: {
      eyebrow: "01 — Create",
      title: "Create your PoC",
      body: "Name the PoC, name the entity that built it, invite your evaluators by email. Terms, branding and session rules — all customizable from the dashboard.",
    },
    step2: {
      eyebrow: "02 — Drop in",
      title: "Drop in the gate",
      body: "One file, three env vars. The SDK is a single TypeScript file with zero dependencies:",
    },
    step3: {
      eyebrow: "03 — Send the link",
      title: "Send the link",
      body: "Evaluators OTP in with their allowlisted email, e-sign the Terms of Access, and land in your app. You watch sessions and signatures live — and can revoke anyone, instantly.",
    },
  },

  features: {
    eyebrow: "Features",
    title: "The whole front door, handled.",
    subtitle:
      "Identity, terms, sessions, evidence. POCX handles who gets in and on what conditions — your PoC stays exactly as you built it.",
    items: [
      {
        title: "Allowlist + OTP login",
        body: "Only invited emails get in. Codes are hashed, single-use, rate-limited, and lock out after five attempts. No passwords — ever.",
      },
      {
        title: "Terms of Access, e-signed",
        body: "A SHA-256 hash of the exact text, timestamp, IP and user agent on every signature — plus a signed PDF certificate emailed to the signer.",
      },
      {
        title: "Session control",
        body: "TTL and idle timeouts, one-click revoke for any evaluator, and a panic button that revokes every session at once.",
      },
      {
        title: "Audit trail (Pro)",
        body: "Every OTP request, denial, login, signature and revocation — plus in-app access events from the SDK. Export it all as CSV.",
      },
      {
        title: "Branded hosted gate",
        body: "Your entity name, your PoC name, your brand color. The gate looks like yours because it is — we just run it for you.",
      },
      {
        title: "Built for coding agents",
        body: "POCX ships llms.txt and a single-file SDK, so Claude Code, Codex or Cursor can integrate the whole thing end-to-end.",
      },
    ],
  },

  agent: {
    eyebrow: "Zero-effort integration",
    title: "Tell your coding agent to do it.",
    caption:
      "POCX ships llms.txt + a single-file SDK, so Claude Code, Codex or Cursor can integrate it end-to-end. Paste, done.",
  },

  why: {
    eyebrow: "Why POCX exists",
    title: "A login wall is not protection. A signature is.",
    p1: "Your PoC embodies your IP — the designs, the workflows, the ideas your client is evaluating. A password keeps strangers out. It does nothing when the people you invited take what they saw and build it without you.",
    p2Before: "POCX’s standard Terms of Access include the clause that matters: ",
    p2Em: "if you build on this PoC, you engage us",
    p2After:
      ". Every evaluator e-signs it before they see a single screen — and every signature is recorded with the SHA-256 hash of the exact text they agreed to, their verified email, IP, and timestamp, sealed in a PDF certificate.",
    p3: "That turns reuse-without-engagement from a grey area into a signed, enforceable commitment — with the evidence trail to back it up.",
    cert: {
      title: "Signature certificate",
      recorded: "RECORDED",
      sigId: "Signature id",
      signedBy: "Signed by",
      termsVersion: "Terms version",
      timestamp: "Timestamp",
      ip: "IP address",
      footnote: "PDF certificate emailed to the signer automatically.",
    },
  },

  teaser: {
    eyebrow: "Pricing",
    title: "Start free. Stay protected.",
    seePricing: "See pricing",
    free: {
      name: "Free",
      priceSuffix: " forever",
      bullets: [
        "Up to 3 evaluator seats per PoC",
        "OTP gate + e-signed terms with PDF",
        "Session control & instant revoke",
      ],
      cta: "Start free",
    },
    pro: {
      badge: "MOST PROTECTIVE",
      name: "Pro",
      priceSuffix: " /workspace/month",
      yearlyLine: `US$${PRO_PRICE_USD}/mo · or US$${PRO_PRICE_YEARLY_USD}/yr (save ${YEARLY_SAVINGS_PCT}%)`,
      bullets: [
        "Unlimited evaluator seats",
        "Full audit trail with CSV export",
        "Priority support",
      ],
      cta: "Start free",
    },
  },

  finalCta: {
    titleMain: "Ship the demo. ",
    titleAccent: "Keep the IP.",
    agentBefore: "or read ",
    agentAfter: " — your agent can have this done before the kettle boils.",
    cta: "Start free",
  },

  pricing: {
    eyebrow: "Pricing",
    title: "Simple pricing for protected PoCs",
    subtitle:
      "Start free, no card required. Upgrade when your evaluation grows beyond three people.",
    free: {
      name: "Free",
      priceSuffix: " forever",
      tagline: "Everything you need to gate a PoC properly.",
      features: [
        "Up to 3 evaluator seats per PoC",
        "Email OTP gate, allowlist-only",
        "E-signed Terms of Access + PDF certificate",
        "Session control & instant revoke",
        "Hosted gate branded per PoC",
      ],
      cta: "Start free",
    },
    pro: {
      badge: "MOST PROTECTIVE",
      name: "Pro",
      priceSuffix: " /workspace/month",
      yearlyLine: `or US$${PRO_PRICE_YEARLY_USD}/year (save ${YEARLY_SAVINGS_PCT}% — 2+ months free)`,
      tagline: "For teams running real evaluations at scale.",
      features: [
        "Everything in Free",
        "Unlimited evaluator seats",
        "Full audit trail",
        "CSV export",
        "Priority support",
      ],
      cta: "Start free, upgrade anytime",
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "What counts as an evaluator seat?",
        a: "An allowlisted email address on a PoC. Each PoC has its own allowlist, so the Free limit is per PoC — not per workspace. Disabled seats don’t count against the limit.",
      },
      {
        q: "Do you see my PoC’s code or data?",
        a: "No. POCX only handles the front door: identity, terms and sessions. Once an evaluator is through the gate, traffic goes straight to your app — nothing passes through us.",
      },
      {
        q: "What happens when I hit 3 seats on Free?",
        a: "Adding a fourth evaluator prompts an upgrade to Pro. Existing evaluators keep their access — nothing breaks, nothing is revoked.",
      },
      {
        q: "Are the signatures legally meaningful?",
        a: "Each signature records the signer’s email identity (verified by OTP), a timestamp, IP address and user agent, plus a SHA-256 hash of the exact terms text shown — and a signed PDF certificate is emailed to the signer. That’s standard electronic-signature evidence. (This is product information, not legal advice.)",
      },
      {
        q: "Can I bring fully custom terms?",
        a: "Yes. Use the standard protective template with {{variables}} for your entity, PoC and purpose — or replace it entirely with your own text. Bumping the version forces every evaluator to re-accept.",
      },
      {
        q: "How do I cancel?",
        a: "Cancel anytime from the dashboard — access continues until the end of the period you’ve paid for. After that, your gates keep working within Free limits — evaluators aren’t locked out.",
      },
    ],
    still: {
      prefix: "Still deciding? ",
      docsLabel: "Read the docs",
      middle: " or ",
      startLabel: "start free",
      suffix: " — protecting your first PoC takes about five minutes.",
    },
  },
};

export type MarketingStrings = typeof en;

const ja: MarketingStrings = {
  meta: {
    landingTitle: "POCX — PoCを守るアクセスゲート",
    landingDescription:
      "POCXは、あなたのPoCの前にアクセスゲートを設置します。メールOTPログイン、電子署名付きで法的効力のある利用規約、セッション制御、そして完全な監査ログ。どんなアプリにも数分で導入できます。",
    pricingTitle: "料金プラン",
    pricingDescription:
      "POCXの料金プラン — PoCごとに評価者3名まで無料で保護。評価者数無制限と完全な監査ログが必要になったらProへ。",
  },

  nav: {
    how: "仕組み",
    features: "機能",
    pricing: "料金",
    docs: "ドキュメント",
    tutorials: "チュートリアル",
    faq: "FAQ",
    login: "ログイン",
    startFree: "無料で始める",
  },

  footer: {
    tagline:
      "PoCのためのアクセスレイヤー — 本人確認済みの入場、電子署名付き利用規約、そしてすべてのアクセスを記録します。",
    product: "プロダクト",
    forAgents: "エージェント向け",
    account: "アカウント",
    pricing: "料金",
    docs: "ドキュメント",
    tutorials: "チュートリアル",
    faq: "FAQ",
    login: "ログイン",
    signup: "新規登録",
    copyright: "© 2026 POCX. つくる人を守るために。",
  },

  hero: {
    eyebrow: "アクセスゲート · 電子署名付き規約 · 監査ログ",
    titleMain: "PoCはあなたの知的財産。",
    titleAccent: "ゲートで守る。",
    subtitle:
      "POCXは、本人確認付きのゲート、法的効力のある利用規約(Terms of Access)、そして完全な監査ログを、あらゆるPoCの前に配置します。必要なのはファイル1つと環境変数3つだけ。",
    startFree: "無料で始める",
    readDocs: "ドキュメントを読む",
    finePrint: "PoCごとに評価者3名まで無料 · クレジットカード不要",
  },

  heroVisual: {
    termsTitle: "利用規約",
    agreeContinue: "同意して続行",
    emailCode: "コードをメールで受け取る",
    protectedLine:
      "POCXで保護されています — アクセスは記録され、利用規約への同意が必要です",
  },

  trustChips: [
    "6桁OTP — ハッシュ化・使い捨て",
    "SHA-256で署名された規約",
    "すべてのアクセスを記録",
  ],

  how: {
    eyebrow: "仕組み",
    title: "3ステップで保護完了。スプリントではなく、数分で。",
    step1: {
      eyebrow: "01 — 作成",
      title: "PoCを作成する",
      body: "PoCに名前を付け、開発元の事業者名を設定し、評価者をメールで招待します。規約、ブランディング、セッションルールはすべてダッシュボードからカスタマイズできます。",
    },
    step2: {
      eyebrow: "02 — 組み込み",
      title: "ゲートを組み込む",
      body: "ファイル1つ、環境変数3つ。SDKは依存関係ゼロの単一TypeScriptファイルです。",
    },
    step3: {
      eyebrow: "03 — リンク送信",
      title: "リンクを送る",
      body: "評価者は許可リストに登録されたメールでOTPログインし、利用規約に電子署名して、あなたのアプリに入ります。セッションと署名はリアルタイムで確認でき、誰のアクセスでも即座に取り消せます。",
    },
  },

  features: {
    eyebrow: "機能",
    title: "アプリの玄関口を、まるごと引き受けます。",
    subtitle:
      "本人確認、規約、セッション、証跡。誰が、どんな条件で入れるかはPOCXが管理します — あなたのPoCには一切手を加えません。",
    items: [
      {
        title: "許可リスト + OTPログイン",
        body: "招待されたメールアドレスだけが入場できます。コードはハッシュ化・使い捨て・レート制限付きで、5回失敗するとロックされます。パスワードは一切使いません。",
      },
      {
        title: "電子署名付き利用規約",
        body: "すべての署名に、規約本文のSHA-256ハッシュ、タイムスタンプ、IPアドレス、ユーザーエージェントを記録。さらに署名済みPDF証明書を署名者にメールで送付します。",
      },
      {
        title: "セッション制御",
        body: "TTLとアイドルタイムアウト、評価者ごとのワンクリック取り消し、そして全セッションを一括で無効化するパニックボタンを備えています。",
      },
      {
        title: "監査ログ(Pro)",
        body: "OTPリクエスト、拒否、ログイン、署名、取り消しのすべてに加え、SDK経由のアプリ内アクセスイベントも記録。まとめてCSVでエクスポートできます。",
      },
      {
        title: "ブランド対応のホスト型ゲート",
        body: "あなたの事業者名、PoC名、ブランドカラーを反映。ゲートはあなたのものに見えます — 実際にあなたのものだからです。運用だけを私たちが担います。",
      },
      {
        title: "コーディングエージェント対応",
        body: "POCXはllms.txtと単一ファイルSDKを提供。Claude Code、Codex、Cursorが導入をエンドツーエンドで完結できます。",
      },
    ],
  },

  agent: {
    eyebrow: "導入の手間はゼロ",
    title: "あとはコーディングエージェントに任せるだけ。",
    caption:
      "POCXはllms.txtと単一ファイルSDKを提供しているため、Claude Code、Codex、Cursorがエンドツーエンドで導入を完了できます。貼り付ければ、それで完了です。",
  },

  why: {
    eyebrow: "POCXが存在する理由",
    title: "ログイン画面は保護ではありません。署名こそが保護です。",
    p1: "PoCには、あなたの知的財産が詰まっています — デザイン、ワークフロー、そしてクライアントが評価しているアイデアそのもの。パスワードは部外者を締め出せても、招待した相手が見たものを持ち帰り、あなた抜きで作ってしまうことは防げません。",
    p2Before: "POCXの標準利用規約には、核心となる条項が含まれています — ",
    p2Em: "このPoCを基に開発する場合は、当方と契約すること",
    p2After:
      "。すべての評価者は、画面を1つ見る前にこの規約に電子署名します。そして各署名には、同意した規約本文のSHA-256ハッシュ、確認済みメールアドレス、IPアドレス、タイムスタンプが記録され、PDF証明書として保全されます。",
    p3: "これにより「契約なしの流用」は、グレーゾーンではなく、署名済みの法的コミットメントになります — それを裏付ける証跡とともに。",
    cert: {
      title: "署名証明書",
      recorded: "記録済み",
      sigId: "署名ID",
      signedBy: "署名者",
      termsVersion: "規約バージョン",
      timestamp: "タイムスタンプ",
      ip: "IPアドレス",
      footnote: "PDF証明書は署名者へ自動でメール送付されます。",
    },
  },

  teaser: {
    eyebrow: "料金",
    title: "無料で始めて、守り続ける。",
    seePricing: "料金を見る",
    free: {
      name: "Free",
      priceSuffix: " ずっと無料",
      bullets: [
        "PoCごとに評価者3名まで",
        "OTPゲート + PDF付き電子署名規約",
        "セッション制御と即時取り消し",
      ],
      cta: "無料で始める",
    },
    pro: {
      badge: "最も強力な保護",
      name: "Pro",
      priceSuffix: " /ワークスペース/月",
      yearlyLine: `US$${PRO_PRICE_USD}/月 · または US$${PRO_PRICE_YEARLY_USD}/年（${YEARLY_SAVINGS_PCT}%オフ）`,
      bullets: [
        "評価者数は無制限",
        "CSVエクスポート付きの完全な監査ログ",
        "優先サポート",
      ],
      cta: "無料で始める",
    },
  },

  finalCta: {
    titleMain: "デモは届ける。",
    titleAccent: "IPは守る。",
    agentBefore: "または ",
    agentAfter:
      " をエージェントに渡してください — お湯が沸く前に導入は完了します。",
    cta: "無料で始める",
  },

  pricing: {
    eyebrow: "料金",
    title: "PoCを守るための、シンプルな料金",
    subtitle:
      "クレジットカード不要で、無料で始められます。評価者が3名を超えたらアップグレードしてください。",
    free: {
      name: "Free",
      priceSuffix: " ずっと無料",
      tagline: "PoCをきちんと守るために必要なもの、すべて。",
      features: [
        "PoCごとに評価者3名まで",
        "メールOTPゲート(許可リスト制)",
        "電子署名付き利用規約 + PDF証明書",
        "セッション制御と即時取り消し",
        "PoCごとにブランド設定できるホスト型ゲート",
      ],
      cta: "無料で始める",
    },
    pro: {
      badge: "最も強力な保護",
      name: "Pro",
      priceSuffix: " /ワークスペース/月",
      yearlyLine: `または US$${PRO_PRICE_YEARLY_USD}/年（${YEARLY_SAVINGS_PCT}%オフ — 2か月分以上お得）`,
      tagline: "本格的な評価を大規模に進めるチームへ。",
      features: [
        "Freeの全機能",
        "評価者数は無制限",
        "完全な監査ログ",
        "CSVエクスポート",
        "優先サポート",
      ],
      cta: "無料で始めて、いつでもアップグレード",
    },
    faqTitle: "よくある質問",
    faq: [
      {
        q: "評価者シートとは何を指しますか?",
        a: "PoCの許可リストに登録されたメールアドレス1件を指します。許可リストはPoCごとに独立しているため、Freeプランの上限もワークスペース単位ではなくPoC単位です。無効化したシートは上限にカウントされません。",
      },
      {
        q: "POCXは私のPoCのコードやデータにアクセスしますか?",
        a: "いいえ。POCXが扱うのは入口だけです — 本人確認、規約、セッションのみ。評価者がゲートを通過した後のトラフィックはあなたのアプリへ直接流れ、POCXを経由することはありません。",
      },
      {
        q: "Freeプランで3シートに達するとどうなりますか?",
        a: "4人目の評価者を追加しようとすると、Proへのアップグレードが案内されます。既存の評価者のアクセスはそのまま維持され、何も停止・取り消しされません。",
      },
      {
        q: "署名には法的な意味がありますか?",
        a: "各署名には、OTPで確認済みの署名者メールアドレス、タイムスタンプ、IPアドレス、ユーザーエージェント、さらに表示された規約本文そのもののSHA-256ハッシュが記録され、署名済みPDF証明書が署名者にメール送付されます。これは電子署名の標準的な証拠要件に沿ったものです。(本記載は製品情報であり、法的助言ではありません。)",
      },
      {
        q: "完全に独自の規約を使うことはできますか?",
        a: "はい。標準の保護テンプレートに {{variables}} で事業者名・PoC名・目的を差し込むことも、全文を独自の規約に置き換えることもできます。バージョンを上げると、すべての評価者に再同意が求められます。",
      },
      {
        q: "解約するにはどうすればよいですか?",
        a: "ダッシュボードからいつでも解約できます。支払い済み期間の終わりまではそのまま利用でき、その後もゲートはFreeプランの範囲内で動き続けます。評価者が締め出されることはありません。",
      },
    ],
    still: {
      prefix: "まだ迷っていますか? ",
      docsLabel: "ドキュメントを読む",
      middle: "か、",
      startLabel: "無料で始めて",
      suffix: "みてください — 最初のPoCの保護は5分ほどで完了します。",
    },
  },
};

export const marketingDict: Record<Locale, MarketingStrings> = { en, ja };
