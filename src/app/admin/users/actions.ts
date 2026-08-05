"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

const setDepartmentSchema = z.object({
  userId: z.string().min(1),
  department: z.enum(["IT", "ROBOT", "HYBRID", "NONE"]),
});

export async function setUserDepartment(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_ROLES);

  const parsed = setDepartmentSchema.parse({
    userId: formData.get("userId"),
    department: formData.get("department"),
  });

  const department = parsed.department === "NONE" ? null : parsed.department;

  const targetUser = await prisma.user.findUniqueOrThrow({ where: { id: parsed.userId } });

  await prisma.user.update({ where: { id: parsed.userId }, data: { department } });

  await recordAudit({
    actorId: actor.id,
    action: "DEPARTMENT_CHANGE",
    targetType: "User",
    targetId: parsed.userId,
    before: { department: targetUser.department },
    after: { department },
  });

  revalidatePath("/admin/users");
}
