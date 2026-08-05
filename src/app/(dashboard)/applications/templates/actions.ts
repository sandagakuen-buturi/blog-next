"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { fieldDefSchema, stepDefSchema } from "@/lib/application-fields";

const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  fields: z.array(fieldDefSchema).min(1),
  steps: z.array(stepDefSchema).min(1),
});

export async function createApplicationTemplate(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES);

  const parsed = createTemplateSchema.parse({
    name: formData.get("name"),
    fields: JSON.parse(String(formData.get("fieldsJson") ?? "[]")),
    steps: JSON.parse(String(formData.get("stepsJson") ?? "[]")),
  });

  const template = await prisma.applicationTemplate.create({
    data: {
      name: parsed.name,
      fields: parsed.fields,
      steps: {
        create: parsed.steps.map((step, index) => ({
          order: index,
          approverType: step.approverType,
          approverRoleId: step.approverType === "SPECIFIC_ROLE" ? step.approverRoleId : null,
          approverUserIds: step.approverType === "SPECIFIC_USERS" ? step.approverUserIds : [],
        })),
      },
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "APPLICATION_TEMPLATE_CREATE",
    targetType: "ApplicationTemplate",
    targetId: template.id,
    after: { name: template.name },
  });

  revalidatePath("/applications/templates");
}

const deleteTemplateSchema = z.object({ templateId: z.string().min(1) });

export async function deleteApplicationTemplate(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES);

  const { templateId } = deleteTemplateSchema.parse({
    templateId: formData.get("templateId"),
  });

  const template = await prisma.applicationTemplate.findUniqueOrThrow({
    where: { id: templateId },
  });

  const applicationCount = await prisma.application.count({ where: { templateId } });
  if (applicationCount > 0) {
    throw new Error(
      `このテンプレートは${applicationCount}件の申請で使用されているため削除できません。`,
    );
  }

  await prisma.applicationTemplate.delete({ where: { id: templateId } });

  await recordAudit({
    actorId: actor.id,
    action: "APPLICATION_TEMPLATE_DELETE",
    targetType: "ApplicationTemplate",
    targetId: templateId,
    before: { name: template.name },
  });

  revalidatePath("/applications/templates");
}
