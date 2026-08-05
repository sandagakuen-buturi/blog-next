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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">申請</h1>
          <p className="text-muted-foreground mt-1 text-sm">提出・承認・テンプレートを管理</p>
        </div>
        {canManageTemplates && (
          <Link href="/applications/templates" className="text-primary text-sm font-medium hover:underline">
            テンプレート管理
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs">
        <h2 className="text-base font-semibold tracking-tight">新しく申請する</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {templates.map((template) => (
            <li key={template.id}>
              <Link href={`/applications/new/${template.id}`} className="block rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:border-primary/25 hover:bg-muted/40">
                {template.name}
              </Link>
            </li>
          ))}
          {templates.length === 0 && (
            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-sm sm:col-span-2">
              申請テンプレートがまだありません。
            </p>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight">あなたの承認待ちの申請</h2>
        <ul className="grid gap-2">
          {myPendingDecisions.map((application) => (
            <li key={application.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-3 shadow-xs">
              <Link href={`/applications/${application.id}`} className="min-w-0 truncate text-sm font-medium hover:underline">
                {application.template.name}
              </Link>
              <Badge variant="outline">審査中</Badge>
            </li>
          ))}
          {myPendingDecisions.length === 0 && (
            <p className="text-muted-foreground rounded-lg border border-dashed bg-card/60 px-4 py-6 text-center text-sm">
              現在承認待ちの申請はありません。
            </p>
          )}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold tracking-tight">自分が提出した申請</h2>
        <ul className="grid gap-2">
          {myApplications.map((application) => (
            <li key={application.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-3 shadow-xs transition-colors hover:border-primary/25 hover:bg-muted/35">
              <Link href={`/applications/${application.id}`} className="min-w-0 truncate text-sm font-medium hover:underline">
                {application.template.name}
              </Link>
              <Badge variant="outline">{STATUS_LABELS[application.status]}</Badge>
            </li>
          ))}
          {myApplications.length === 0 && (
            <p className="text-muted-foreground rounded-lg border border-dashed bg-card/60 px-4 py-6 text-center text-sm">
              まだ申請したことはありません。
            </p>
          )}
        </ul>
      </section>
    </main>
  );
}
