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
 * Voice: audience-first ("demo / prototype / mockup", consultants & dev
 * shops), not product jargon ("PoC" appears only where precision matters,
 * e.g. seat definitions). Kept in English everywhere: product terms
 * (POCX, OTP, SDK, API), code snippets, the agent prompt, /llms.txt and
 * /sdk/* labels, and the gate-mock's fictional content.
 */

const en = {
  meta: {
    landingTitle: "POCX — Protect the demos that win you clients",
    landingDescription:
      "Consultants and dev shops win work by showing demos — and AI can rebuild one from a screenshot overnight. POCX gates your demo behind verified identity and e-signed terms, so showing your work no longer means giving it away. Open source — self-host free, or start on the cloud.",
    pricingTitle: "Pricing",
    pricingDescription:
      "POCX pricing — protect demos free with up to 3 viewer seats each, go Pro for unlimited seats and a full audit trail, or self-host the open-source version for free.",
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
      "Protection for the demos, prototypes and mockups that win you clients — verified entry, e-signed terms, every view on the record.",
    company:
      "POCX is built and operated by Haxo Pty Ltd (Australia). Created by Saad Kamal.",
    product: "Product",
    forAgents: "For agents",
    account: "Account",
    legal: "Legal",
    pricing: "Pricing",
    docs: "Docs",
    tutorials: "Tutorials",
    faq: "FAQ",
    login: "Log in",
    signup: "Sign up",
    github: "GitHub",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    contact: "Contact",
    copyright:
      "© 2026 Haxo Pty Ltd. POCX — built to protect the people who build.",
  },

  hero: {
    eyebrow: "For consultants, dev shops & everyone who pitches with demos",
    titleMain: "Your best pitch is a working demo. ",
    titleAccent: "Protect it.",
    subtitle:
      "A screenshot of your prototype is all AI needs to rebuild it overnight. POCX puts a gate on your demo — every viewer proves who they are and signs your terms before they see a single screen.",
    startFree: "Start free",
    selfHost: "Self-host it — free",
    readDocs: "Read the docs",
    finePrint:
      "Free for 3 invited viewers per demo · or self-host free forever · no card required",
    audience: [
      "Consultancies",
      "Dev shops",
      "Agencies",
      "Freelancers",
      "Founders",
    ],
  },

  heroVisual: {
    termsTitle: "Terms of Access",
    agreeContinue: "Agree & continue",
    emailCode: "Email me a code",
    protectedLine: "Protected by POCX — access is logged and terms-gated",
  },

  trustChips: [
    "Every viewer verified by email code",
    "Terms signed before the first screen",
    "Open source — self-host free",
  ],

  problem: {
    eyebrow: "The new reality",
    title: "Building used to be the moat. Now it’s the easy part.",
    lead: "For years a demo was safe to show — rebuilding it was too much work to bother. That changed overnight.",
    beats: [
      {
        n: "01",
        text: "You pitch a prospect with your demo.",
      },
      {
        n: "02",
        text: "They screenshot it and paste it into Claude, Codex or Cursor: “build me this.”",
      },
      {
        n: "03",
        text: "By morning they have a working copy — and never needed you.",
      },
    ],
    punch:
      "Your ideas are worth more than ever — and easier to take than ever. The demo is the pitch. You can’t win the deal without showing it.",
    demo: {
      promptLabel: "coding agent",
      prompt: "Rebuild this app from the screenshot →",
      cloning: "cloning…",
      cloned: "your idea, cloned",
      blockedLabel: "with POCX",
      blocked: "Access denied — signature required",
    },
  },

  solution: {
    eyebrow: "What POCX does",
    title: "Show the work. Keep the idea.",
    body: "POCX doesn’t hide your demo — it makes seeing it accountable. Before anyone reaches a single screen, they prove their identity and sign your Terms of Access. A screenshot is no longer anonymous: it’s tied to a named person who agreed, in writing, not to build on your work without you.",
  },

  how: {
    eyebrow: "How it works",
    title: "From unprotected to protected in three steps.",
    step1: {
      eyebrow: "01 — Create",
      title: "Register your demo",
      body: "Name it, name the company that built it, invite your viewers by email. Terms, branding and session rules — all customizable from the dashboard.",
    },
    step2: {
      eyebrow: "02 — Drop in",
      title: "Drop in the gate",
      body: "One file, three env vars. The SDK is a single TypeScript file with zero dependencies:",
    },
    step3: {
      eyebrow: "03 — Send the link",
      title: "Send the link",
      body: "Viewers sign in with their invited email, e-sign your Terms of Access, and land in your demo. You watch sessions and signatures live — and can revoke anyone, instantly.",
    },
  },

  features: {
    eyebrow: "Features",
    title: "The whole front door, handled.",
    subtitle:
      "Identity, terms, sessions, evidence. POCX handles who gets in and on what conditions — your demo stays exactly as you built it.",
    items: [
      {
        title: "Invite-only + email codes",
        body: "Only invited emails get in. Codes are hashed, single-use, rate-limited, and lock out after five attempts. No passwords — ever.",
      },
      {
        title: "Terms of Access, e-signed",
        body: "A SHA-256 hash of the exact text, timestamp, IP and user agent on every signature — plus a signed PDF certificate emailed to the signer.",
      },
      {
        title: "Session control",
        body: "TTL and idle timeouts, one-click revoke for any viewer, and a panic button that revokes every session at once.",
      },
      {
        title: "Audit trail (Pro)",
        body: "Every code request, denial, login, signature and revocation — plus in-app access events from the SDK. Export it all as CSV.",
      },
      {
        title: "Branded hosted gate",
        body: "Your company name, your demo’s name, your brand color. The gate looks like yours because it is — we just run it for you.",
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
    eyebrow: "Why it holds up",
    title: "A login wall is not protection. A signature is.",
    p1: "Your demo embodies your thinking — the designs, the workflows, the idea your prospect is evaluating. A password keeps strangers out. It does nothing when the people you invited take what they saw and build it without you.",
    p2Before: "POCX’s standard Terms of Access include the clause that matters: ",
    p2Em: "if you build on this work, you engage us",
    p2After:
      ". Every viewer e-signs it before they see a single screen — and every signature is recorded with the SHA-256 hash of the exact text they agreed to, their verified email, IP, and timestamp, sealed in a PDF certificate.",
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

  openSource: {
    eyebrow: "Open source",
    title: "Don’t want to pay? Run it yourself.",
    body1:
      "POCX is fully open source — like n8n or Supabase. Not a stripped-down “community edition”: the entire product — the gate, the dashboard, the audit trail, the ops console — all of it. Self-host and every feature is free, forever.",
    body2:
      "The cloud at pocx.dev is for people who’d rather not run infrastructure. You pay for the convenience of not hosting it, not for the software. Either way, your ideas are protected.",
    ctaCloud: "Start on the cloud",
    ctaGithub: "Get it on GitHub",
    note: "AGPL-3.0 · your data, your server, your rules.",
  },

  teaser: {
    eyebrow: "Pricing",
    title: "Start free. Stay protected.",
    seePricing: "See pricing",
    selfHostNote: "Or run the open-source version yourself — free, forever.",
    free: {
      name: "Free",
      priceSuffix: " forever",
      bullets: [
        "Up to 3 viewer seats per demo",
        "Email-code gate + e-signed terms with PDF",
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
        "Unlimited viewer seats",
        "Full audit trail with CSV export",
        "Priority support",
      ],
      cta: "Start free",
    },
  },

  finalCta: {
    titleMain: "Ship the demo. ",
    titleAccent: "Keep the idea.",
    subtitle:
      "Free on the cloud for three viewers per demo, or self-host the whole thing for free. Your ideas, protected either way.",
    cta: "Start free",
    ctaGithub: "Get it on GitHub",
  },

  pricing: {
    eyebrow: "Pricing",
    title: "Simple pricing for protected demos",
    subtitle:
      "Start free, no card required. Upgrade when your audience grows beyond three people — or self-host the open-source version for free.",
    free: {
      name: "Free",
      priceSuffix: " forever",
      tagline: "Everything you need to gate a demo properly.",
      features: [
        "Up to 3 viewer seats per demo",
        "Email-code gate, invite-only",
        "E-signed Terms of Access + PDF certificate",
        "Session control & instant revoke",
        "Hosted gate branded per demo",
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
        "Unlimited viewer seats",
        "Full audit trail",
        "CSV export",
        "Priority support",
      ],
      cta: "Start free, upgrade anytime",
    },
    selfHost: {
      name: "Self-hosted",
      price: "Free",
      priceSuffix: " forever",
      tagline: "Run the open-source version on your own infrastructure.",
      features: [
        "The entire product — every feature",
        "No seat limits, no plan gates",
        "Your data stays on your server",
        "AGPL-3.0 — yours to modify",
        "Community support on GitHub",
      ],
      cta: "Get it on GitHub",
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "What counts as a viewer seat?",
        a: "An invited email address on a demo. Each demo has its own invite list, so the Free limit is per demo — not per workspace. Disabled seats don’t count against the limit.",
      },
      {
        q: "Do you see my demo’s code or data?",
        a: "No. POCX only handles the front door: identity, terms and sessions. Once a viewer is through the gate, traffic goes straight to your app — nothing passes through us. And if you self-host, nothing leaves your servers at all.",
      },
      {
        q: "It’s open source — why would I pay?",
        a: "You wouldn’t, for the software — it’s free to self-host with every feature. The Pro plan pays for the managed cloud: we run it, keep email deliverability healthy, and handle upgrades, so you don’t stand up a server just to pitch a demo.",
      },
      {
        q: "What happens when I hit 3 seats on Free?",
        a: "Adding a fourth viewer prompts an upgrade to Pro. Existing viewers keep their access — nothing breaks, nothing is revoked. (Self-hosting has no seat limit.)",
      },
      {
        q: "Are the signatures legally meaningful?",
        a: "Each signature records the signer’s email identity (verified by a one-time code), a timestamp, IP address and user agent, plus a SHA-256 hash of the exact terms text shown — and a signed PDF certificate is emailed to the signer. That’s standard electronic-signature evidence. (This is product information, not legal advice.)",
      },
      {
        q: "Can I bring fully custom terms?",
        a: "Yes. Use the standard protective template with {{variables}} for your company, demo and purpose — or replace it entirely with your own text. Bumping the version forces every viewer to re-accept.",
      },
      {
        q: "How do I cancel?",
        a: "Cancel anytime from the dashboard — access continues until the end of the period you’ve paid for. After that, your gates keep working within Free limits — viewers aren’t locked out.",
      },
    ],
    still: {
      prefix: "Still deciding? ",
      docsLabel: "Read the docs",
      middle: " or ",
      startLabel: "start free",
      suffix: " — protecting your first demo takes about five minutes.",
    },
  },
};

export type MarketingStrings = typeof en;

const ja: MarketingStrings = {
  meta: {
    landingTitle: "POCX — 受注を勝ち取るデモを、守る",
    landingDescription:
      "コンサルタントや開発会社は、デモを見せて仕事を勝ち取ります。しかしAIは、スクリーンショット1枚からそのデモを一晩で再現できます。POCXは本人確認と電子署名付き規約でデモをゲートし、「見せること」が「渡すこと」にならないようにします。オープンソース — 自分で無料ホスト、またはクラウドで開始。",
    pricingTitle: "料金プラン",
    pricingDescription:
      "POCXの料金 — デモごとに閲覧者3名まで無料で保護。無制限のシートと完全な監査ログが必要ならPro、あるいはオープンソース版を自分で無料ホスト。",
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
      "受注を勝ち取るデモ・プロトタイプ・モックアップのための保護 — 本人確認済みの入場、電子署名付き規約、すべての閲覧を記録。",
    company:
      "POCXはHaxo Pty Ltd（オーストラリア）が開発・運営しています。作者: Saad Kamal。",
    product: "プロダクト",
    forAgents: "エージェント向け",
    account: "アカウント",
    legal: "法的情報",
    pricing: "料金",
    docs: "ドキュメント",
    tutorials: "チュートリアル",
    faq: "FAQ",
    login: "ログイン",
    signup: "新規登録",
    github: "GitHub",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    contact: "お問い合わせ",
    copyright: "© 2026 Haxo Pty Ltd. POCX — つくる人を守るために。",
  },

  hero: {
    eyebrow: "デモで仕事を勝ち取る、コンサルタント・開発会社のために",
    titleMain: "最強の提案は、動くデモ。",
    titleAccent: "だから、守る。",
    subtitle:
      "AIは、プロトタイプのスクリーンショット1枚から一晩で複製をつくれます。POCXはあなたのデモにゲートを設けます — 閲覧者は全員、本人確認を行い、あなたの規約に署名してから最初の画面を目にします。",
    startFree: "無料で始める",
    selfHost: "自分でホストする（無料）",
    readDocs: "ドキュメントを読む",
    finePrint:
      "デモごとに閲覧者3名まで無料 · または自分でホストすればずっと無料 · カード不要",
    audience: [
      "コンサルティング会社",
      "開発会社",
      "エージェンシー",
      "フリーランス",
      "起業家",
    ],
  },

  heroVisual: {
    termsTitle: "利用規約",
    agreeContinue: "同意して続行",
    emailCode: "コードをメールで受け取る",
    protectedLine:
      "POCXで保護されています — アクセスは記録され、利用規約への同意が必要です",
  },

  trustChips: [
    "閲覧者は全員メールコードで本人確認",
    "最初の画面の前に規約へ署名",
    "オープンソース — 自分でホストすれば無料",
  ],

  problem: {
    eyebrow: "新しい現実",
    title: "かつては「作れること」が堀だった。今、それは一番簡単な部分です。",
    lead: "長い間、デモは安全に見せられました — 再現するのは手間がかかりすぎて、誰もやらなかったからです。それが一晩で変わりました。",
    beats: [
      {
        n: "01",
        text: "見込み客にデモを見せて提案する。",
      },
      {
        n: "02",
        text: "相手はスクショを撮り、Claude・Codex・Cursorに貼り付けて「これを作って」と頼む。",
      },
      {
        n: "03",
        text: "翌朝には動くコピーが完成 — あなたはもう必要ない。",
      },
    ],
    punch:
      "アイデアの価値はかつてなく高まり、かつてなく持ち去られやすくなっています。デモこそが提案そのもの — 見せなければ、受注は取れません。",
    demo: {
      promptLabel: "コーディングエージェント",
      prompt: "このスクショからアプリを再現して →",
      cloning: "複製中…",
      cloned: "あなたのアイデア、複製完了",
      blockedLabel: "POCXがあれば",
      blocked: "アクセス拒否 — 署名が必要です",
    },
  },

  solution: {
    eyebrow: "POCXの役割",
    title: "見せる。でも、渡さない。",
    body: "POCXはデモを隠しません — 見ることに責任を持たせます。誰かが最初の画面にたどり着く前に、本人確認を行い、あなたの利用規約に署名します。スクリーンショットはもう匿名ではありません。それは、あなたの成果物を無断で流用しないと書面で同意した、名前のある人物に紐づきます。",
  },

  how: {
    eyebrow: "仕組み",
    title: "無防備な状態から、3ステップで保護へ。",
    step1: {
      eyebrow: "01 — 登録",
      title: "デモを登録する",
      body: "デモに名前を付け、開発した会社名を設定し、閲覧者をメールで招待します。規約、ブランディング、セッションルールはすべてダッシュボードからカスタマイズできます。",
    },
    step2: {
      eyebrow: "02 — 組み込み",
      title: "ゲートを組み込む",
      body: "ファイル1つ、環境変数3つ。SDKは依存関係ゼロの単一TypeScriptファイルです。",
    },
    step3: {
      eyebrow: "03 — リンク送信",
      title: "リンクを送る",
      body: "閲覧者は招待されたメールでサインインし、利用規約に電子署名して、あなたのデモに入ります。セッションと署名はリアルタイムで確認でき、誰のアクセスでも即座に取り消せます。",
    },
  },

  features: {
    eyebrow: "機能",
    title: "アプリの玄関口を、まるごと引き受けます。",
    subtitle:
      "本人確認、規約、セッション、証跡。誰が、どんな条件で入れるかはPOCXが管理します — あなたのデモには一切手を加えません。",
    items: [
      {
        title: "招待制 + メールコード",
        body: "招待されたメールアドレスだけが入場できます。コードはハッシュ化・使い捨て・レート制限付きで、5回失敗するとロックされます。パスワードは一切使いません。",
      },
      {
        title: "電子署名付き利用規約",
        body: "すべての署名に、規約本文のSHA-256ハッシュ、タイムスタンプ、IPアドレス、ユーザーエージェントを記録。さらに署名済みPDF証明書を署名者にメールで送付します。",
      },
      {
        title: "セッション制御",
        body: "TTLとアイドルタイムアウト、閲覧者ごとのワンクリック取り消し、そして全セッションを一括で無効化するパニックボタンを備えています。",
      },
      {
        title: "監査ログ(Pro)",
        body: "コードのリクエスト、拒否、ログイン、署名、取り消しのすべてに加え、SDK経由のアプリ内アクセスイベントも記録。まとめてCSVでエクスポートできます。",
      },
      {
        title: "ブランド対応のホスト型ゲート",
        body: "あなたの会社名、デモの名前、ブランドカラーを反映。ゲートはあなたのものに見えます — 実際にあなたのものだからです。運用だけを私たちが担います。",
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
    eyebrow: "なぜ効くのか",
    title: "ログイン画面は保護ではありません。署名こそが保護です。",
    p1: "デモには、あなたの思考が詰まっています — デザイン、ワークフロー、そして見込み客が評価しているアイデアそのもの。パスワードは部外者を締め出せても、招待した相手が見たものを持ち帰り、あなた抜きで作ってしまうことは防げません。",
    p2Before: "POCXの標準利用規約には、核心となる条項が含まれています — ",
    p2Em: "この成果物を基に開発する場合は、当方と契約すること",
    p2After:
      "。すべての閲覧者は、画面を1つ見る前にこの規約に電子署名します。そして各署名には、同意した規約本文のSHA-256ハッシュ、確認済みメールアドレス、IPアドレス、タイムスタンプが記録され、PDF証明書として保全されます。",
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

  openSource: {
    eyebrow: "オープンソース",
    title: "払いたくない？ 自分で動かせばいい。",
    body1:
      "POCXは完全なオープンソースです — n8nやSupabaseと同じように。機能を削った「コミュニティ版」ではありません。ゲートも、ダッシュボードも、監査ログも、運用コンソールも — 製品まるごと。自分でホストすれば、あらゆる機能がずっと無料です。",
    body2:
      "pocx.devのクラウドは、インフラを自分で運用したくない人のためのもの。あなたが支払うのはソフトウェアではなく「ホストしない」という便利さに対してです。どちらを選んでも、あなたのアイデアは守られます。",
    ctaCloud: "クラウドで始める",
    ctaGithub: "GitHubで入手",
    note: "AGPL-3.0 · あなたのデータ、あなたのサーバー、あなたのルール。",
  },

  teaser: {
    eyebrow: "料金",
    title: "無料で始めて、守り続ける。",
    seePricing: "料金を見る",
    selfHostNote: "または、オープンソース版を自分で動かす — 無料で、ずっと。",
    free: {
      name: "Free",
      priceSuffix: " ずっと無料",
      bullets: [
        "デモごとに閲覧者3名まで",
        "メールコードのゲート + PDF付き電子署名規約",
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
        "閲覧者数は無制限",
        "CSVエクスポート付きの完全な監査ログ",
        "優先サポート",
      ],
      cta: "無料で始める",
    },
  },

  finalCta: {
    titleMain: "デモは届ける。",
    titleAccent: "アイデアは守る。",
    subtitle:
      "クラウドならデモごとに閲覧者3名まで無料、あるいは製品まるごと自分で無料ホスト。どちらでも、あなたのアイデアは守られます。",
    cta: "無料で始める",
    ctaGithub: "GitHubで入手",
  },

  pricing: {
    eyebrow: "料金",
    title: "デモを守るための、シンプルな料金",
    subtitle:
      "クレジットカード不要で、無料で始められます。閲覧者が3名を超えたらアップグレード — または、オープンソース版を自分で無料ホスト。",
    free: {
      name: "Free",
      priceSuffix: " ずっと無料",
      tagline: "デモをきちんと守るために必要なもの、すべて。",
      features: [
        "デモごとに閲覧者3名まで",
        "メールコードのゲート(招待制)",
        "電子署名付き利用規約 + PDF証明書",
        "セッション制御と即時取り消し",
        "デモごとにブランド設定できるホスト型ゲート",
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
        "閲覧者数は無制限",
        "完全な監査ログ",
        "CSVエクスポート",
        "優先サポート",
      ],
      cta: "無料で始めて、いつでもアップグレード",
    },
    selfHost: {
      name: "セルフホスト",
      price: "無料",
      priceSuffix: " ずっと",
      tagline: "オープンソース版を、自分のインフラで動かす。",
      features: [
        "製品まるごと — すべての機能",
        "シート上限なし、プラン制限なし",
        "データはあなたのサーバーに",
        "AGPL-3.0 — 自由に改変可能",
        "GitHubでのコミュニティサポート",
      ],
      cta: "GitHubで入手",
    },
    faqTitle: "よくある質問",
    faq: [
      {
        q: "閲覧者シートとは何を指しますか?",
        a: "デモの招待リストに登録されたメールアドレス1件を指します。招待リストはデモごとに独立しているため、Freeプランの上限もワークスペース単位ではなくデモ単位です。無効化したシートは上限にカウントされません。",
      },
      {
        q: "POCXは私のデモのコードやデータにアクセスしますか?",
        a: "いいえ。POCXが扱うのは入口だけです — 本人確認、規約、セッションのみ。閲覧者がゲートを通過した後のトラフィックはあなたのアプリへ直接流れ、POCXを経由することはありません。セルフホストなら、何一つあなたのサーバーの外には出ません。",
      },
      {
        q: "オープンソースなら、なぜ払うのですか?",
        a: "ソフトウェアには払いません — 全機能付きで、セルフホストは無料です。Proプランは、マネージドクラウドへの対価です。運用、メール到達性の維持、アップグレードを私たちが担うので、デモの提案のためだけにサーバーを立てる必要がありません。",
      },
      {
        q: "Freeプランで3シートに達するとどうなりますか?",
        a: "4人目の閲覧者を追加しようとすると、Proへのアップグレードが案内されます。既存の閲覧者のアクセスはそのまま維持され、何も停止・取り消しされません。(セルフホストにシート上限はありません。)",
      },
      {
        q: "署名には法的な意味がありますか?",
        a: "各署名には、ワンタイムコードで確認済みの署名者メールアドレス、タイムスタンプ、IPアドレス、ユーザーエージェント、さらに表示された規約本文そのもののSHA-256ハッシュが記録され、署名済みPDF証明書が署名者にメール送付されます。これは電子署名の標準的な証拠要件に沿ったものです。(本記載は製品情報であり、法的助言ではありません。)",
      },
      {
        q: "完全に独自の規約を使うことはできますか?",
        a: "はい。標準の保護テンプレートに {{variables}} で会社名・デモ名・目的を差し込むことも、全文を独自の規約に置き換えることもできます。バージョンを上げると、すべての閲覧者に再同意が求められます。",
      },
      {
        q: "解約するにはどうすればよいですか?",
        a: "ダッシュボードからいつでも解約できます。支払い済み期間の終わりまではそのまま利用でき、その後もゲートはFreeプランの範囲内で動き続けます。閲覧者が締め出されることはありません。",
      },
    ],
    still: {
      prefix: "まだ迷っていますか? ",
      docsLabel: "ドキュメントを読む",
      middle: "か、",
      startLabel: "無料で始めて",
      suffix: "みてください — 最初のデモの保護は5分ほどで完了します。",
    },
  },
};

export const marketingDict: Record<Locale, MarketingStrings> = { en, ja };
