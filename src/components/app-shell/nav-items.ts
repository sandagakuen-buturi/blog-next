import { PERMISSIONS, type PermissionFlag } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  requires?: PermissionFlag;
};

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "ダッシュボード" },
  { href: "/blog", label: "ブログ" },
  { href: "/qa", label: "QA" },
  { href: "/board", label: "掲示板" },
  { href: "/applications", label: "申請" },
  { href: "/notifications", label: "通知" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/roles", label: "ロール管理", requires: PERMISSIONS.CAN_MANAGE_ROLES },
  { href: "/admin/users", label: "ユーザー管理", requires: PERMISSIONS.CAN_MANAGE_ROLES },
  { href: "/admin/webhooks", label: "Webhook設定", requires: PERMISSIONS.CAN_MANAGE_WEBHOOKS },
  { href: "/admin/bulk-email", label: "一括メール", requires: PERMISSIONS.CAN_SEND_BULK_EMAIL },
  {
    href: "/applications/templates",
    label: "申請テンプレート",
    requires: PERMISSIONS.CAN_MANAGE_APPLICATION_TEMPLATES,
  },
  { href: "/admin/audit-log", label: "監査ログ", requires: PERMISSIONS.CAN_VIEW_AUDIT_LOG },
];

export function filterNavItems(items: NavItem[], permissions: bigint): NavItem[] {
  return items.filter((item) => !item.requires || (permissions & item.requires) !== 0n);
}
