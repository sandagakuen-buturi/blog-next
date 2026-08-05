import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

export type WebhookScope = "IT" | "ROBOT" | "HYBRID" | "SYSTEM";

// Discord embed descriptionの上限は4096文字。URL行やコードフェンス分の余白を残す。
const MAX_EMBED_DESCRIPTION = 4096;
const MAX_RAW_SOURCE_LENGTH = 3500;

export type DiscordNotification = {
  /** 通知の見出し文(例: "📝 新しいブログ投稿: **タイトル**\n投稿者: 名前")。 */
  content: string;
  /** 対象リソースの閲覧URL。埋め込みリンクとして表示する。 */
  url?: string;
  /** 本文のrawソース(Markdown等)。長い場合は自動的に切り詰める。 */
  rawSource?: string;
};

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n…(以下省略)`;
}

function buildEmbedDescription(url?: string, rawSource?: string): string | undefined {
  const parts: string[] = [];
  if (url) parts.push(`🔗 ${url}`);
  if (rawSource) {
    const budget = MAX_EMBED_DESCRIPTION - (parts[0]?.length ?? 0) - 20;
    const truncated = truncate(rawSource, Math.min(MAX_RAW_SOURCE_LENGTH, Math.max(budget, 0)));
    parts.push(`\`\`\`\n${truncated}\n\`\`\``);
  }
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

/** 指定scope(課 or システム全体通知)のDiscord Webhookへメッセージを送る。未設定なら何もしない。 */
export async function notifyDiscord(
  scope: WebhookScope,
  notification: string | DiscordNotification,
): Promise<void> {
  const webhook = await prisma.discordWebhook.findUnique({ where: { scope } });
  if (!webhook) return;

  const { content, url, rawSource } =
    typeof notification === "string" ? { content: notification } : notification;

  const description = buildEmbedDescription(url, rawSource);

  const webhookUrl = decryptSecret(webhook.urlEncrypted);
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      embeds: description ? [{ description }] : undefined,
    }),
  });

  if (!response.ok) {
    console.error(`[discord] webhook post to scope=${scope} failed: ${response.status}`);
  }
}
