import "server-only";
import { prisma } from "@/lib/prisma";
import type { Department } from "@/generated/prisma/client";
import { evaluatePolicy, type ViewerUser, type PolicyLike } from "@/lib/visibility-policy";

export type { ViewerUser, PolicyLike };
export { evaluatePolicy };

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

/** リソース削除時に呼ぶ。ポリシーが存在しなくてもエラーにしない。 */
export async function deleteVisibilityPolicy(resourceType: string, resourceId: string) {
  await prisma.visibilityPolicy.deleteMany({ where: { resourceType, resourceId } });
}
