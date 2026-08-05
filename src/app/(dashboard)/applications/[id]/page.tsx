import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { resolveApprovers } from "@/lib/approval";
import { fieldDefSchema } from "@/lib/application-fields";
import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { AttachmentList } from "@/components/attachment-list";
import { FileUploadWidget } from "@/components/file-upload-widget";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DecisionForm } from "./decision-form";
import { ResubmitForm } from "./resubmit-form";
import { deleteApplication } from "../actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "審査中",
  APPROVED: "承認済み",
  REJECTED: "却下",
  RETURNED: "差し戻し",
};
const DECISION_LABELS: Record<string, string> = {
  APPROVE: "承認",
  REJECT: "却下",
  RETURN: "差し戻し",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await verifySession();
  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      template: { include: { steps: { orderBy: { order: "asc" } } } },
      applicant: true,
      history: { include: { decider: true }, orderBy: { decidedAt: "asc" } },
    },
  });
  if (!application) notFound();

  const isApplicant = application.applicantId === user.id;
  const canManageTemplates =
    (user.role.permissions & PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES) !== 0n;

  const currentStep = application.template.steps.find(
    (s) => s.order === application.currentStep,
  );
  const currentApprovers = currentStep ? await resolveApprovers(currentStep) : [];
  const isCurrentApprover = currentApprovers.some((a) => a.id === user.id);

  const isAnyStepApprover = (
    await Promise.all(application.template.steps.map((s) => resolveApprovers(s)))
  ).some((approvers) => approvers.some((a) => a.id === user.id));

  if (!isApplicant && !isAnyStepApprover && !canManageTemplates) {
    notFound();
  }

  const fields = z.array(fieldDefSchema).parse(application.template.fields);
  const data = application.data as Record<string, unknown>;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{application.template.name}</h1>
          <Badge variant="outline">{STATUS_LABELS[application.status]}</Badge>
        </div>
        {(isApplicant || canManageTemplates) &&
          (application.status !== "APPROVED" || canManageTemplates) && (
            <form action={deleteApplication}>
              <input type="hidden" name="applicationId" value={application.id} />
              <ConfirmSubmitButton
                confirmMessage="この申請を削除しますか?元に戻せません。"
                variant="destructive"
                size="sm"
              >
                削除
              </ConfirmSubmitButton>
            </form>
          )}
      </div>
      <p className="text-muted-foreground text-sm">申請者: {application.applicant.name}</p>

      <dl className="flex flex-col gap-2 rounded-lg border p-4">
        {fields.map((field) => (
          <div key={field.key}>
            <dt className="text-muted-foreground text-xs">{field.label}</dt>
            <dd className="text-sm whitespace-pre-wrap">{String(data[field.key] ?? "-")}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">添付ファイル</h2>
        <AttachmentList resourceType="APPLICATION" resourceId={application.id} />
        {isApplicant && <FileUploadWidget resourceType="APPLICATION" resourceId={application.id} />}
      </div>

      {application.history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">承認履歴</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {application.history.map((decision) => (
              <li key={decision.id}>
                第{decision.stepOrder + 1}段階: {decision.decider.name} が
                {DECISION_LABELS[decision.decision]}
                {decision.comment && `(${decision.comment})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {application.status === "PENDING" && isCurrentApprover && (
        <DecisionForm applicationId={application.id} />
      )}

      {application.status === "RETURNED" && isApplicant && (
        <ResubmitForm applicationId={application.id} fields={fields} data={data} />
      )}
    </main>
  );
}
