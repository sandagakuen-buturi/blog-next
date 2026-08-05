import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleSelect } from "./role-select";

export default async function AdminUsersPage() {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_ROLES);

  const [users, roles] = await Promise.all([
    prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "asc" } }),
    prisma.role.findMany({ orderBy: { level: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">ユーザー管理</h1>
        <p className="text-muted-foreground text-sm">
          各ユーザーのロールを変更できます(変更は監査ログに記録されます)。
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>課</TableHead>
            <TableHead>ロール</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.department ?? "-"}</TableCell>
              <TableCell>
                <RoleSelect
                  userId={user.id}
                  currentRoleId={user.roleId}
                  roles={roles}
                  disabled={user.id === actor.id}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
