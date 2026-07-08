import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

/**
 * Operator-dashboard strings. `en` is the source of truth for the shape;
 * `ja` must satisfy the same type, so a missing/extra key fails typecheck.
 *
 * Intentionally NOT localized (kept English everywhere):
 * - server-action result messages ({error}/{message}) — displayed verbatim
 * - audit event names/values, emails, keys, env vars, code blocks
 * - the copyable coding-agent prompt and CSV export content
 */

const en = {
  shell: {
    logoAria: "POCX dashboard",
    nav: {
      pocs: "PoCs",
      team: "Team",
      billing: "Billing",
      docs: "Docs",
    },
    logout: "Log out",
    loggingOut: "Logging out…",
  },

  home: {
    metaTitle: "PoCs — POCX",
    title: "Proofs of concept",
    newPoc: "New PoC",
    emptyTitle: "No PoCs yet",
    emptyHint:
      "Create your first protected proof of concept — it takes about a minute.",
    statusLive: "Live",
    statusPaused: "Paused",
    /** Rendered after a bold count, e.g. “3 evaluators” / 「3 名の評価者」. */
    evaluatorsUnit: (n: number): string =>
      n === 1 ? "evaluator" : "evaluators",
    sessionsUnit: (n: number): string =>
      n === 1 ? "active session" : "active sessions",
    signaturesUnit: (n: number): string =>
      n === 1 ? "signature" : "signatures",
    manage: "Manage →",
  },

  onboarding: {
    title: "Get started with POCX",
    subtitle: "Four steps from zero to a protected PoC.",
    progress: (done: number, total: number) => `${done} of ${total}`,
    steps: {
      createPoc: {
        title: "Create your first PoC",
        detail:
          "Name it, name the entity that built it, set the purpose — this drives the gate branding and the Terms of Access.",
        cta: "New PoC",
      },
      inviteEvaluators: {
        title: "Invite evaluators",
        detail:
          "Only allowlisted emails can request a login code. Add yourself first so you can test the flow.",
        cta: "Add emails",
      },
      connectApp: {
        title: "Connect your app",
        detail:
          "Three env vars + one file. Copy everything from the PoC's Overview tab — or paste the prompt into a coding agent.",
        cta: "Open Overview",
      },
      testGate: {
        title: "Test the gate",
        detail:
          "Open your gate in a private window, sign in with your code, e-sign the terms — then watch yourself appear under Sessions and Signatures.",
        cta: "Try it",
      },
    },
    helpBefore: "Need a walkthrough? Read the ",
    helpTutorials: "step-by-step tutorials",
    helpBetween: " or the ",
    helpFaq: "FAQ",
    helpAfter: ".",
  },

  newPoc: {
    metaTitle: "New PoC — POCX",
    title: "New PoC",
    intro:
      "Register the proof of concept you want to protect. POCX gives it a hosted gate where evaluators log in with a one-time email code and e-sign your Terms of Access before they can reach the app. You can change all of this later.",
    optional: "(optional)",
    nameLabel: "PoC name",
    nameHint:
      "Shown on the gate, in OTP emails and in the Terms of Access. Also sets the gate URL slug.",
    ownerLabel: "Owner entity",
    ownerHint:
      "The entity that built and owns the PoC — named as the disclosing party in the Terms of Access.",
    regNoLabel: "Owner registration number",
    regNoHint:
      "Company registration number, shown alongside the owner entity in the terms.",
    clientLabel: "Client entity",
    clientHint:
      "Who will evaluate the PoC — named as the receiving party in the terms. Leave blank to keep the terms generic.",
    purposeLabel: "Purpose",
    purposePlaceholder: "evaluating a potential engagement with …",
    purposeHint:
      "One line on why access is being granted — quoted in the Terms of Access as the permitted purpose.",
    appUrlLabel: "App URL",
    appUrlHint:
      "The app the gate protects — where evaluators land after signing. You can add or change this later in the PoC settings.",
    submit: "Create PoC",
    submitting: "Creating…",
  },

  billing: {
    metaTitle: "Billing — POCX",
    title: "Billing",
    intro:
      "Plans apply to the whole workspace — every PoC in it shares the same limits.",
    freeTagline: "Protect a PoC for up to 3 evaluators.",
    proTagline: "Unlimited evaluators and the full audit trail.",
    currentPlan: "Current plan",
    freeForever: " / forever",
    perWorkspaceMonth: " / workspace / month",
    freeFeatures: [
      "Up to 3 evaluator seats per PoC",
      "OTP email login gate",
      "Terms of Access with e-signature PDF",
      "Session control & revocation",
    ],
    proFeatures: [
      "Everything in Free",
      "Unlimited evaluator seats",
      "Full audit trail (every auth decision + app access events)",
      "CSV export",
      "Priority support",
    ],
    upgrade: "Upgrade to Pro",
    working: "Working…",
    /* Upgraded banner */
    upgradedTitle: "Welcome to Pro",
    upgradedBody:
      "Your workspace now has unlimited evaluator seats and the full audit trail.",
    /* Billing-interval toggle (Free plan) */
    intervalAria: "Billing interval",
    intervalMonthly: (price: number): string => `Monthly — US$${price}/mo`,
    intervalYearly: (price: number): string => `Yearly — US$${price}/yr`,
    saveBadge: (pct: number): string => `Save ${pct}% — 2 months+ free`,
    perWorkspaceYear: " / workspace / year",
    yearlyEquivalent: (approx: number): string =>
      `≈ US$${approx}/mo billed annually`,
    /* Pro subscription card */
    subscriptionTitle: "Subscription",
    statusMonthly: "Pro · billed monthly",
    statusYearly: "Pro · billed yearly",
    renewsOn: (date: string): string => `Renews on ${date}`,
    cancelsOn: (date: string): string =>
      `Cancels on ${date} — Pro access continues until then`,
    cancelsAtPeriodEnd:
      "Cancels at the end of the current billing period — Pro access continues until then",
    resume: "Resume subscription",
    manageBilling: "Manage billing & invoices",
    switchToYearly: (pct: number): string => `Switch to yearly — save ${pct}%`,
    switchConfirm: (price: number): string =>
      `Switch to yearly billing (US$${price}/yr)? The prorated difference is invoiced today.`,
    cancelSubscription: "Cancel subscription",
    cancelConfirm:
      "Cancel your Pro subscription? Pro access continues until the end of the period you've already paid for.",
    /* Retention offer */
    retentionTitle: "Before you go — 50% off for 3 months",
    retentionBody: (price: string): string =>
      `Stay on Pro and your next 3 monthly invoices are half price (${price}/mo). One-time offer.`,
    retentionAccept: "Keep Pro at 50% off",
    retentionDecline: "Cancel anyway",
    retentionClose: "Close",
    demoNote:
      "Stripe isn't configured on this deployment — plan changes apply instantly (demo mode).",
    workspaceTitle: "Workspace",
    workspaceDesc:
      "The workspace name appears in the dashboard sidebar and on billing records.",
    workspaceNameLabel: "Workspace name",
    save: "Save",
    savedFallback: "Saved.",
  },

  team: {
    metaTitle: "Team — POCX",
    title: "Team",
    intro:
      "Teammates can manage every PoC in this workspace. Only the owner can invite or disable teammates.",
    inviteTitle: "Invite a teammate",
    inviteNote:
      "They get an email and can sign in with a one-time code — no password to set up.",
    memberNote: "Only the workspace owner can invite or disable teammates.",
    emailLabel: "Email",
    nameLabel: "Name (optional)",
    invite: "Invite teammate",
    inviting: "Inviting…",
    thEmail: "Email",
    thName: "Name",
    thRole: "Role",
    thAdded: "Added",
    thAddedBy: "Added by",
    thStatus: "Status",
    statusActive: "Active",
    statusDisabled: "Disabled",
    you: "(you)",
    disable: "Disable",
    reEnable: "Re-enable",
    saving: "Saving…",
    disableConfirm: (email: string) =>
      `Disable ${email}? They are signed out immediately and can't access this workspace until re-enabled.`,
  },

  poc: {
    common: {
      copy: "Copy to clipboard",
      copied: "Copied",
      revealSecret: "Reveal secret",
      hideSecret: "Hide secret",
    },

    shell: {
      statusActive: "Active",
      statusPaused: "Paused",
      openGateAria: "Open the hosted gate in a new tab",
      sectionsAria: "PoC sections",
    },

    tabs: {
      overview: "Overview",
      evaluators: "Evaluators",
      sessions: "Sessions",
      signatures: "Signatures",
      audit: "Audit trail",
      emails: "Emails",
      terms: "Terms",
      settings: "Settings",
    },

    overview: {
      statActiveEvaluators: "Active evaluators",
      statLiveSessions: "Live sessions",
      statSignatures: "Signatures",
      statAuditEvents: "Audit events",
      integrationTitle: "Integration",
      integrationDesc:
        "Everything the protected app needs to talk to POCX — keys, env file and the two-minute setup.",
      envFileBefore: "Drop this into ",
      envFileAfter: "",
      setup: "Setup",
      agentTitle: "For coding agents",
      agentCaption:
        "Paste this into Claude Code / Codex / Cursor — the agent does the rest.",
      gateTitle: "Hosted gate",
      gateBefore: "Evaluators sign in at ",
      gateAfter:
        " — no setup on their side. The gate checks the allowlist, emails a one-time code, collects the Terms-of-Access signature, then hands them a session into the protected app.",
      openGate: "Open gate",
      chainNote:
        "The gate enforces the full chain on every login: allowlist → OTP → terms → session.",
    },

    evaluators: {
      addTitle: "Add an evaluator",
      allowlistNote:
        "Only allowlisted emails can request an access code at the gate.",
      seatsUsed: (used: number, max: string) => `${used} of ${max} seats used.`,
      seatNudge: (
        used: number,
        max: number,
        monthly: number,
        yearly: number,
      ): string =>
        `You're using ${used} of ${max} free evaluator seats. Pro removes the cap — US$${monthly}/mo or US$${yearly}/yr.`,
      seatNudgeCta: "See plans",
      upgradeCta: "Upgrade to Pro for unlimited seats →",
      upgradeLink: "Upgrade →",
      emailLabel: "Email",
      nameLabel: "Name (optional)",
      inviteCheckbox: "Email an invitation with the gate link",
      add: "Add evaluator",
      adding: "Adding…",
      sendInvite: "Send invite",
      sendingInvite: "Sending…",
      emptyTitle: "No evaluators yet",
      emptyHint:
        "Add the people who should be able to open this PoC — everyone else is turned away at the gate.",
      thEmail: "Email",
      thName: "Name",
      thStatus: "Status",
      thAdded: "Added",
      thAddedBy: "Added by",
      statusActive: "Active",
      statusDisabled: "Disabled",
      reEnable: "Re-enable",
      disable: "Disable",
      saving: "Saving…",
    },

    sessions: {
      intro:
        "Every evaluator sign-in creates a revocable session. Revocation cuts access on the very next request — even for someone already inside the protected app.",
      revokeAll: "Revoke all",
      revokeAllConfirm:
        "Revoke every live session for this PoC? All evaluators will be signed out on their next request.",
      revokedFallback: "Sessions revoked.",
      emptyTitle: "No sessions yet",
      emptyHint:
        "Sessions appear here the moment an evaluator signs in at the gate.",
      thEmail: "Email",
      thSignedIn: "Signed in",
      thLastActive: "Last active",
      thIp: "IP",
      thStatus: "Status",
      statusActive: "Active",
      statusIdle: "Idle",
      statusExpired: "Expired",
      statusRevoked: "Revoked",
      revoke: "Revoke",
      revoking: "Revoking…",
    },

    signatures: {
      intro:
        "Each record stores the exact text shown, a SHA-256 hash, IP and browser — and the signed PDF was emailed to the signer.",
      emptyTitle: "No signatures yet",
      emptyHint:
        "Signatures appear here when evaluators accept the Terms of Access at the gate.",
      thEmail: "Email",
      thVersion: "Terms version",
      thAccepted: "Accepted",
      thIp: "IP",
      thSignatureId: "Signature id",
      thHash: "Hash",
      downloadPdf: "Download PDF",
    },

    audit: {
      lockedTitle: "Audit trail is a Pro feature",
      lockedBody:
        "Every OTP request, login, denial, terms signature, session revocation and in-app access event — timestamped, with IP and user agent. POCX records them from day one; upgrading unlocks the full history.",
      lockedCta: (price: number) => `Upgrade to Pro — US$${price}/mo`,
      filterPlaceholder: "Filter by email, detail, path, IP…",
      filterAria: "Filter audit events",
      eventFilterAria: "Filter by event type",
      allEvents: "All events",
      count: (shown: number, total: number) => `${shown} of ${total} events`,
      exportCsv: "Export CSV",
      emptyTitle: "No audit events yet",
      emptyHint:
        "Every OTP request, login, denial, signature and access decision lands here as it happens.",
      noMatchTitle: "Nothing matches that filter",
      noMatchHint: "Try a different search term or event type.",
      thTime: "Time",
      thEvent: "Event",
      thEmail: "Email",
      thDetail: "Detail",
      thPath: "Path",
      thSource: "Source",
      thIp: "IP",
    },

    emails: {
      mockNotice:
        "RESEND_API_KEY isn't configured on this POCX deployment, so evaluator emails (access codes, signed terms) land here instead of a real inbox — handy for demos.",
      emptyTitle: "No emails yet",
      emptyHint:
        "Access codes and signed-terms emails sent to this PoC's evaluators show up here.",
      thTime: "Time",
      thTo: "To",
      thSubject: "Subject",
      thBody: "Body",
      viewBody: "View body",
    },

    terms: {
      editorTitle: "Terms of Access",
      editorDesc:
        "Evaluators must e-sign these terms before they reach the app.",
      textLegend: "Terms text",
      templateOption: "Standard template",
      templateRecommended: "(recommended)",
      templateDesc:
        "POCX standard protective terms, auto-filled from your PoC details.",
      customOption: "Custom text",
      customDesc: "Write your own terms — placeholders still work.",
      placeholdersNote: "Available placeholders:",
      versionLabel: "Version",
      versionWarning:
        "Changing the version forces every evaluator to re-accept the terms on their next visit.",
      revokeCheckbox: "Also revoke all live sessions now",
      save: "Save terms",
      saving: "Saving…",
      previewTitle: "Live preview",
      previewDesc:
        "Exactly what evaluators see — and sign — at the gate right now.",
    },

    settings: {
      identityTitle: "Identity & branding",
      identityDesc: "Shown on the gate and woven into the Terms of Access.",
      nameLabel: "PoC name",
      ownerLabel: "Owner entity",
      regNoLabel: "Owner registration no. (optional)",
      clientLabel: "Client entity (optional)",
      purposeLabel: "Evaluation purpose",
      purposePlaceholder:
        "e.g. evaluating a claims-triage workflow for a potential engagement",
      supportEmailLabel: "Support email",
      brandColorLabel: "Brand colour",
      brandColorAria: "Pick brand colour",
      appTitle: "Protected app",
      appDesc: "Where the PoC actually lives.",
      appUrlLabel: "App URL",
      callbackLabel: "Callback path",
      callbackHelp:
        "Where POCX redirects evaluators back with a grant; the SDK handles it automatically.",
      sessionTitle: "Session policy",
      sessionDesc: "How long evaluators stay signed in.",
      ttlLabel: "Session lifetime (hours)",
      ttlHelp: "Hard cap per sign-in. Default 24.",
      idleLabel: "Idle timeout (hours)",
      idleHelp: "Signed out after this much inactivity. Default 3.",
      otpLabel: "Code lifetime (minutes)",
      otpHelp: "How long an emailed OTP stays valid. Default 10.",
      availabilityTitle: "Availability",
      availabilityDesc:
        "Pausing blocks new logins AND live SDK validation immediately.",
      statusLabel: "Status",
      statusActive: "Active",
      statusPaused: "Paused",
      save: "Save",
      saving: "Saving…",
      savedFallback: "Saved.",
      dangerTitle: "Danger zone",
      rotateTitle: "Rotate SDK secret",
      rotateDesc:
        "Invalidates the current POCX_SECRET — update the protected app's env after rotating.",
      rotateButton: "Rotate secret",
      rotateConfirm:
        "Rotate the SDK secret? The protected app must be updated with the new POCX_SECRET before token exchange works again.",
      archiveTitle: "Archive this PoC",
      archiveDesc:
        "Revokes every live session and hides the PoC from the dashboard.",
      archiveButton: "Archive PoC",
      archiveConfirm:
        "Archive this PoC? All live sessions are revoked and the PoC disappears from the dashboard. This cannot be undone from the UI.",
    },
  },
};

export type DashboardStrings = typeof en;

const ja: DashboardStrings = {
  shell: {
    logoAria: "POCXダッシュボード",
    nav: {
      pocs: "PoC一覧",
      team: "チーム",
      billing: "請求",
      docs: "ドキュメント",
    },
    logout: "ログアウト",
    loggingOut: "ログアウト中…",
  },

  home: {
    metaTitle: "PoC一覧 — POCX",
    title: "PoC一覧",
    newPoc: "新規PoC",
    emptyTitle: "PoCはまだありません",
    emptyHint: "最初のPoCを保護しましょう — 約1分で作成できます。",
    statusLive: "稼働中",
    statusPaused: "一時停止",
    evaluatorsUnit: () => "名の評価者",
    sessionsUnit: () => "件の有効セッション",
    signaturesUnit: () => "件の署名",
    manage: "管理 →",
  },

  onboarding: {
    title: "POCXをはじめる",
    subtitle: "4つのステップでPoCの保護が完了します。",
    progress: (done: number, total: number) => `${done} / ${total} 完了`,
    steps: {
      createPoc: {
        title: "最初のPoCを作成",
        detail:
          "PoC名・開発元・利用目的を設定します。ゲートのブランディングとアクセス利用規約に反映されます。",
        cta: "新規PoC",
      },
      inviteEvaluators: {
        title: "評価者を招待",
        detail:
          "許可リストに登録されたメールアドレスのみログインコードを取得できます。まずご自身を追加して動作を確認しましょう。",
        cta: "メールを追加",
      },
      connectApp: {
        title: "アプリを接続",
        detail:
          "環境変数3つとファイル1つだけ。PoCの「概要」タブからすべてコピーするか、プロンプトをコーディングエージェントに貼り付けてください。",
        cta: "概要を開く",
      },
      testGate: {
        title: "ゲートをテスト",
        detail:
          "プライベートウィンドウでゲートを開き、コードでログインして規約に電子署名すると、「セッション」と「署名」に自分が表示されます。",
        cta: "試してみる",
      },
    },
    helpBefore: "詳しい手順は",
    helpTutorials: "ステップバイステップのチュートリアル",
    helpBetween: "または",
    helpFaq: "FAQ",
    helpAfter: "をご覧ください。",
  },

  newPoc: {
    metaTitle: "新規PoC — POCX",
    title: "新規PoC",
    intro:
      "保護したいPoCを登録します。POCXがホスト型ゲートを提供し、評価者はワンタイムのメールコードでログインし、アクセス利用規約に電子署名してからアプリに到達します。設定はすべて後から変更できます。",
    optional: "(任意)",
    nameLabel: "PoC名",
    nameHint:
      "ゲート、OTPメール、アクセス利用規約に表示されます。ゲートURLのスラッグにもなります。",
    ownerLabel: "オーナー事業者",
    ownerHint:
      "PoCを開発・所有する事業者。アクセス利用規約で開示当事者として記載されます。",
    regNoLabel: "オーナーの法人登録番号",
    regNoHint: "法人登録番号。規約でオーナー事業者名と併せて表示されます。",
    clientLabel: "クライアント事業者",
    clientHint:
      "PoCを評価する相手先。規約で受領当事者として記載されます。空欄の場合は汎用的な規約になります。",
    purposeLabel: "利用目的",
    purposePlaceholder: "〜との協業検討のための評価",
    purposeHint:
      "アクセスを許可する理由を一行で。アクセス利用規約に許可された目的として引用されます。",
    appUrlLabel: "アプリURL",
    appUrlHint:
      "ゲートが保護するアプリのURL。署名後に評価者が到達する先です。PoC設定で後から追加・変更できます。",
    submit: "PoCを作成",
    submitting: "作成中…",
  },

  billing: {
    metaTitle: "請求 — POCX",
    title: "請求",
    intro:
      "プランはワークスペース全体に適用され、すべてのPoCが同じ上限を共有します。",
    freeTagline: "評価者3名までのPoCを保護。",
    proTagline: "評価者数無制限、完全な監査ログ。",
    currentPlan: "現在のプラン",
    freeForever: " / ずっと無料",
    perWorkspaceMonth: " / ワークスペース / 月",
    freeFeatures: [
      "PoCごとに評価者シート3名まで",
      "OTPメールログインゲート",
      "電子署名PDF付きアクセス利用規約",
      "セッション管理と無効化",
    ],
    proFeatures: [
      "Freeの全機能",
      "評価者シート数無制限",
      "完全な監査ログ(すべての認証判定とアプリアクセスイベント)",
      "CSVエクスポート",
      "優先サポート",
    ],
    upgrade: "Proにアップグレード",
    working: "処理中…",
    upgradedTitle: "Proへようこそ",
    upgradedBody:
      "このワークスペースで評価者シート無制限と完全な監査ログが利用可能になりました。",
    intervalAria: "請求サイクル",
    intervalMonthly: (price: number): string => `月払い — US$${price}/月`,
    intervalYearly: (price: number): string => `年払い — US$${price}/年`,
    saveBadge: (pct: number): string => `${pct}%お得 — 2ヶ月分以上無料`,
    perWorkspaceYear: " / ワークスペース / 年",
    yearlyEquivalent: (approx: number): string =>
      `年払いで実質 US$${approx}/月`,
    subscriptionTitle: "サブスクリプション",
    statusMonthly: "Pro・月払い",
    statusYearly: "Pro・年払い",
    renewsOn: (date: string): string => `次回更新日: ${date}`,
    cancelsOn: (date: string): string =>
      `${date} に解約予定 — それまでProをご利用いただけます`,
    cancelsAtPeriodEnd:
      "現在の請求期間の終了時に解約予定 — それまでProをご利用いただけます",
    resume: "解約を取り消す",
    manageBilling: "請求とインボイスの管理",
    switchToYearly: (pct: number): string =>
      `年額プランに切り替え — ${pct}%お得`,
    switchConfirm: (price: number): string =>
      `年払い(US$${price}/年)に切り替えますか?差額は本日、日割りで請求されます。`,
    cancelSubscription: "サブスクリプションを解約",
    cancelConfirm:
      "Proサブスクリプションを解約しますか?お支払い済みの期間が終了するまでProをご利用いただけます。",
    retentionTitle: "解約の前に — 3ヶ月間50%オフ",
    retentionBody: (price: string): string =>
      `Proを継続すると、次の3回の月次請求が半額(${price}/月)になります。この特典は一度限りです。`,
    retentionAccept: "50%オフでProを継続",
    retentionDecline: "それでも解約する",
    retentionClose: "閉じる",
    demoNote:
      "このデプロイメントにはStripeが設定されていないため、プラン変更は即時に適用されます(デモモード)。",
    workspaceTitle: "ワークスペース",
    workspaceDesc:
      "ワークスペース名はダッシュボードのサイドバーと請求記録に表示されます。",
    workspaceNameLabel: "ワークスペース名",
    save: "保存",
    savedFallback: "保存しました。",
  },

  team: {
    metaTitle: "チーム — POCX",
    title: "チーム",
    intro:
      "チームメンバーはこのワークスペースのすべてのPoCを管理できます。メンバーの招待と無効化はオーナーのみが行えます。",
    inviteTitle: "チームメンバーを招待",
    inviteNote:
      "招待メールが届き、ワンタイムコードでログインできます — パスワードの設定は不要です。",
    memberNote:
      "チームメンバーの招待と無効化はワークスペースのオーナーのみが行えます。",
    emailLabel: "メールアドレス",
    nameLabel: "氏名(任意)",
    invite: "メンバーを招待",
    inviting: "招待中…",
    thEmail: "メールアドレス",
    thName: "氏名",
    thRole: "ロール",
    thAdded: "追加日時",
    thAddedBy: "追加者",
    thStatus: "ステータス",
    statusActive: "有効",
    statusDisabled: "無効",
    you: "（自分）",
    disable: "無効化",
    reEnable: "再有効化",
    saving: "保存中…",
    disableConfirm: (email: string) =>
      `${email} を無効化しますか?即座にログアウトされ、再有効化されるまでこのワークスペースにアクセスできなくなります。`,
  },

  poc: {
    common: {
      copy: "クリップボードにコピー",
      copied: "コピーしました",
      revealSecret: "シークレットを表示",
      hideSecret: "シークレットを非表示",
    },

    shell: {
      statusActive: "有効",
      statusPaused: "一時停止",
      openGateAria: "ホスト型ゲートを新しいタブで開く",
      sectionsAria: "PoCセクション",
    },

    tabs: {
      overview: "概要",
      evaluators: "評価者",
      sessions: "セッション",
      signatures: "署名",
      audit: "監査ログ",
      emails: "メール",
      terms: "利用規約",
      settings: "設定",
    },

    overview: {
      statActiveEvaluators: "有効な評価者",
      statLiveSessions: "有効セッション",
      statSignatures: "署名",
      statAuditEvents: "監査イベント",
      integrationTitle: "連携",
      integrationDesc:
        "保護対象アプリがPOCXと通信するために必要なもの一式 — キー、環境変数ファイル、2分で終わるセットアップ。",
      envFileBefore: "以下を ",
      envFileAfter: " に追加してください",
      setup: "セットアップ",
      agentTitle: "コーディングエージェント向け",
      agentCaption:
        "Claude Code / Codex / Cursor に貼り付けるだけで、残りはエージェントが行います。",
      gateTitle: "ホスト型ゲート",
      gateBefore: "評価者は ",
      gateAfter:
        " でログインします — 評価者側のセットアップは不要です。ゲートは許可リストを確認し、ワンタイムコードをメール送信し、アクセス利用規約への署名を取得したうえで、保護対象アプリへのセッションを発行します。",
      openGate: "ゲートを開く",
      chainNote:
        "ゲートはログインのたびに全チェーンを強制します: 許可リスト → OTP → 規約 → セッション。",
    },

    evaluators: {
      addTitle: "評価者を追加",
      allowlistNote:
        "許可リストに登録されたメールアドレスのみゲートでアクセスコードを取得できます。",
      seatsUsed: (used: number, max: string) =>
        `${max}シート中${used}シート使用中。`,
      seatNudge: (
        used: number,
        max: number,
        monthly: number,
        yearly: number,
      ): string =>
        `無料プランの評価者シート${max}枠のうち${used}枠を使用中です。Proなら上限なし — US$${monthly}/月 または US$${yearly}/年。`,
      seatNudgeCta: "プランを見る",
      upgradeCta: "Proにアップグレードして無制限に →",
      upgradeLink: "アップグレード →",
      emailLabel: "メールアドレス",
      nameLabel: "氏名(任意)",
      inviteCheckbox: "ゲートリンク付きの招待メールを送信",
      add: "評価者を追加",
      adding: "追加中…",
      sendInvite: "招待を送信",
      sendingInvite: "送信中…",
      emptyTitle: "評価者はまだいません",
      emptyHint:
        "このPoCにアクセスできる人を追加してください。それ以外はゲートで拒否されます。",
      thEmail: "メールアドレス",
      thName: "氏名",
      thStatus: "ステータス",
      thAdded: "追加日時",
      thAddedBy: "追加者",
      statusActive: "有効",
      statusDisabled: "無効",
      reEnable: "再有効化",
      disable: "無効化",
      saving: "保存中…",
    },

    sessions: {
      intro:
        "評価者のログインごとに無効化可能なセッションが作成されます。無効化すると次のリクエストから即座にアクセスが遮断されます — すでにアプリ内にいる場合も同様です。",
      revokeAll: "すべて無効化",
      revokeAllConfirm:
        "このPoCのすべての有効セッションを無効化しますか?すべての評価者は次のリクエストでログアウトされます。",
      revokedFallback: "セッションを無効化しました。",
      emptyTitle: "セッションはまだありません",
      emptyHint:
        "評価者がゲートでログインすると、ここにセッションが表示されます。",
      thEmail: "メールアドレス",
      thSignedIn: "ログイン日時",
      thLastActive: "最終アクティブ",
      thIp: "IP",
      thStatus: "ステータス",
      statusActive: "有効",
      statusIdle: "アイドル",
      statusExpired: "期限切れ",
      statusRevoked: "無効化済み",
      revoke: "無効化",
      revoking: "無効化中…",
    },

    signatures: {
      intro:
        "各レコードには表示された規約の全文、SHA-256ハッシュ、IPアドレス、ブラウザ情報が保存され、署名済みPDFは署名者にメール送信されています。",
      emptyTitle: "署名はまだありません",
      emptyHint:
        "評価者がゲートでアクセス利用規約に同意すると、ここに署名が表示されます。",
      thEmail: "メールアドレス",
      thVersion: "規約バージョン",
      thAccepted: "同意日時",
      thIp: "IP",
      thSignatureId: "署名ID",
      thHash: "ハッシュ",
      downloadPdf: "PDFをダウンロード",
    },

    audit: {
      lockedTitle: "監査ログはPro機能です",
      lockedBody:
        "OTPリクエスト、ログイン、拒否、規約への署名、セッション無効化、アプリ内アクセスイベントのすべてを、タイムスタンプ・IP・ユーザーエージェント付きで記録します。POCXは初日からすべて記録しており、アップグレードすると全履歴を閲覧できます。",
      lockedCta: (price: number) => `Proにアップグレード — US$${price}/月`,
      filterPlaceholder: "メール、詳細、パス、IPで絞り込み…",
      filterAria: "監査イベントを絞り込む",
      eventFilterAria: "イベント種別で絞り込む",
      allEvents: "すべてのイベント",
      count: (shown: number, total: number) =>
        `${total}件中${shown}件のイベント`,
      exportCsv: "CSVエクスポート",
      emptyTitle: "監査イベントはまだありません",
      emptyHint:
        "OTPリクエスト、ログイン、拒否、署名、アクセス判定が発生するたびにここに記録されます。",
      noMatchTitle: "該当するイベントがありません",
      noMatchHint: "別の検索語またはイベント種別をお試しください。",
      thTime: "日時",
      thEvent: "イベント",
      thEmail: "メールアドレス",
      thDetail: "詳細",
      thPath: "パス",
      thSource: "ソース",
      thIp: "IP",
    },

    emails: {
      mockNotice:
        "このPOCXデプロイメントには RESEND_API_KEY が設定されていないため、評価者宛のメール(アクセスコード、署名済み規約)は実際の受信箱ではなくここに届きます — デモに便利です。",
      emptyTitle: "メールはまだありません",
      emptyHint:
        "このPoCの評価者に送信されたアクセスコードや署名済み規約のメールがここに表示されます。",
      thTime: "日時",
      thTo: "宛先",
      thSubject: "件名",
      thBody: "本文",
      viewBody: "本文を表示",
    },

    terms: {
      editorTitle: "アクセス利用規約",
      editorDesc:
        "評価者はアプリに到達する前に、この規約への電子署名が必要です。",
      textLegend: "規約本文",
      templateOption: "標準テンプレート",
      templateRecommended: "(推奨)",
      templateDesc: "POCX標準の保護条項。PoCの詳細情報から自動入力されます。",
      customOption: "カスタムテキスト",
      customDesc:
        "独自の規約を作成できます — プレースホルダーも利用可能です。",
      placeholdersNote: "利用可能なプレースホルダー:",
      versionLabel: "バージョン",
      versionWarning:
        "バージョンを変更すると、すべての評価者は次回アクセス時に規約への再同意が必要になります。",
      revokeCheckbox: "すべての有効セッションも今すぐ無効化する",
      save: "規約を保存",
      saving: "保存中…",
      previewTitle: "ライブプレビュー",
      previewDesc:
        "現在ゲートで評価者に表示され、署名される内容そのままです。",
    },

    settings: {
      identityTitle: "基本情報とブランディング",
      identityDesc: "ゲートに表示され、アクセス利用規約にも反映されます。",
      nameLabel: "PoC名",
      ownerLabel: "オーナー事業者",
      regNoLabel: "オーナーの法人登録番号(任意)",
      clientLabel: "クライアント事業者(任意)",
      purposeLabel: "評価目的",
      purposePlaceholder:
        "例: 協業検討のための保険金査定トリアージワークフローの評価",
      supportEmailLabel: "サポートメール",
      brandColorLabel: "ブランドカラー",
      brandColorAria: "ブランドカラーを選択",
      appTitle: "保護対象アプリ",
      appDesc: "PoCの実体が稼働している場所です。",
      appUrlLabel: "アプリURL",
      callbackLabel: "コールバックパス",
      callbackHelp:
        "POCXが評価者をグラント付きでリダイレクトして戻す先です。SDKが自動的に処理します。",
      sessionTitle: "セッションポリシー",
      sessionDesc: "評価者のログイン状態を維持する期間です。",
      ttlLabel: "セッション有効期間(時間)",
      ttlHelp: "1回のログインあたりの上限。デフォルトは24。",
      idleLabel: "アイドルタイムアウト(時間)",
      idleHelp: "この時間操作がないとログアウトされます。デフォルトは3。",
      otpLabel: "コード有効期間(分)",
      otpHelp: "メール送信されたOTPの有効期間。デフォルトは10。",
      availabilityTitle: "公開状態",
      availabilityDesc:
        "一時停止すると、新規ログインとSDKによる検証の両方が即座にブロックされます。",
      statusLabel: "ステータス",
      statusActive: "有効",
      statusPaused: "一時停止",
      save: "保存",
      saving: "保存中…",
      savedFallback: "保存しました。",
      dangerTitle: "危険な操作",
      rotateTitle: "SDKシークレットのローテーション",
      rotateDesc:
        "現在の POCX_SECRET が無効になります。ローテーション後は保護対象アプリの環境変数を更新してください。",
      rotateButton: "シークレットをローテーション",
      rotateConfirm:
        "SDKシークレットをローテーションしますか?トークン交換を再開するには、保護対象アプリに新しい POCX_SECRET を設定する必要があります。",
      archiveTitle: "このPoCをアーカイブ",
      archiveDesc:
        "すべての有効セッションを無効化し、PoCをダッシュボードから非表示にします。",
      archiveButton: "PoCをアーカイブ",
      archiveConfirm:
        "このPoCをアーカイブしますか?すべての有効セッションが無効化され、PoCはダッシュボードに表示されなくなります。この操作はUIから元に戻せません。",
    },
  },
};

export const dashboardDict: Record<Locale, DashboardStrings> = { en, ja };

/** Narrow a raw route param to a supported locale (root layout 404s invalid ones). */
export function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
