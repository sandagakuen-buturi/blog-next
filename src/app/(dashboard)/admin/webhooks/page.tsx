import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { WebhookForm } from "./webhook-form";

const SCOPES = [
  { value: "IT", label: "IT課" },
  { value: "ROBOT", label: "ロボット課" },
  { value: "HYBRID", label: "ハイブリッド" },
  { value: "SYSTEM", label: "システム全体通知(申請等)" },
] as const;

export default async function AdminWebhooksPage() {
  await requirePermission(PERMISSIONS.CAN_MANAGE_WEBHOOKS);

  const webhooks = await prisma.discordWebhook.findMany();
  const configuredScopes = new Set(webhooks.map((w) => w.scope));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Discord Webhook設定</h1>
        <p className="text-muted-foreground text-sm">
          URLはアプリ層で暗号化してDBに保存されます。設定後は画面上に平文で表示されません。
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {SCOPES.map((scope) => (
          <WebhookForm
            key={scope.value}
            scope={scope.value}
            label={scope.label}
            isConfigured={configuredScopes.has(scope.value)}
          />
        ))}
      </div>
    </main>
  );
}
