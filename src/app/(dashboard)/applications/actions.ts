"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/lib/dal";
import { resolveApprovers, resolveSystemAdmins } from "@/lib/approval";
import { notifyApplicationEvent } from "@/lib/notify";
import { buildDataSchema, fieldDefSchema } from "@/lib/application-fields";
import { enforceRateLimit } from "@/lib/ratelimit";
import { deleteAttachmentsForResource } from "@/lib/attachments";
import { PERMISSIONS } from "@/lib/permissions";

const submitSchema = z.object({ templateId: z.string().min(1) });

export type SubmitState = { error?: string };

/** 申請の新規提出。RETURNEDからの再提出(resubmit)も同じロジックを共有する。 */
async function submitApplication(templateId: string, applicantId: string, data: Record<string, unknown>) {
  const template = await prisma.applicationTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  const firstStep = template.steps[0];
  if (!firstStep) throw new Error("このテンプレートには承認段階が設定されていません。");

  const approvers = await resolveApprovers(firstStep);
  const needsAttention = approvers.length === 0;

  const application = await prisma.application.create({
    data: {
      templateId,
      applicantId,
      data: data as Prisma.InputJsonValue,
      status: "PENDING",
      currentStep: 0,
      needsAttention,
    },
  });

  if (needsAttention) {
    const admins = await resolveSystemAdmins();
    await notifyApplicationEvent({
      userIds: admins.map((a) => a.id),
      type: "APPLICATION_NEEDS_ATTENTION",
      message: `申請「${template.name}」の第1段階に承認者が誰もいません。承認フロー設定を確認してください。`,
      link: `/applications/${application.id}`,
    });
  } else {
    await notifyApplicationEvent({
      userIds: approvers.map((a) => a.id),
      type: "APPLICATION_PENDING_DECISION",
      message: `「${template.name}」の新しい申請があり、あなたの承認が必要です。`,
      link: `/applications/${application.id}`,
    });
  }

  return application;
}

export async function createApplication(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  let applicationId: string;

  try {
    const user = await verifySession();
    await enforceRateLimit("application-submit", user.id, 10, 600);
    const { templateId } = submitSchema.parse({ templateId: formData.get("templateId") });

    const template = await prisma.applicationTemplate.findUniqueOrThrow({
      where: { id: templateId },
    });
    const fields = z.array(fieldDefSchema).parse(template.fields);
    const dataSchema = buildDataSchema(fields);

    const rawData: Record<string, unknown> = {};
    for (const field of fields) {
      rawData[field.key] = formData.get(field.key) ?? undefined;
    }
    const data = dataSchema.parse(rawData);

    const application = await submitApplication(templateId, user.id, data);
    applicationId = application.id;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "入力内容を確認してください。" };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(`/applications/${applicationId}`);
}

const decideSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT", "RETURN"]),
  comment: z.string().trim().max(1000).optional(),
});

export async function decideApplication(formData: FormData) {
  const actor = await verifySession();

  const parsed = decideSchema.parse({
    applicationId: formData.get("applicationId"),
    decision: formData.get("decision"),
    comment: formData.get("comment") || undefined,
  });

  const application = await prisma.application.findUniqueOrThrow({
    where: { id: parsed.applicationId },
    include: { template: { include: { steps: { orderBy: { order: "asc" } } } } },
  });

  if (application.status !== "PENDING") {
    throw new Error("この申請は既に処理済みです。");
  }

  const currentStep = application.template.steps.find((s) => s.order === application.currentStep);
  if (!currentStep) throw new Error("承認段階の設定が見つかりません。");

  const approvers = await resolveApprovers(currentStep);
  if (!approvers.some((a) => a.id === actor.id)) {
    throw new Error("この段階の承認権限がありません。");
  }

  const isLastStep = application.currentStep === application.template.steps.length - 1;
  const nextStatus =
    parsed.decision === "APPROVE" ? (isLastStep ? "APPROVED" : "PENDING") : parsed.decision === "REJECT" ? "REJECTED" : "RETURNED";
  const nextStep = parsed.decision === "APPROVE" && !isLastStep ? application.currentStep + 1 : application.currentStep;

  // 早い者勝ち: 期待する現在状態のままの行だけを更新できた場合のみ処理を進める。
  const claimed = await prisma.application.updateMany({
    where: { id: application.id, status: "PENDING", currentStep: application.currentStep },
    data: { status: nextStatus, currentStep: nextStep },
  });
  if (claimed.count === 0) {
    throw new Error("既に他の承認者がこの段階を処理しています。");
  }

  await prisma.applicationDecision.create({
    data: {
      applicationId: application.id,
      stepOrder: application.currentStep,
      deciderId: actor.id,
      decision: parsed.decision,
      comment: parsed.comment,
    },
  });

  const decisionLabel = { APPROVE: "承認", REJECT: "却下", RETURN: "差し戻し" }[parsed.decision];
  await notifyApplicationEvent({
    userIds: [application.applicantId],
    type: "APPLICATION_DECIDED",
    message: `申請「${application.template.name}」が${decisionLabel}されました。`,
    link: `/applications/${application.id}`,
  });

  if (nextStatus === "PENDING") {
    const nextStepDef = application.template.steps.find((s) => s.order === nextStep)!;
    const nextApprovers = await resolveApprovers(nextStepDef);
    if (nextApprovers.length === 0) {
      await prisma.application.update({
        where: { id: application.id },
        data: { needsAttention: true },
      });
      const admins = await resolveSystemAdmins();
      await notifyApplicationEvent({
        userIds: admins.map((a) => a.id),
        type: "APPLICATION_NEEDS_ATTENTION",
        message: `申請「${application.template.name}」の次段階に承認者が誰もいません。`,
        link: `/applications/${application.id}`,
      });
    } else {
      await notifyApplicationEvent({
        userIds: nextApprovers.map((a) => a.id),
        type: "APPLICATION_PENDING_DECISION",
        message: `「${application.template.name}」の申請があなたの承認待ちです。`,
        link: `/applications/${application.id}`,
      });
    }
  }

  revalidatePath(`/applications/${application.id}`);
  revalidatePath("/applications");
}

const resubmitSchema = z.object({ applicationId: z.string().min(1) });

export async function resubmitApplication(formData: FormData) {
  const user = await verifySession();

  const { applicationId } = resubmitSchema.parse({
    applicationId: formData.get("applicationId"),
  });

  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { template: true },
  });

  if (application.applicantId !== user.id) {
    throw new Error("自分の申請のみ再提出できます。");
  }
  if (application.status !== "RETURNED") {
    throw new Error("差し戻された申請のみ再提出できます。");
  }

  const fields = z.array(fieldDefSchema).parse(application.template.fields);
  const dataSchema = buildDataSchema(fields);
  const rawData: Record<string, unknown> = {};
  for (const field of fields) {
    rawData[field.key] = formData.get(field.key) ?? undefined;
  }
  const data = dataSchema.parse(rawData);

  const firstStep = await prisma.approvalStep.findFirstOrThrow({
    where: { templateId: application.templateId },
    orderBy: { order: "asc" },
  });
  const approvers = await resolveApprovers(firstStep);
  const needsAttention = approvers.length === 0;

  await prisma.application.update({
    where: { id: applicationId },
    data: { data: data as Prisma.InputJsonValue, status: "PENDING", currentStep: 0, needsAttention },
  });

  if (needsAttention) {
    const admins = await resolveSystemAdmins();
    await notifyApplicationEvent({
      userIds: admins.map((a) => a.id),
      type: "APPLICATION_NEEDS_ATTENTION",
      message: `再提出された申請「${application.template.name}」の第1段階に承認者が誰もいません。`,
      link: `/applications/${applicationId}`,
    });
  } else {
    await notifyApplicationEvent({
      userIds: approvers.map((a) => a.id),
      type: "APPLICATION_PENDING_DECISION",
      message: `「${application.template.name}」が再提出され、あなたの承認が必要です。`,
      link: `/applications/${applicationId}`,
    });
  }

  revalidatePath(`/applications/${applicationId}`);
}

const deleteApplicationSchema = z.object({ applicationId: z.string().min(1) });

export async function deleteApplication(formData: FormData) {
  const user = await verifySession();

  const { applicationId } = deleteApplicationSchema.parse({
    applicationId: formData.get("applicationId"),
  });

  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
  });

  const isAdmin = (user.role.permissions & PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES) !== 0n;
  if (application.applicantId !== user.id && !isAdmin) {
    throw new Error("自分の申請のみ削除できます。");
  }
  if (application.status === "APPROVED" && !isAdmin) {
    throw new Error("承認済みの申請は記録として削除できません。");
  }

  await deleteAttachmentsForResource("APPLICATION", applicationId);
  await prisma.application.delete({ where: { id: applicationId } });

  redirect("/applications");
}
