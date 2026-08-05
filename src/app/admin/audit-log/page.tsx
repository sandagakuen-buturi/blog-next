import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { AuditLogTable } from "./audit-log-table";

export default async function AuditLogPage() {
  await requirePermission(PERMISSIONS.CAN_VIEW_AUDIT_LOG);

  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">監査ログ</h1>
        <p className="text-muted-foreground text-sm">
          システム管理者のみ閲覧可能です。行をクリックすると詳細が表示されます。
        </p>
      </div>

      <AuditLogTable logs={logs} />
    </main>
  );
}
