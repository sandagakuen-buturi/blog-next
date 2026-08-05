import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RoleSelect } from "./role-select";
import { DepartmentSelect } from "./department-select";
import { UnbanButton } from "./unban-button";

export default async function AdminUsersPage() {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_ROLES);
  const canUnban = (actor.role.permissions & PERMISSIONS.CAN_BAN_BOARD_USER) !== 0n;

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
            {canUnban && <TableHead>掲示板</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <DepartmentSelect userId={user.id} currentDepartment={user.department} />
              </TableCell>
              <TableCell>
                <RoleSelect
                  userId={user.id}
                  currentRoleId={user.roleId}
                  roles={roles}
                  disabled={user.id === actor.id}
                />
              </TableCell>
              {canUnban && (
                <TableCell>
                  {user.boardBannedAt ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">BAN中</Badge>
                      <UnbanButton userId={user.id} />
                    </div>
                  ) : (
                    <Badge variant="outline">通常</Badge>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
