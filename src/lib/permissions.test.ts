import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  hasPermission,
  combinePermissions,
  DEFAULT_ROLES,
  ROLE_LEVELS,
} from "./permissions";

describe("hasPermission", () => {
  it("returns true when the bit is set", () => {
    const permissions = combinePermissions([PERMISSIONS.CAN_POST_BLOG]);
    expect(hasPermission(permissions, PERMISSIONS.CAN_POST_BLOG)).toBe(true);
  });

  it("returns false when the bit is not set", () => {
    const permissions = combinePermissions([PERMISSIONS.CAN_POST_BLOG]);
    expect(hasPermission(permissions, PERMISSIONS.CAN_MANAGE_ROLES)).toBe(false);
  });

  it("returns false for a role with no permissions (学生)", () => {
    expect(hasPermission(0n, PERMISSIONS.CAN_POST_BLOG)).toBe(false);
  });
});

describe("combinePermissions", () => {
  it("ORs multiple flags together without losing any bit", () => {
    const combined = combinePermissions([PERMISSIONS.CAN_POST_BLOG, PERMISSIONS.CAN_ASK_QA]);
    expect(hasPermission(combined, PERMISSIONS.CAN_POST_BLOG)).toBe(true);
    expect(hasPermission(combined, PERMISSIONS.CAN_ASK_QA)).toBe(true);
    expect(hasPermission(combined, PERMISSIONS.CAN_ANSWER_QA)).toBe(false);
  });

  it("returns 0n for an empty flag list", () => {
    expect(combinePermissions([])).toBe(0n);
  });
});

describe("DEFAULT_ROLES", () => {
  it("orders 学生 lowest and システム管理者 highest, matching the required hierarchy", () => {
    const student = DEFAULT_ROLES.find((r) => r.name === "学生")!;
    const admin = DEFAULT_ROLES.find((r) => r.name === "システム管理者")!;
    expect(student.level).toBe(ROLE_LEVELS.STUDENT);
    expect(admin.level).toBeGreaterThan(student.level);
    for (const role of DEFAULT_ROLES) {
      expect(role.level).toBeLessThanOrEqual(admin.level);
    }
  });

  it("gives IT課員 and ロボット課員 the exact same permissions and level", () => {
    const it = DEFAULT_ROLES.find((r) => r.name === "物理部IT課員")!;
    const robot = DEFAULT_ROLES.find((r) => r.name === "物理部ロボット課員")!;
    expect(it.level).toBe(robot.level);
    expect(it.permissions).toBe(robot.permissions);
  });

  it("学生 has no permission bits at all", () => {
    const student = DEFAULT_ROLES.find((r) => r.name === "学生")!;
    expect(student.permissions).toBe(0n);
  });

  it("課長以上 (KACHO_PERMISSIONS 相当) can ban board users, matching Q7's decision", () => {
    const kacho = DEFAULT_ROLES.find((r) => r.name === "課長")!;
    expect(hasPermission(kacho.permissions, PERMISSIONS.CAN_BAN_BOARD_USER)).toBe(true);
  });

  it("システム管理者 holds every permission bit", () => {
    const admin = DEFAULT_ROLES.find((r) => r.name === "システム管理者")!;
    for (const flag of Object.values(PERMISSIONS)) {
      expect(hasPermission(admin.permissions, flag)).toBe(true);
    }
  });
});
