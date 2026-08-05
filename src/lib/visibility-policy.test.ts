import { describe, expect, it } from "vitest";
import { evaluatePolicy, type ViewerUser, type PolicyLike } from "./visibility-policy";
import { ROLE_LEVELS } from "./permissions";

function user(overrides: Partial<ViewerUser> = {}): ViewerUser {
  return {
    id: "user-1",
    roleId: "role-student",
    department: null,
    role: { level: ROLE_LEVELS.STUDENT },
    ...overrides,
  };
}

function policy(overrides: Partial<PolicyLike>): PolicyLike {
  return {
    scope: "PUBLIC_STUDENT",
    targetRoleId: null,
    targetDepartment: null,
    targetUserIds: [],
    ...overrides,
  };
}

describe("evaluatePolicy", () => {
  it("PUBLIC_STUDENT: allows every authenticated user, even a plain 学生", () => {
    expect(evaluatePolicy(user(), policy({ scope: "PUBLIC_STUDENT" }))).toBe(true);
  });

  it("MEMBERS_ONLY: denies a 学生 (level === STUDENT, not >)", () => {
    expect(evaluatePolicy(user(), policy({ scope: "MEMBERS_ONLY" }))).toBe(false);
  });

  it("MEMBERS_ONLY: allows any club member above student level", () => {
    const member = user({ role: { level: ROLE_LEVELS.IT_MEMBER } });
    expect(evaluatePolicy(member, policy({ scope: "MEMBERS_ONLY" }))).toBe(true);
  });

  it("DEPARTMENT_ONLY: allows only a matching department", () => {
    const itMember = user({ department: "IT" });
    expect(
      evaluatePolicy(itMember, policy({ scope: "DEPARTMENT_ONLY", targetDepartment: "IT" })),
    ).toBe(true);
    expect(
      evaluatePolicy(itMember, policy({ scope: "DEPARTMENT_ONLY", targetDepartment: "ROBOT" })),
    ).toBe(false);
  });

  it("DEPARTMENT_ONLY: denies a user with no department", () => {
    expect(
      evaluatePolicy(user(), policy({ scope: "DEPARTMENT_ONLY", targetDepartment: "IT" })),
    ).toBe(false);
  });

  it("SPECIFIC_ROLE: matches by exact roleId, not by level threshold", () => {
    const kacho = user({ roleId: "role-kacho", role: { level: ROLE_LEVELS.KACHO } });
    expect(
      evaluatePolicy(kacho, policy({ scope: "SPECIFIC_ROLE", targetRoleId: "role-kacho" })),
    ).toBe(true);
    // 課長より上位の部長でも、ロールIDが一致しなければ不可(レベル以上ではなく完全一致)。
    const bucho = user({ roleId: "role-bucho", role: { level: ROLE_LEVELS.BUCHO } });
    expect(
      evaluatePolicy(bucho, policy({ scope: "SPECIFIC_ROLE", targetRoleId: "role-kacho" })),
    ).toBe(false);
  });

  it("SPECIFIC_USERS: matches only listed user IDs", () => {
    const viewer = user({ id: "user-42" });
    expect(
      evaluatePolicy(viewer, policy({ scope: "SPECIFIC_USERS", targetUserIds: ["user-42"] })),
    ).toBe(true);
    expect(
      evaluatePolicy(viewer, policy({ scope: "SPECIFIC_USERS", targetUserIds: ["user-99"] })),
    ).toBe(false);
  });
});
