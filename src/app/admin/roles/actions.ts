"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/dal";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

const permissionKeys = Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[];

const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(50),
  level: z.coerce.number().int().min(1).max(89), // 0とシステム管理者の90は予約
  permissionKeys: z.array(z.enum(permissionKeys as [string, ...string[]])),
});

export async function createCustomRole(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_ROLES);

  const parsed = createRoleSchema.parse({
    name: formData.get("name"),
    level: formData.get("level"),
    permissionKeys: formData.getAll("permissionKeys"),
  });

  const permissions = parsed.permissionKeys.reduce(
    (acc, key) => acc | PERMISSIONS[key as keyof typeof PERMISSIONS],
    0n,
  );

  const role = await prisma.role.create({
    data: {
      name: parsed.name,
      level: parsed.level,
      permissions,
      isCustom: true,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "ROLE_CREATE",
    targetType: "Role",
    targetId: role.id,
    after: { name: role.name, level: role.level, permissions: role.permissions.toString() },
  });

  revalidatePath("/admin/roles");
}

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});

export async function assignUserRole(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_MANAGE_ROLES);

  const parsed = assignRoleSchema.parse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
  });

  if (parsed.userId === actor.id) {
    throw new Error(
      "自分自身のロールは変更できません。他のロール管理者に依頼してください(自分のロールを誤って下げてロールアウトされるのを防ぐためです)。",
    );
  }

  const targetUser = await prisma.user.findUniqueOrThrow({ where: { id: parsed.userId } });

  const updated = await prisma.user.update({
    where: { id: parsed.userId },
    data: { roleId: parsed.roleId },
    include: { role: true },
  });

  await recordAudit({
    actorId: actor.id,
    action: "ROLE_CHANGE",
    targetType: "User",
    targetId: updated.id,
    before: { roleId: targetUser.roleId },
    after: { roleId: updated.roleId, roleName: updated.role.name },
  });

  revalidatePath("/admin/users");
}
