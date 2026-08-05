import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BulkEmailForm } from "./bulk-email-form";

export default async function BulkEmailPage() {
  await requirePermission(PERMISSIONS.CAN_SEND_BULK_EMAIL);

  const [roles, history] = await Promise.all([
    prisma.role.findMany({ orderBy: { level: "asc" } }),
    prisma.emailAudit.findMany({
      include: { sender: true },
      orderBy: { sentAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">一括メール送信</h1>
        <p className="text-muted-foreground text-sm">
          ロール・課・個別ユーザーを組み合わせて送信対象を指定できます。送信履歴は監査ログに記録されます。
        </p>
      </div>

      <BulkEmailForm roles={roles} />

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">送信履歴</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>送信者</TableHead>
              <TableHead>件名</TableHead>
              <TableHead>宛先数</TableHead>
              <TableHead>送信日時</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.sender.name}</TableCell>
                <TableCell>{entry.subject}</TableCell>
                <TableCell>{entry.recipients.length}</TableCell>
                <TableCell>{entry.sentAt.toLocaleString("ja-JP")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
