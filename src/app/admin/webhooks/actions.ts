"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto";
import { PERMISSIONS } from "@/lib/permissions";

const setWebhookSchema = z.object({
  scope: z.enum(["IT", "ROBOT", "HYBRID", "SYSTEM"]),
  url: z.url(),
});

export async function setDiscordWebhook(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_WEBHOOKS);

  const parsed = setWebhookSchema.parse({
    scope: formData.get("scope"),
    url: formData.get("url"),
  });

  const existing = await prisma.discordWebhook.findUnique({ where: { scope: parsed.scope } });

  await prisma.discordWebhook.upsert({
    where: { scope: parsed.scope },
    update: { urlEncrypted: encryptSecret(parsed.url) },
    create: { scope: parsed.scope, urlEncrypted: encryptSecret(parsed.url) },
  });

  await recordAudit({
    actorId: actor.id,
    action: "WEBHOOK_UPDATE",
    targetType: "DiscordWebhook",
    targetId: parsed.scope,
    before: { existed: Boolean(existing) },
    after: { scope: parsed.scope },
  });

  revalidatePath("/admin/webhooks");
}
