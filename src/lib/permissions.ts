/**
 * ロールの権限はビットフィールド(BigInt)で表現する。
 * 「◯◯以上」のような順序比較は Role.level(数値)側で行う — permissions は可否判定専用。
 */
export const PERMISSIONS = {
  CAN_POST_BLOG: 1n << 0n,
  CAN_MODERATE_BLOG: 1n << 1n, // 他人のコメント削除等
  CAN_ASK_QA: 1n << 2n,
  CAN_ANSWER_QA: 1n << 3n,
  CAN_CREATE_BOARD: 1n << 4n,
  CAN_SEND_BULK_EMAIL: 1n << 5n,
  CAN_MANAGE_ROLES: 1n << 6n, // カスタムロール作成・ユーザーへの付与
  CAN_MANAGE_WEBHOOKS: 1n << 7n, // Discord Webhook URL設定
  CAN_VIEW_AUDIT_LOG: 1n << 8n,
  CAN_BAN_BOARD_USER: 1n << 9n,
  CAN_MANAGE_APPLICATION_TEMPLATES: 1n << 10n,
} as const;

export type PermissionFlag = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(rolePermissions: bigint, flag: PermissionFlag): boolean {
  return (rolePermissions & flag) !== 0n;
}

export function combinePermissions(flags: PermissionFlag[]): bigint {
  return flags.reduce((acc, flag) => acc | flag, 0n);
}

/** デフォルト9ロールの階層レベル。数値が大きいほど強い権限。 */
export const ROLE_LEVELS = {
  STUDENT: 0,
  IT_MEMBER: 10,
  ROBOT_MEMBER: 10,
  HYBRID_MEMBER: 15,
  KACHO: 20,
  BUCHO: 30,
  ADVISOR: 40,
  TEACHER: 50,
  SYSTEM_ADMIN: 90,
} as const;

const CLUB_MEMBER_PERMISSIONS = combinePermissions([
  PERMISSIONS.CAN_POST_BLOG,
  PERMISSIONS.CAN_ASK_QA,
  PERMISSIONS.CAN_ANSWER_QA,
]);

const KACHO_PERMISSIONS = combinePermissions([
  PERMISSIONS.CAN_POST_BLOG,
  PERMISSIONS.CAN_ASK_QA,
  PERMISSIONS.CAN_ANSWER_QA,
  PERMISSIONS.CAN_CREATE_BOARD,
  PERMISSIONS.CAN_MODERATE_BLOG,
  PERMISSIONS.CAN_SEND_BULK_EMAIL,
]);

const ADMIN_PERMISSIONS = combinePermissions(Object.values(PERMISSIONS));

/** prisma/seed.ts から参照するデフォルトロール定義。 */
export const DEFAULT_ROLES = [
  { name: "学生", level: ROLE_LEVELS.STUDENT, permissions: 0n },
  { name: "物理部IT課員", level: ROLE_LEVELS.IT_MEMBER, permissions: CLUB_MEMBER_PERMISSIONS },
  { name: "物理部ロボット課員", level: ROLE_LEVELS.ROBOT_MEMBER, permissions: CLUB_MEMBER_PERMISSIONS },
  { name: "物理部ハイブリッド", level: ROLE_LEVELS.HYBRID_MEMBER, permissions: CLUB_MEMBER_PERMISSIONS },
  { name: "課長", level: ROLE_LEVELS.KACHO, permissions: KACHO_PERMISSIONS },
  { name: "部長", level: ROLE_LEVELS.BUCHO, permissions: KACHO_PERMISSIONS },
  { name: "顧問", level: ROLE_LEVELS.ADVISOR, permissions: KACHO_PERMISSIONS },
  { name: "教師", level: ROLE_LEVELS.TEACHER, permissions: KACHO_PERMISSIONS },
  { name: "システム管理者", level: ROLE_LEVELS.SYSTEM_ADMIN, permissions: ADMIN_PERMISSIONS },
] as const;
