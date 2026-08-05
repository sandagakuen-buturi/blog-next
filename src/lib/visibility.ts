import "server-only";
import { prisma } from "@/lib/prisma";
import { ROLE_LEVELS } from "@/lib/permissions";
import type { Department, VisibilityScope } from "@/generated/prisma/client";

export type ViewerUser = {
  id: string;
  department: Department | null;
  role: { level: number };
};

export type VisibilityInput =
  | { scope: "PUBLIC_STUDENT" }
  | { scope: "DEPARTMENT_ONLY"; targetDepartment: Department }
  | { scope: "MEMBERS_ONLY" }
  | { scope: "ROLE_LEVEL_GTE"; minRoleLevel: number }
  | { scope: "SPECIFIC_USERS"; targetUserIds: string[] };

/**
 * ブログ/QA/掲示板など、Visibilityポリシーの対象となる全リソースの閲覧可否を
 * ここに一元化して判定する。ポリシーが未設定のリソースは fail-closed で拒否する。
 */
export async function canView(
  user: ViewerUser,
  resourceType: string,
  resourceId: string,
): Promise<boolean> {
  const policy = await prisma.visibilityPolicy.findUnique({
    where: { resourceType_resourceId: { resourceType, resourceId } },
  });
  if (!policy) return false;
  return evaluatePolicy(user, policy);
}

function evaluatePolicy(
  user: ViewerUser,
  policy: {
    scope: VisibilityScope;
    minRoleLevel: number | null;
    targetDepartment: Department | null;
    targetUserIds: string[];
  },
): boolean {
  switch (policy.scope) {
    case "PUBLIC_STUDENT":
      return user.role.level >= ROLE_LEVELS.STUDENT;
    case "DEPARTMENT_ONLY":
      return policy.targetDepartment !== null && user.department === policy.targetDepartment;
    case "MEMBERS_ONLY":
      return user.role.level > ROLE_LEVELS.STUDENT;
    case "ROLE_LEVEL_GTE":
      return policy.minRoleLevel !== null && user.role.level >= policy.minRoleLevel;
    case "SPECIFIC_USERS":
      return policy.targetUserIds.includes(user.id);
    default:
      return false;
  }
}

/** リソース作成/更新時に呼ぶ。既存ポリシーがあれば置き換える(1リソース1ポリシー)。 */
export async function setVisibilityPolicy(
  resourceType: string,
  resourceId: string,
  input: VisibilityInput,
) {
  const data = {
    scope: input.scope,
    minRoleLevel: input.scope === "ROLE_LEVEL_GTE" ? input.minRoleLevel : null,
    targetDepartment: input.scope === "DEPARTMENT_ONLY" ? input.targetDepartment : null,
    targetUserIds: input.scope === "SPECIFIC_USERS" ? input.targetUserIds : [],
  };

  return prisma.visibilityPolicy.upsert({
    where: { resourceType_resourceId: { resourceType, resourceId } },
    update: data,
    create: { resourceType, resourceId, ...data },
  });
}
