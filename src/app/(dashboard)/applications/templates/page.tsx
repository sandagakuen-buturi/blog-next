import Link from "next/link";
import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TemplateForm } from "./template-form";

export default async function ApplicationTemplatesPage() {
  await requirePermission(PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES);

  const [templates, roles] = await Promise.all([
    prisma.applicationTemplate.findMany({
      include: { steps: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({ orderBy: { level: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">申請テンプレート管理</h1>
        <p className="text-muted-foreground text-sm">
          入力項目と承認フロー(段階ごとの承認者)を定義します。
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>テンプレート名</TableHead>
            <TableHead>承認段階数</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>{template.steps.length}</TableCell>
              <TableCell>
                <Link
                  href={`/applications/new/${template.id}`}
                  className="text-sm hover:underline"
                >
                  この内容で申請する
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">新規テンプレート作成</h2>
        <TemplateForm roles={roles} />
      </div>
    </main>
  );
}
