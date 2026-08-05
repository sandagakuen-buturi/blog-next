import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

export type WebhookScope = "IT" | "ROBOT" | "HYBRID" | "SYSTEM";

/** 指定scope(課 or システム全体通知)のDiscord Webhookへメッセージを送る。未設定なら何もしない。 */
export async function notifyDiscord(scope: WebhookScope, content: string): Promise<void> {
  const webhook = await prisma.discordWebhook.findUnique({ where: { scope } });
  if (!webhook) return;

  const url = decryptSecret(webhook.urlEncrypted);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    console.error(`[discord] webhook post to scope=${scope} failed: ${response.status}`);
  }
}
