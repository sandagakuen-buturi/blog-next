import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { resolveApprovers } from "@/lib/approval";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "審査中",
  APPROVED: "承認済み",
  REJECTED: "却下",
  RETURNED: "差し戻し",
};

export default async function ApplicationsPage() {
  const user = await verifySession();

  const [templates, myApplications, pendingApplications] = await Promise.all([
    prisma.applicationTemplate.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.application.findMany({
      where: { applicantId: user.id },
      include: { template: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      where: { status: "PENDING" },
      include: { template: { include: { steps: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const myPendingDecisions = [];
  for (const application of pendingApplications) {
    const step = application.template.steps.find((s) => s.order === application.currentStep);
    if (!step) continue;
    const approvers = await resolveApprovers(step);
    if (approvers.some((a) => a.id === user.id)) {
      myPendingDecisions.push(application);
    }
  }

  const canManageTemplates = (user.role.permissions & PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES) !== 0n;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">申請</h1>
        {canManageTemplates && (
          <Link href="/applications/templates" className="text-sm hover:underline">
            テンプレート管理
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">新しく申請する</h2>
        <ul className="flex flex-col gap-2">
          {templates.map((template) => (
            <li key={template.id}>
              <Link href={`/applications/new/${template.id}`} className="hover:underline">
                {template.name}
              </Link>
            </li>
          ))}
          {templates.length === 0 && (
            <p className="text-muted-foreground text-sm">申請テンプレートがまだありません。</p>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">あなたの承認待ちの申請</h2>
        <ul className="flex flex-col gap-2">
          {myPendingDecisions.map((application) => (
            <li key={application.id} className="flex items-center gap-2">
              <Link href={`/applications/${application.id}`} className="hover:underline">
                {application.template.name}
              </Link>
              <Badge variant="outline">審査中</Badge>
            </li>
          ))}
          {myPendingDecisions.length === 0 && (
            <p className="text-muted-foreground text-sm">現在承認待ちの申請はありません。</p>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">自分が提出した申請</h2>
        <ul className="flex flex-col gap-2">
          {myApplications.map((application) => (
            <li key={application.id} className="flex items-center gap-2">
              <Link href={`/applications/${application.id}`} className="hover:underline">
                {application.template.name}
              </Link>
              <Badge variant="outline">{STATUS_LABELS[application.status]}</Badge>
            </li>
          ))}
          {myApplications.length === 0 && (
            <p className="text-muted-foreground text-sm">まだ申請したことはありません。</p>
          )}
        </ul>
      </section>
    </main>
  );
}
