import "server-only";
import { prisma } from "@/lib/prisma";
import { ROLE_LEVELS } from "@/lib/permissions";
import type { Department, VisibilityScope } from "@/generated/prisma/client";

export type ViewerUser = {
  id: string;
  roleId: string;
  department: Department | null;
  role: { level: number };
};

export type VisibilityInput =
  | { scope: "PUBLIC_STUDENT" }
  | { scope: "DEPARTMENT_ONLY"; targetDepartment: Department }
  | { scope: "MEMBERS_ONLY" }
  | { scope: "SPECIFIC_ROLE"; targetRoleId: string }
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

export type PolicyLike = {
  scope: VisibilityScope;
  targetRoleId: string | null;
  targetDepartment: Department | null;
  targetUserIds: string[];
};

/** 一覧表示等、既に取得済みのポリシーを再クエリなしで評価したい場合に使う。 */
export function evaluatePolicy(user: ViewerUser, policy: PolicyLike): boolean {
  switch (policy.scope) {
    case "PUBLIC_STUDENT":
      return user.role.level >= ROLE_LEVELS.STUDENT;
    case "DEPARTMENT_ONLY":
      return policy.targetDepartment !== null && user.department === policy.targetDepartment;
    case "MEMBERS_ONLY":
      return user.role.level > ROLE_LEVELS.STUDENT;
    case "SPECIFIC_ROLE":
      return policy.targetRoleId !== null && user.roleId === policy.targetRoleId;
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
    targetRoleId: input.scope === "SPECIFIC_ROLE" ? input.targetRoleId : null,
    targetDepartment: input.scope === "DEPARTMENT_ONLY" ? input.targetDepartment : null,
    targetUserIds: input.scope === "SPECIFIC_USERS" ? input.targetUserIds : [],
  };

  return prisma.visibilityPolicy.upsert({
    where: { resourceType_resourceId: { resourceType, resourceId } },
    update: data,
    create: { resourceType, resourceId, ...data },
  });
}
