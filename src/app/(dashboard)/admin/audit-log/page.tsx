import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { AuditLogTable } from "./audit-log-table";
import { PaginationControls, resolvePage } from "@/components/pagination-controls";

const PAGE_SIZE = 200;

export default async function AuditLogPage(props: PageProps<"/admin/audit-log">) {
  await requirePermission(PERMISSIONS.CAN_VIEW_AUDIT_LOG);

  const total = await prisma.auditLog.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = resolvePage((await props.searchParams).page, totalPages);

  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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

      <PaginationControls currentPage={page} totalPages={totalPages} />
    </main>
  );
}
