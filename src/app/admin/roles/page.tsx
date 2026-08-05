import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateRoleForm } from "./create-role-form";

export default async function AdminRolesPage() {
  await requirePermission(PERMISSIONS.CAN_MANAGE_ROLES);

  const roles = await prisma.role.findMany({ orderBy: { level: "asc" } });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">ロール管理</h1>
        <p className="text-muted-foreground text-sm">
          階層レベル(数値の大小で「◯◯以上」を判定)と権限ビット(可否判定)を持つロール一覧です。
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ロール名</TableHead>
            <TableHead>レベル</TableHead>
            <TableHead>種別</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell>{role.level}</TableCell>
              <TableCell>
                <Badge variant={role.isCustom ? "secondary" : "outline"}>
                  {role.isCustom ? "カスタム" : "デフォルト"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">カスタムロールを作成</h2>
        <CreateRoleForm />
      </div>
    </main>
  );
}
