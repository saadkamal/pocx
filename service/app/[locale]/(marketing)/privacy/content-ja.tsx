import Link from "next/link";
import { LegalPage, LegalSection, P, Bullets } from "../legal-primitives";

export function PrivacyContentJa() {
  return (
    <LegalPage
      eyebrow="法的情報"
      title="プライバシーポリシー"
      updated="最終更新日: 2026年7月9日"
      intro={
        <>
          本ポリシーは、<strong>pocx.dev</strong>のホスト型POCXサービスの運営者である
          <strong>Haxo Pty Ltd</strong>
          が、何をなぜ収集するかを説明するものです。要約すると、当社が収集するのはアクセス制御プロダクトに必要な最小限のもの（本人確認情報、署名、アクセスイベント）だけです。データを販売することはなく、広告トラッカーも使用しません。POCXをセルフホストする場合、ここに記載される情報が当社に届くことは一切ありません。本ポリシーは日英両言語で提供され、解釈に相違がある場合は英語版が優先されます。
        </>
      }
    >
      <LegalSection id="who-we-are" title="1. 運営者">
        <P>
          ホスト型POCXサービスは、オーストラリアの会社であるHaxo Pty
          Ltd（以下「Haxo」「当社」）が提供しています。プライバシーに関するお問い合わせは{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>{" "}
          までご連絡ください。
        </P>
      </LegalSection>

      <LegalSection id="two-roles" title="2. 2種類の利用者と、当社の2つの役割">
        <P>POCXは2つのグループのデータを扱い、それぞれで当社の役割が異なります。</P>
        <Bullets
          items={[
            <>
              <strong>オペレーター</strong>
              （ワークスペースのオーナーとチーム）:
              このデータの取り扱いは当社が決定します（データ管理者）。
            </>,
            <>
              <strong>閲覧者・評価者</strong>
              （デモを共有される相手）:
              当社はお客様の指示に基づき、処理者としてデータを処理します。閲覧者を招待する適法な根拠はお客様が確保してください。
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="what-we-collect" title="3. 収集する情報">
        <Bullets
          items={[
            <>
              <strong>オペレーターアカウント</strong> —
              氏名、メールアドレス、ワークスペース名、ワンタイムログインコード（ハッシュのみ保存。パスワードは存在しません）。
            </>,
            <>
              <strong>閲覧者の本人確認情報と署名</strong> —
              招待されたメールアドレス、OTPリクエストのメタデータ、各電子署名について規約本文のSHA-256ハッシュ、タイムスタンプ、IPアドレス、ユーザーエージェント、および署名者に送付するPDF証明書。この証拠こそがプロダクトであり、署名の防御力の源です。
            </>,
            <>
              <strong>アクセスイベント</strong> —
              ログイン、拒否、取り消し、（SDKイベントログを有効にした場合）保護対象アプリのページビューイベント。
            </>,
            <>
              <strong>決済情報</strong> —
              Stripeが処理します。当社がカード番号を見たり保存したりすることはありません。
            </>,
            <>
              <strong>運用ログ</strong> —
              セキュリティとデバッグのための短期間のサーバーログ（IP、ユーザーエージェント、リクエストパス）。
            </>,
          ]}
        />
        <P>
          当社は意図的に、お客様のデモの中身には一切関与しません。閲覧者がゲートを通過した後のトラフィックはお客様のアプリケーションに直接流れ、POCXを経由しません。
        </P>
      </LegalSection>

      <LegalSection id="how-we-use" title="4. 利用目的">
        <Bullets
          items={[
            "ゲートの運用: 本人確認、署名の記録、セッションとプラン制限の適用。",
            "トランザクションメールの送信（ログインコード、署名証明書、プロダクト通知）。同意なくマーケティングメールを送ることはありません。",
            "サービスの安全性の維持（レート制限、不正利用の防止）。",
            "Stripeを通じたProワークスペースの課金。",
          ]}
        />
        <P>個人情報を販売することはなく、広告目的にも使用しません。</P>
      </LegalSection>

      <LegalSection id="cookies" title="5. Cookie">
        <P>POCXが設定するのは機能性Cookieのみです。</P>
        <Bullets
          items={[
            "セッションCookie（HMAC署名付き）— オペレーターおよびゲートのログイン用。",
            "ロケールCookie（pocx_locale）— 言語設定の記憶用。",
          ]}
        />
        <P>分析用・広告用のCookieはありません。</P>
      </LegalSection>

      <LegalSection id="subprocessors" title="6. データに触れる外部事業者">
        <P>サービスの運営には少数の外部処理者を利用しています。</P>
        <Bullets
          items={[
            <>
              <strong>Railway</strong> —
              クラウドホスティング（アプリケーションとデータベース）
            </>,
            <>
              <strong>Resend</strong> —
              トランザクションメールの配信（ログインコード、証明書）およびサポート宛て受信メール
            </>,
            <>
              <strong>Stripe</strong> — 決済
            </>,
            <>
              <strong>MonGPT</strong> —
              マーケティングページのAIサポートチャット（チャットに入力されたメッセージを処理します。ホスト型ゲートやダッシュボードには設置されていません）。
            </>,
          ]}
        />
        <P>
          これらの事業者はオーストラリア国外（主に米国）でデータを保存することがあります。各事業者には業務に必要な情報のみを共有します。
        </P>
      </LegalSection>

      <LegalSection id="retention" title="7. 保存期間">
        <Bullets
          items={[
            "署名の証拠と監査イベントは、ワークスペースが存在する限り保持されます。これはお客様の保護が依拠する記録だからです。",
            "ワンタイムログインコードは数分で失効し、ハッシュのみ保存されます。",
            "運用ログは短期間保持され、ローテーションされます。",
            "ワークスペースを削除すると、そのデータは30日以内に本番システムから削除されます（バックアップは所定のスケジュールで消滅します）。",
          ]}
        />
      </LegalSection>

      <LegalSection id="security" title="8. セキュリティ">
        <P>
          ログインコードはハッシュ化・使い捨て・レート制限付き、セッションはHMAC署名付きで取り消し可能、アクセスはワークスペース単位に制限され、すべての変更操作で再確認されます。脆弱性のご報告は{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>{" "}
          まで（GitHubリポジトリのセキュリティポリシーもご覧ください）。
        </P>
      </LegalSection>

      <LegalSection id="your-rights" title="9. お客様の権利">
        <P>
          当社は、オーストラリア1988年プライバシー法（連邦法）およびオーストラリア・プライバシー原則（APPs）に従って個人情報を取り扱います。GDPRなどの法律が適用される場合、お客様はそれらの法律に基づく権利を有します。個人情報へのアクセス、訂正、エクスポート、削除のご請求は{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>{" "}
          までメールでお寄せください。あなたが他者のデモの閲覧者である場合、署名記録はワークスペースオーナーの指示に基づき存在するため、ご請求をオーナーに取り次ぐことがあります。
        </P>
      </LegalSection>

      <LegalSection id="self-host" title="10. セルフホスト">
        <P>
          オープンソース版をご自身のインフラで運用する場合、Haxoには何も送信されません。アカウントもテレメトリーも外部通信もありません。本ポリシーはpocx.devのホスト型サービスにのみ適用されます。
        </P>
      </LegalSection>

      <LegalSection id="changes" title="11. 変更">
        <P>
          サービスの発展に伴い本ポリシーを更新し、冒頭の日付を更新します。重要な変更はワークスペースのオーナーにメールでお知らせします。
        </P>
      </LegalSection>

      <LegalSection id="contact" title="12. お問い合わせ">
        <P>
          プライバシーに関するご質問・ご請求は{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>{" "}
          まで。あわせて
          <Link
            href="/ja/terms"
            className="font-semibold text-brand hover:underline"
          >
            利用規約
          </Link>
          もご覧ください。
        </P>
      </LegalSection>
    </LegalPage>
  );
}
