/**
 * Strings for the auth pages (operator login/signup) and the hosted
 * evaluator gate — UI copy, user-facing gate API messages and the
 * evaluator emails (OTP + signed terms).
 *
 * Pattern: `en` is the source of truth for the shape; `ja` must satisfy
 * exactly that shape, so a missing translation is a type error. Sentences
 * that wrap dynamic values (emails, PoC names, counts) are template
 * functions; sentences that wrap *elements* (a mailto link mid-sentence)
 * are split into ordered segments so Japanese word order works without
 * JSX gymnastics.
 */

import {
  detectLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "./locales";

const en = {
  /** Hosted gate chrome + login/terms/granted states. */
  gate: {
    layout: {
      /** Eyebrow after "{owner} · " above the card. */
      proofOfConcept: "Proof of Concept",
      trustFooter: "Protected by POCX — access is logged and terms-gated.",
      legalTerms: "Terms",
      legalPrivacy: "Privacy",
    },
    paused: {
      title: "This PoC is paused",
      body: (pocName: string) =>
        `${pocName} is not accepting evaluators right now.`,
      /** "…contact {owner}" — followed by the optional email segments. */
      contact: (owner: string) =>
        `If you believe this is a mistake, contact ${owner}`,
      /** Wraps the mailto link when a support email exists. */
      emailOpen: " at ",
      emailClose: "",
      contactEnd: ".",
    },
    granted: {
      title: "Access granted",
      /** Segments around the highlighted email address. */
      signedInBefore: "Signed in as ",
      signedInAfter: ". You have accepted the current Terms of Access.",
      openApp: (pocName: string) => `Open ${pocName}`,
      signOut: "Sign out",
    },
    login: {
      emailTitle: "Sign in to continue",
      emailIntro:
        "Enter your work email and we'll send you a one-time access code. Only invited evaluators can enter.",
      emailLabel: "Email address",
      emailPlaceholder: "you@company.com",
      sendCode: "Email me a code",
      sendingCode: "Sending code…",
      codeTitle: "Check your inbox",
      /** Segments around the highlighted email address. */
      codeSentBefore: "We sent a 6-digit code to ",
      codeSentAfter: ".",
      codeLabel: "Access code",
      verify: "Verify & continue",
      verifying: "Verifying…",
      useDifferentEmail: "Use a different email",
      resend: "Resend code",
      resendCooldown: (seconds: number) => `Resend code (${seconds}s)`,
      resendNotice: "A fresh code is on its way — check your inbox.",
      deniedTitle: "You're not on the access list",
      /** Segments: <email> + notOnList(pocName) + ask(owner) [+ email] + end */
      deniedNotOnList: (pocName: string) =>
        ` isn't on the access list for ${pocName}. `,
      deniedAsk: (owner: string) => `Ask ${owner} to invite you`,
      deniedEmailOpen: " — you can reach them at ",
      deniedEmailClose: "",
      deniedEnd: ".",
      deniedTryDifferent: "Try a different email",
    },
    terms: {
      title: "Terms of Access",
      intro: (pocName: string) =>
        `One last step before you can open ${pocName}: please read and accept the terms below.`,
      consent:
        "I have read and agree to these Terms of Access. I understand that typing my name below constitutes my electronic signature, recorded with my email, timestamp, IP address and a hash of these terms, and that a signed copy will be emailed to me.",
      nameLabel: "Sign by typing your full name",
      namePlaceholder: "Ada Lovelace",
      signatureLabel: "Signature",
      agree: "Sign & continue",
      recording: "Recording your signature…",
    },
  },

  /** Operator auth pages (login/signup). */
  auth: {
    login: {
      metaTitle: "Log in — POCX",
      metaDescription: "Log in to your POCX workspace.",
      title: "Log in",
      emailHint: "We'll email you a one-time code — no password to remember.",
      codeSent: (email: string) => `We sent a 6-digit code to ${email}.`,
      workEmail: "Work email",
      emailPlaceholder: "you@company.com",
      sendCode: "Email me a code",
      sendingCode: "Sending code…",
      codeLabel: "6-digit code",
      submit: "Log in",
      verifying: "Verifying…",
      useDifferentEmail: "← Use a different email",
      resend: "Resend code",
      resendIn: (seconds: number) => `Resend in ${seconds}s`,
      noAccount: "No account?",
      startFree: "Start free",
      startFreeArrow: "Start free →",
    },
    signup: {
      metaTitle: "Sign up — POCX",
      metaDescription: "Protect your proof of concept in minutes.",
      tagline: "Protect your proof of concept in minutes.",
      title: "Create your workspace",
      detailsHint:
        "Free to start — we'll email you a one-time code to confirm.",
      codeSent: (email: string) => `We sent a 6-digit code to ${email}.`,
      yourName: "Your name",
      namePlaceholder: "Ada Lovelace",
      workspaceName: "Workspace / company name",
      workspacePlaceholder: "Acme Labs",
      workEmail: "Work email",
      emailPlaceholder: "you@company.com",
      continue: "Continue",
      sendingCode: "Sending code…",
      codeLabel: "6-digit code",
      submit: "Create workspace",
      verifying: "Verifying…",
      editDetails: "← Edit details",
      resend: "Resend code",
      resendIn: (seconds: number) => `Resend in ${seconds}s`,
      haveAccount: "Already have an account?",
      logIn: "Log in",
      logInArrow: "Log in →",
      /** Segments around the terms/privacy links under the form. */
      agreePrefix: "By continuing you agree to our ",
      agreeTerms: "Terms of Service",
      agreeAnd: " and ",
      agreePrivacy: "Privacy Policy",
      agreeSuffix: ".",
    },
  },

  /** Client-side fallbacks when the server gives no message. */
  errors: {
    generic: "Something went wrong. Please try again.",
    network: "Network error — check your connection and try again.",
    tooManyRequests: "Too many requests. Try again in a few minutes.",
  },

  /** User-facing messages returned by the /api/gate/[slug]/* routes. */
  api: {
    paused: "This PoC is currently paused. Contact the owner for access.",
    nameRequired: "Please type your full name to sign (2–120 characters).",
    tooManyRequests: "Too many requests. Try again in a few minutes.",
    tooManyAttempts: "Too many attempts. Try again in a few minutes.",
    codeSent: "Code sent — check your inbox.",
    invalidOrExpired: "Invalid or expired code.",
    codeUsedOrExpired:
      "That code has expired or was already used — tap 'Resend code' for a fresh one.",
    noActiveCode:
      "No active code for this email — it may have expired. Request a new one.",
    codeSuperseded:
      "That code is from an earlier email and has been replaced — use the code from the most recent email we sent you.",
    codeLocked:
      "Too many wrong attempts — that code is now locked. Tap 'Resend code' for a fresh one.",
    attemptsLeft: (left: number) =>
      `That code didn't work — ${left} attempt${left === 1 ? "" : "s"} left before it locks.`,
  },

  /** Evaluator emails (subjects + bodies). */
  email: {
    otp: {
      subject: (code: string, pocName: string) =>
        `${code} is your ${pocName} access code`,
      text: (p: {
        code: string;
        pocName: string;
        minutes: number;
        ownerEntity: string;
      }) =>
        `Your ${p.pocName} access code is: ${p.code}\n\nIt expires in ${p.minutes} minutes and replaces any earlier code we sent you. If you did not request this, you can ignore this email.\n\n— ${p.ownerEntity}, via POCX`,
      html: (p: {
        code: string;
        pocName: string;
        minutes: number;
        ownerEntity: string;
      }) =>
        `<p>Your <strong>${p.pocName}</strong> access code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${p.code}</p><p>It expires in ${p.minutes} minutes and <strong>replaces any earlier code</strong> we sent you. If you did not request this, you can ignore this email.</p><p style="color:#6e6e7a">— ${p.ownerEntity}, via POCX</p>`,
    },
    signedTerms: {
      subject: (pocName: string) =>
        `${pocName} — your signed Terms of Access`,
      text: (p: {
        pocName: string;
        termsVersion: string;
        signatureId: string;
        acceptedAtUtc: string;
        ip: string;
        hash: string;
        ownerEntity: string;
      }) =>
        `Thank you. Your acceptance of the ${p.pocName} Terms of Access (version ${p.termsVersion}) has been recorded.\n\nSignature id: ${p.signatureId}\nAccepted at (UTC): ${p.acceptedAtUtc}\nIP address: ${p.ip}\nTerms hash (SHA-256): ${p.hash}\n\nA signed PDF copy is attached for your records.\n\n— ${p.ownerEntity}, via POCX`,
      html: (p: {
        pocName: string;
        termsVersion: string;
        signatureId: string;
        acceptedAtUtc: string;
        ip: string;
        hash: string;
        ownerEntity: string;
      }) =>
        `<p>Thank you. Your acceptance of the ${p.pocName} <strong>Terms of Access</strong> (version ${p.termsVersion}) has been recorded.</p><ul><li>Signature id: <code>${p.signatureId}</code></li><li>Accepted at (UTC): ${p.acceptedAtUtc}</li><li>IP address: ${p.ip}</li><li>Terms hash (SHA-256): <code>${p.hash}</code></li></ul><p>A signed PDF copy is attached for your records.</p><p style="color:#6e6e7a">— ${p.ownerEntity}, via POCX</p>`,
    },
  },
};

type GateStrings = typeof en;

const ja: GateStrings = {
  gate: {
    layout: {
      proofOfConcept: "概念実証（PoC）",
      trustFooter:
        "POCXで保護されています — アクセスは記録され、規約への同意が必要です。",
      legalTerms: "利用規約",
      legalPrivacy: "プライバシー",
    },
    paused: {
      title: "このPoCは一時停止中です",
      body: (pocName: string) =>
        `${pocName}は現在、評価者の受け付けを停止しています。`,
      contact: (owner: string) =>
        `お心当たりのない場合は、${owner}`,
      emailOpen: "（",
      emailClose: "）",
      contactEnd: "までお問い合わせください。",
    },
    granted: {
      title: "アクセスが許可されました",
      signedInBefore: "",
      signedInAfter:
        " としてサインインしています。現在の利用規約に同意済みです。",
      openApp: (pocName: string) => `${pocName}を開く`,
      signOut: "サインアウト",
    },
    login: {
      emailTitle: "サインインして続行",
      emailIntro:
        "勤務先のメールアドレスを入力してください。ワンタイムアクセスコードをお送りします。ご利用いただけるのは招待された評価者の方のみです。",
      emailLabel: "メールアドレス",
      emailPlaceholder: "you@company.com",
      sendCode: "コードをメールで受け取る",
      sendingCode: "コードを送信中…",
      codeTitle: "メールをご確認ください",
      codeSentBefore: "",
      codeSentAfter: " 宛てに6桁のコードを送信しました。",
      codeLabel: "アクセスコード",
      verify: "確認して続行",
      verifying: "確認中…",
      useDifferentEmail: "別のメールアドレスを使う",
      resend: "コードを再送",
      resendCooldown: (seconds: number) => `コードを再送（${seconds}秒）`,
      resendNotice: "新しいコードを送信しました。メールをご確認ください。",
      deniedTitle: "アクセスリストに登録されていません",
      deniedNotOnList: (pocName: string) =>
        ` は${pocName}のアクセスリストに登録されていません。`,
      deniedAsk: (owner: string) => `${owner}に招待をご依頼ください`,
      deniedEmailOpen: "（連絡先: ",
      deniedEmailClose: "）",
      deniedEnd: "。",
      deniedTryDifferent: "別のメールアドレスで試す",
    },
    terms: {
      title: "利用規約（Terms of Access）",
      intro: (pocName: string) =>
        `${pocName}をご利用いただく前に、以下の利用規約をお読みのうえご同意ください。`,
      consent:
        "私はこの利用規約を読み、内容に同意します。下に氏名を入力することが電子署名となり、メールアドレス、日時、IPアドレス、規約ハッシュとともに記録され、署名済みの控えがメールで送付されることを了承します。",
      nameLabel: "氏名を入力して署名",
      namePlaceholder: "山田 花子",
      signatureLabel: "署名",
      agree: "署名して続行",
      recording: "署名を記録しています…",
    },
  },

  auth: {
    login: {
      metaTitle: "ログイン — POCX",
      metaDescription: "POCXワークスペースにログインします。",
      title: "ログイン",
      emailHint:
        "ワンタイムコードをメールでお送りします。パスワードは不要です。",
      codeSent: (email: string) =>
        `${email} 宛てに6桁のコードを送信しました。`,
      workEmail: "勤務先メールアドレス",
      emailPlaceholder: "you@company.com",
      sendCode: "コードをメールで受け取る",
      sendingCode: "コードを送信中…",
      codeLabel: "6桁のコード",
      submit: "ログイン",
      verifying: "確認中…",
      useDifferentEmail: "← 別のメールアドレスを使う",
      resend: "コードを再送",
      resendIn: (seconds: number) => `再送まで${seconds}秒`,
      noAccount: "アカウントをお持ちでない場合",
      startFree: "無料で始める",
      startFreeArrow: "無料で始める →",
    },
    signup: {
      metaTitle: "新規登録 — POCX",
      metaDescription: "数分でPoC（概念実証）を保護できます。",
      tagline: "数分でPoCを保護できます。",
      title: "ワークスペースを作成",
      detailsHint:
        "無料で始められます。確認用のワンタイムコードをメールでお送りします。",
      codeSent: (email: string) =>
        `${email} 宛てに6桁のコードを送信しました。`,
      yourName: "お名前",
      namePlaceholder: "山田 花子",
      workspaceName: "ワークスペース／会社名",
      workspacePlaceholder: "Acme株式会社",
      workEmail: "勤務先メールアドレス",
      emailPlaceholder: "you@company.com",
      continue: "続行",
      sendingCode: "コードを送信中…",
      codeLabel: "6桁のコード",
      submit: "ワークスペースを作成",
      verifying: "確認中…",
      editDetails: "← 入力内容を修正",
      resend: "コードを再送",
      resendIn: (seconds: number) => `再送まで${seconds}秒`,
      haveAccount: "すでにアカウントをお持ちの場合",
      logIn: "ログイン",
      logInArrow: "ログイン →",
      agreePrefix: "続行することで、",
      agreeTerms: "利用規約",
      agreeAnd: "と",
      agreePrivacy: "プライバシーポリシー",
      agreeSuffix: "に同意したものとみなされます。",
    },
  },

  errors: {
    generic: "エラーが発生しました。もう一度お試しください。",
    network:
      "ネットワークエラーが発生しました。接続をご確認のうえ、もう一度お試しください。",
    tooManyRequests:
      "リクエストが多すぎます。数分おいてからもう一度お試しください。",
  },

  api: {
    paused:
      "このPoCは現在一時停止中です。アクセスについては提供元にお問い合わせください。",
    nameRequired: "署名として氏名を入力してください（2〜120文字）。",
    tooManyRequests:
      "リクエストが多すぎます。数分おいてからもう一度お試しください。",
    tooManyAttempts:
      "試行回数が多すぎます。数分おいてからもう一度お試しください。",
    codeSent: "コードを送信しました。メールをご確認ください。",
    invalidOrExpired: "コードが無効か、有効期限が切れています。",
    codeUsedOrExpired:
      "そのコードは有効期限切れか、すでに使用されています。「コードを再送」から新しいコードを取得してください。",
    noActiveCode:
      "このメールアドレスに有効なコードがありません（有効期限切れの可能性があります）。新しいコードをリクエストしてください。",
    codeSuperseded:
      "そのコードは以前のメールのもので、すでに新しいコードに置き換えられています。最新のメールに記載されたコードをご利用ください。",
    codeLocked:
      "誤入力が続いたため、このコードはロックされました。「コードを再送」から新しいコードを取得してください。",
    attemptsLeft: (left: number) =>
      `コードが一致しません。あと${left}回間違えるとロックされます。`,
  },

  email: {
    otp: {
      subject: (code: string, pocName: string) =>
        `${code} — ${pocName} アクセスコード`,
      text: (p: {
        code: string;
        pocName: string;
        minutes: number;
        ownerEntity: string;
      }) =>
        `${p.pocName}のアクセスコードは次のとおりです: ${p.code}\n\nこのコードの有効期限は${p.minutes}分です。以前にお送りしたコードは無効になります。このメールにお心当たりがない場合は、破棄していただいて構いません。\n\n— ${p.ownerEntity}（POCX経由）`,
      html: (p: {
        code: string;
        pocName: string;
        minutes: number;
        ownerEntity: string;
      }) =>
        `<p><strong>${p.pocName}</strong>のアクセスコードは次のとおりです。</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${p.code}</p><p>このコードの有効期限は${p.minutes}分です。<strong>以前にお送りしたコードは無効になります</strong>。このメールにお心当たりがない場合は、破棄していただいて構いません。</p><p style="color:#6e6e7a">— ${p.ownerEntity}（POCX経由）</p>`,
    },
    signedTerms: {
      subject: (pocName: string) =>
        `${pocName} — 署名済み利用規約（Terms of Access）`,
      text: (p: {
        pocName: string;
        termsVersion: string;
        signatureId: string;
        acceptedAtUtc: string;
        ip: string;
        hash: string;
        ownerEntity: string;
      }) =>
        `ありがとうございます。${p.pocName}の利用規約（Terms of Access、バージョン${p.termsVersion}）への同意が記録されました。\n\n署名ID: ${p.signatureId}\n同意日時（UTC）: ${p.acceptedAtUtc}\nIPアドレス: ${p.ip}\n規約ハッシュ（SHA-256）: ${p.hash}\n\n署名済みPDFの控えを添付しています。お手元に保管してください。\n\n— ${p.ownerEntity}（POCX経由）`,
      html: (p: {
        pocName: string;
        termsVersion: string;
        signatureId: string;
        acceptedAtUtc: string;
        ip: string;
        hash: string;
        ownerEntity: string;
      }) =>
        `<p>ありがとうございます。${p.pocName}の<strong>利用規約（Terms of Access）</strong>（バージョン${p.termsVersion}）への同意が記録されました。</p><ul><li>署名ID: <code>${p.signatureId}</code></li><li>同意日時（UTC）: ${p.acceptedAtUtc}</li><li>IPアドレス: ${p.ip}</li><li>規約ハッシュ（SHA-256）: <code>${p.hash}</code></li></ul><p>署名済みPDFの控えを添付しています。お手元に保管してください。</p><p style="color:#6e6e7a">— ${p.ownerEntity}（POCX経由）</p>`,
    },
  },
};

export const gateDict: Record<Locale, GateStrings> = { en, ja };
export type { GateStrings };

/**
 * Locale for a gate API response: explicit cookie choice first, then the
 * Accept-Language header, then English. Typed structurally so this module
 * stays importable from client components (no next/server dependency).
 */
export function gateRequestLocale(req: {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
}): Locale {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return detectLocale(req.headers.get("accept-language"));
}
