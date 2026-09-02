import { createHash } from "node:crypto";
import type { PocRow } from "@/lib/db/schema";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

/**
 * Terms of Access — templated per PoC, fully customizable, per language.
 *
 * `termsMode = "template"` renders the standard template for the requested
 * language with the PoC's own variables; `termsMode = "custom"` uses the
 * operator-supplied text verbatim (after variable substitution, so custom
 * texts can still use the placeholders).
 *
 * The on-screen terms, the signed PDF and the stored hash are all derived
 * from the same resolved string, so the three are guaranteed identical.
 * Bumping `termsVersion` forces every evaluator to re-accept.
 *
 * Language is part of the evidence, not decoration: an evaluator signs the
 * text they were shown, so the acceptance row records which language that
 * was and hashes that exact string. A PoC never silently shows a language
 * it has no text for — `resolveTermsLocale` falls back to English, and the
 * gate tells the reader when that happens.
 */

export const TERMS_VARIABLES = [
  "POC_NAME",
  "OWNER_ENTITY",
  "OWNER_REG_NO",
  "CLIENT_ENTITY",
  "PURPOSE",
  "SUPPORT_EMAIL",
  "TERMS_VERSION",
] as const;

const EN_TEMPLATE = `{{POC_NAME}} — Proof of Concept: Terms of Access (Version {{TERMS_VERSION}})

This proof-of-concept application (the "PoC") was conceived, designed and developed by {{OWNER_ENTITY}}{{OWNER_REG_NO_CLAUSE}} and is made available to you{{CLIENT_ENTITY_CLAUSE}} solely for the purpose of {{PURPOSE}}.

By logging in and accepting these terms you acknowledge and agree that:

1. Confidential & proprietary. The PoC, together with its designs, workflows, concepts, methodologies, content and source code, is the confidential information and intellectual property of {{OWNER_ENTITY}}. It is disclosed to you in confidence and only for the evaluation purpose above.

2. Permitted use only. You may access and evaluate the PoC internally. You must not copy, reproduce, distribute, publish, or share access with anyone outside the approved recipients, nor use it to build, specify or procure a competing or derivative solution.

3. No reuse without engagement. If you or your organisation (whether directly or through any third party) develop, commission or implement any product, service or solution that is derived from, substantially based on, or that incorporates the PoC or the concepts embodied in it, you agree to engage {{OWNER_ENTITY}} in respect of that work on terms to be agreed in good faith. This reflects the value of {{OWNER_ENTITY}}'s contribution and is without prejudice to any separate agreement (including any NDA) between the parties.

4. No warranty. The PoC is provided "as is" for evaluation, without warranties of any kind, and must not be used for live or production purposes.

5. Electronic signature. You consent to your acceptance being recorded electronically, including the date and time, your email address, IP address and browser information, and a cryptographic hash of the exact terms shown to you. A copy of this record will be emailed to you.

If you do not agree, do not proceed. Contact {{OWNER_ENTITY}}{{SUPPORT_EMAIL_CLAUSE}} if you have questions about these terms.`;

const JA_TEMPLATE = `{{POC_NAME}} — 概念実証（PoC）アクセス利用規約（バージョン{{TERMS_VERSION}}）

本概念実証アプリケーション（以下「本PoC」といいます。）は、{{OWNER_ENTITY}}{{OWNER_REG_NO_CLAUSE}}が発案、設計および開発したものであり、{{PURPOSE}}という目的に限り、お客様{{CLIENT_ENTITY_CLAUSE}}に提供されます。

ログインのうえ本規約に同意することにより、お客様は以下の各号を確認し、これらに同意するものとします。

1. 秘密保持および知的財産権。本PoCは、そのデザイン、ワークフロー、コンセプト、方法論、コンテンツおよびソースコードを含め、{{OWNER_ENTITY}}の秘密情報であり、かつ知的財産です。本PoCは、秘密保持を前提として、上記の評価目的のためにのみ開示されます。

2. 許諾された利用に限定。お客様は、社内において本PoCにアクセスし、これを評価することができます。お客様は、承認された受領者以外の者に対して本PoCを複製、複写、頒布もしくは公開し、またはアクセス権を共有してはならず、競合するソリューションもしくは派生的なソリューションの開発、仕様策定または調達のために本PoCを利用してはなりません。

3. 契約によらない再利用の禁止。お客様または貴組織が（直接であるか第三者を通じてであるかを問わず）、本PoCもしくは本PoCに具現化されたコンセプトから派生し、これらに実質的に基づき、またはこれらを組み込んだ製品、サービスもしくはソリューションを開発、委託または導入する場合、お客様は、当該業務に関して、誠実な協議のうえ合意される条件により{{OWNER_ENTITY}}に発注することに同意します。本項は{{OWNER_ENTITY}}の貢献の価値を反映したものであり、当事者間の別途の合意（秘密保持契約を含みます。）を妨げるものではありません。

4. 無保証。本PoCは、評価の目的で「現状有姿」で提供されるものであり、明示黙示を問わずいかなる保証も伴いません。本番環境または実運用の目的で使用してはなりません。

5. 電子署名。お客様は、本規約への同意が、同意の日時、お客様のメールアドレス、IPアドレスおよびブラウザ情報、ならびに表示された規約本文の暗号学的ハッシュ値とともに電子的に記録されることに同意します。この記録の写しは、お客様宛にメールで送信されます。

本規約に同意されない場合は、手続を進めないでください。本規約についてご不明な点がある場合は、{{OWNER_ENTITY}}{{SUPPORT_EMAIL_CLAUSE}}までお問い合わせください。`;

/** The standard template per language. */
export const DEFAULT_TERMS_TEMPLATES: Record<Locale, string> = {
  en: EN_TEMPLATE,
  ja: JA_TEMPLATE,
};

/** The English template — the historical default. */
export const DEFAULT_TERMS_TEMPLATE = EN_TEMPLATE;

/** The operator's custom text for a language, if they wrote one. */
export function customTermsFor(poc: PocRow, locale: Locale): string | null {
  const text = locale === "ja" ? poc.termsCustomTextJa : poc.termsCustomText;
  return text?.trim() ? text : null;
}

/**
 * The language this PoC can actually be signed in.
 *
 * The standard template exists in every locale, so template-mode PoCs can
 * always honour the request. Custom-mode PoCs only offer a language the
 * operator has written text for — machine-translating someone's legal
 * terms is not something POCX will do — so those fall back to English.
 */
export function resolveTermsLocale(poc: PocRow, requested: Locale): Locale {
  if (requested === DEFAULT_LOCALE) return DEFAULT_LOCALE;
  if (poc.termsMode !== "custom") return requested;
  return customTermsFor(poc, requested) ? requested : DEFAULT_LOCALE;
}

/** Every language this PoC has terms text for. English is always present. */
export function availableTermsLocales(poc: PocRow): Locale[] {
  return poc.termsMode === "custom" && !customTermsFor(poc, "ja")
    ? ["en"]
    : ["en", "ja"];
}

/** Substitute {{VARS}} (and the derived *_CLAUSE composites) for a PoC. */
export function renderTerms(
  poc: PocRow,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const shown = resolveTermsLocale(poc, locale);
  const template =
    (poc.termsMode === "custom" ? customTermsFor(poc, shown) : null) ??
    DEFAULT_TERMS_TEMPLATES[shown];

  const short = shortName(poc.ownerEntity);
  const ja = shown === "ja";

  const vars: Record<string, string> = {
    POC_NAME: poc.name,
    OWNER_ENTITY: poc.ownerEntity,
    OWNER_REG_NO: poc.ownerRegNo ?? "",
    CLIENT_ENTITY: poc.clientEntity ?? "",
    // An operator-written purpose is their wording and is used verbatim in
    // both languages; only the fallback is localized.
    PURPOSE:
      poc.purpose?.trim() ||
      (ja
        ? `${poc.ownerEntity}との協業可能性の評価`
        : `evaluating a potential engagement with ${poc.ownerEntity}`),
    SUPPORT_EMAIL: poc.supportEmail ?? "",
    TERMS_VERSION: poc.termsVersion,
    // Composite clauses that gracefully disappear when a field is empty.
    OWNER_REG_NO_CLAUSE: ja
      ? poc.ownerRegNo
        ? `（以下「${short}」といいます。会社登記番号：${poc.ownerRegNo}）`
        : `（以下「${short}」といいます。）`
      : poc.ownerRegNo
        ? ` ("${short}", Company Registration No. ${poc.ownerRegNo})`
        : ` ("${short}")`,
    CLIENT_ENTITY_CLAUSE: ja
      ? poc.clientEntity
        ? `および${poc.clientEntity}`
        : "および貴組織"
      : poc.clientEntity
        ? ` and ${poc.clientEntity}`
        : " and your organisation",
    SUPPORT_EMAIL_CLAUSE: poc.supportEmail
      ? ja
        ? `（${poc.supportEmail}）`
        : ` at ${poc.supportEmail}`
      : "",
  };

  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) =>
    key in vars ? vars[key] : `{{${key}}}`,
  );
}

/** First two words of the entity name — used as the defined short name. */
function shortName(entity: string): string {
  return entity.split(/\s+/).slice(0, 2).join(" ");
}

/** SHA-256 hex of the exact resolved terms text — the evidentiary hash. */
export function termsHash(resolvedText: string): string {
  return createHash("sha256").update(resolvedText, "utf8").digest("hex");
}

/** Terms split into paragraphs for on-screen / PDF rendering. */
export function termsParagraphs(resolvedText: string): string[] {
  return resolvedText.split("\n\n").map((p) => p.trim());
}
