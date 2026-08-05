#!/usr/bin/env bash
# 開発環境のセットアップスクリプト。
# 使い方: bun run setup (または直接 ./scripts/setup.sh)
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v bun >/dev/null 2>&1; then
  echo "エラー: bun が見つかりません。https://bun.sh からインストールしてください。" >&2
  exit 1
fi

echo "== 依存パッケージをインストール =="
bun install

if [ ! -f .env ]; then
  echo "== .env を .env.example からコピー =="
  cp .env.example .env
  echo "  → .env に各種シークレット(DATABASE_URL, GOOGLE_CLIENT_ID 等)を設定してから再実行してください。"
  exit 0
fi

if ! grep -q '^DATABASE_URL="postgresql://.\+"$' .env || grep -q '^DATABASE_URL=""$' .env; then
  echo "エラー: .env の DATABASE_URL が未設定です。NeonDBの接続文字列を設定してください。" >&2
  exit 1
fi

echo "== BETTER_AUTH_SECRET / ENCRYPTION_KEY の未設定チェック =="
for key in BETTER_AUTH_SECRET ENCRYPTION_KEY; do
  if grep -q "^${key}=\"\"$" .env; then
    generated=$(openssl rand -base64 32)
    # macOS/BSD sed と GNU sed の両方で動くよう、一時ファイル経由で置換する。
    sed "s|^${key}=\"\"$|${key}=\"${generated}\"|" .env > .env.tmp && mv .env.tmp .env
    echo "  → ${key} をランダム生成して設定しました。"
  fi
done

echo "== Prisma Client を生成 =="
bunx prisma generate

echo "== マイグレーションを適用 =="
bunx prisma migrate deploy

echo "== デフォルトロールをシード =="
bun run db:seed

cat <<'EOF'

セットアップ完了です。残りの手動設定:
  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (Google Cloud Console)
    リダイレクトURI: http://localhost:3000/api/auth/callback/google
  - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (レート制限、任意)
  - RESEND_API_KEY (一括メール・申請通知メール、任意)
  - S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_BUCKET
    (画像・添付ファイル用のS3互換ストレージ。CORSでこのアプリのオリジンからの
    GET/PUTを許可すること)

設定後、`bun run dev` で起動してください。
EOF
