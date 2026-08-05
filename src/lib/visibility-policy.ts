import { ROLE_LEVELS } from "@/lib/permissions";
import type { Department, VisibilityScope } from "@/generated/prisma/client";

/**
 * DBアクセスを含まない純粋なポリシー評価ロジック。テストしやすくするため
 * (Prisma/server-onlyに依存しない)src/lib/visibility.ts から分離している。
 */

export type ViewerUser = {
  id: string;
  roleId: string;
  department: Department | null;
  role: { level: number };
};

export type PolicyLike = {
  scope: VisibilityScope;
  targetRoleId: string | null;
  targetDepartment: Department | null;
  targetUserIds: string[];
};

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
