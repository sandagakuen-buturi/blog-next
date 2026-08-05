# Architecture

物理部ブログ / 部活動管理システムの設計ドキュメント。表向きはブログサイトだが、内部的には役職申請・物品申請・QA・掲示板を含む部活動管理システムとして機能する。

## スタック

| 領域 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router, `proxy.ts`, Server Actions) |
| DB | NeonDB (PostgreSQL) + Prisma |
| 認証 | Better-Auth (Google OAuth, `sandagakuen.ed.jp` ドメイン制限) |
| UI | shadcn/ui + Tailwind v4 |
| レート制限 | Upstash Redis (`@upstash/ratelimit`) |
| メール | Resend |
| チャット通知 | Discord Webhook(課ごと + システム通知用) |
| ファイルストレージ | 自前RustFS(S3互換, Cloudflare Tunnel経由で公開) |
| Markdown | `react-markdown`(`rehype-raw`不使用) |
| テスト | Vitest(権限/Visibility/承認フロー中心) + Playwright(主要導線) |

## 認証

- Better-AuthのGoogleプロバイダに`hd: "sandagakuen.ed.jp"`を設定してUXレベルでドメインを絞る。
- `hd`はクライアントが偽装できるヒントに過ぎないため、サインインコールバックで`email`のドメインをサーバー側で必ず再検証し、不一致ならセッションを発行しない。
- MFAは導入しない(Google側のセキュリティに委ねる)。セッション管理はBetter-Auth標準設定。
- `src/proxy.ts`(Next.js 16で`middleware.ts`から改名)はセッションクッキーの有無のみを見た楽観的リダイレクトに限定する。権限の正式判定は行わない。
- 認可の正式チェックは`src/lib/dal.ts`の`verifySession()`(React `cache()`でラップ)に一元化し、Server Component/Server Action/Route Handlerの全てがこれを経由する。レイアウトだけでの認可チェックはクライアント遷移で再実行されないため行わない。

## ロール・権限モデル

ロールは「階層レベル(数値による上下比較)」と「権限ビットフィールド」の二層構造。

```
Role {
  name: string          // "学生" 等。カスタムロールも同テーブル
  level: number         // 比較用の数値。学生=0 ... システム管理者=90
  permissions: bigint   // ビットフラグ(CAN_POST_BLOG, CAN_CREATE_BOARD 等)
  isCustom: boolean
}
```

- 「学生ロール以上」「課長以上」のような順序比較は`level`の数値比較で行う。
- 「ブログ投稿できるか」「掲示板の板を作れるか」等の機能可否は`permissions`のビット単位AND判定で行う。
- デフォルト9ロール(学生 / 物理部IT課員 / 物理部ロボット課員 / 物理部ハイブリッド / 課長 / 部長 / 顧問 / 教師 / システム管理者)を`prisma/seed.ts`でこの順序のlevel値とともにシードする。IT課員とロボット課員は同一のpermissions値を持つ。
- システム管理者は管理画面から任意のlevel・permissionsを持つカスタムロールを追加作成できる。
- ロールとは別軸で`department`(`IT` / `ROBOT` / `HYBRID` / null)をUserが持つ。「課」は権限レベルとは独立した所属情報。

## Visibilityエンジン(公開範囲の共通基盤)

ブログ記事・QA・掲示板の板・申請の承認者指定など、「誰が見れる/操作できるか」の判定を1つの共通モデルに集約する。

```
VisibilityPolicy {
  resourceType: "BLOG_POST" | "BOARD" | "QA_QUESTION" | ...
  resourceId: string
  scope: "PUBLIC_STUDENT" | "DEPARTMENT_ONLY" | "MEMBERS_ONLY" | "ROLE_LEVEL_GTE" | "SPECIFIC_USERS"
  minRoleLevel?: number       // scope=ROLE_LEVEL_GTE
  targetDepartment?: Department // scope=DEPARTMENT_ONLY
  targetUserIds?: string[]    // scope=SPECIFIC_USERS
}
```

判定関数`canView(user, resourceType, resourceId)`(`src/lib/visibility.ts`)がこのテーブルを参照し、全機能の閲覧チェックがこの1関数を経由する。ロール階層に変更が入っても判定ロジックは1箇所の修正で全機能に反映される。

## 申請ワークフローエンジン(汎用)

ロール昇格申請・物品申請など、承認フローが必要な「申請」を全て同じ仕組みで扱う。

```
ApplicationTemplate { name, fields(Json: フォーム項目定義), steps: ApprovalStep[] }
ApprovalStep        { order, approverType: "ROLE_LEVEL_GTE" | "SPECIFIC_USERS", minRoleLevel?, approverUserIds? }
Application          { templateId, applicantId, data(Json), status, currentStep, history: ApplicationDecision[] }
ApplicationDecision   { stepOrder, deciderId, decision: "APPROVE" | "REJECT" | "RETURN", comment? }
```

- 承認者はロール(階層レベル以上)指定・個人指定のどちらでも設定可能。
- ステップの承認者候補が複数人いる場合は早い者勝ち(最初に承認した人の決定が確定)。候補が0人の場合は申請を保留にし、システム管理者に通知する。
- 却下時、承認者は「却下して申請終了」か「差し戻して申請者に修正依頼」かをその場で選べる。差し戻しの場合、申請者は同じ申請を修正して再提出でき、フローは最初からやり直す。
- 通知はサイト内通知・Discord Webhook・Resendメールの3系統全てで自動送信する。

## ブログ

- 投稿できるのは物理部員のみ(課は問わない)。投稿は自分の所属課(IT/ロボット)のブログに紐づく。`department: HYBRID`の人は投稿時にIT課/ロボット課のどちらに投稿するかを選択する。
- 本文はMarkdownで記述。
- 記事ごとにVisibilityPolicyで公開範囲を設定できる(全体公開/所属課のみ/物理部員のみ/個別ユーザー指名)。閲覧の最低ラインは学生ロール以上。
- `publishedAt`に未来日時を設定すると予約投稿になる。公開判定は表示時に`publishedAt !== null && publishedAt <= now()`を見るだけで、バッチ処理は不要。
- コメント機能あり。1階層までの返信(ネスト)を許可。削除は投稿者本人・課長以上・システム管理者が可能。
- 投稿時、投稿先課に対応するDiscord Webhook(暗号化保存)へ通知する。

## QA

- Yahoo知恵袋の簡易版。閲覧は学生ロール以上に開放。質問・回答の投稿は物理部員のみ。
- ベストアンサー選択(質問者のみ)、質問へのタグ付けあり。

## 掲示板

- 2ch的なスレッド構造(板→スレッド→レス)だが、匿名は採用せず実名(アカウント名)表示。
- 板ごとにVisibilityPolicyで公開範囲を設定(部員のみ/学生に開放)。
- 板の作成は課長以上のみ。スレッド作成・レスは板の公開範囲を満たす人なら誰でも可能。

## 一括メール送信

- 送信できるのは課長以上。送信対象はロール/課/個別ユーザーの組み合わせで指定可能。
- Resend経由で送信。送信履歴(誰が・いつ・誰宛に・件名)を`EmailAudit`として記録する。

## セキュリティ

- **機密情報の暗号化**: Discord Webhook URL等はAES-256-GCMでアプリ層暗号化してDB保存。鍵は環境変数(`ENCRYPTION_KEY`)。復号はサーバー側のみで行い、クライアントには渡さない。
- **レート制限**: Upstash Redisでログイン・投稿・コメント・申請送信・一括メール等のエンドポイントにレート制限をかける。
- **Markdown/XSS対策**: `react-markdown`を`rehype-raw`なしで使用し、生HTML埋め込みを一切許可しない。共通ラッパー`<SafeMarkdown>`に集約し、`urlTransform`で`javascript:`等の危険URIスキームを除去する。
- **監査ログ**: ロール変更・申請承認/却下/差し戻し・Webhook URL変更・一括メール送信・掲示板BAN操作を`AuditLog`に記録(誰が・いつ・何を・変更前後の値)。閲覧はシステム管理者のみ。
- **Server Actions**: 全アクションはクライアント入力のIDを信頼せず、冒頭で`verifySession()`と権限/Visibility判定を必ず行う。ファイルアップロードは1MBのボディサイズ制限があるため、Route Handler(`route.ts`)経由でRustFS(S3互換)へ送る。
- **ファイルストレージ**: `@aws-sdk/client-s3`でRustFSのS3互換エンドポイント(Cloudflare Tunnel経由で公開)に接続。アクセスキー等も暗号化管理。

## Next.js 16 特有の注意点

- `middleware.ts`は廃止され`proxy.ts`(exportは`proxy`関数)を使う。
- `params`・`searchParams`・`cookies()`・`headers()`は全て非同期(Promise)。`await`が必須。
- Server Actionsはクライアント単位で逐次実行される。並列処理が必要な場合はアクション内部かRoute Handlerで行う。
- Server Actionsは公開POSTエンドポイントとして扱い、CSRF(Origin/Hostチェック)は組み込みだが認可チェックは自前で必ず行う。

## データモデル概要図

```
User --(roleId)--> Role
User --(department)--> Department(enum)

BlogPost --(department)--> Department
BlogPost --(authorId)--> User
Comment --(postId)--> BlogPost
Comment --(parentId)--> Comment(自己参照, 1階層まで)

VisibilityPolicy --(resourceType, resourceId)--> BlogPost | Board | QaQuestion | ...

ApplicationTemplate --< ApprovalStep
ApplicationTemplate --< Application --< ApplicationDecision

Board --< Thread --< Post
QaQuestion --< QaAnswer

DiscordWebhook(scope: IT/ROBOT/HYBRID/SYSTEM)
EmailAudit
AuditLog
```

## 実装フェーズ

1. 基盤構築(Prisma/NeonDB, Better-Auth, `proxy.ts`, shadcn/ui, ロールシード, DAL)
2. 権限・Visibility基盤
3. ブログ機能
4. 申請ワークフローエンジン
5. QA・掲示板
6. 一括メール・監査ログ画面
7. ファイルアップロード(RustFS)
8. セキュリティ仕上げ
9. テスト整備(Vitest中心 + Playwright主要導線)

詳細な実装計画は `/Users/tanahiro2010/.claude/plans/distributed-wobbling-island.md` を参照。
