import { SidebarNav } from "./sidebar-nav";
import { ADMIN_NAV, MAIN_NAV, filterNavItems } from "./nav-items";
import { SignOutButton } from "@/app/(dashboard)/sign-out-button";

type ShellUser = {
  name: string;
  role: { name: string; permissions: bigint };
  department: string | null;
};

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const mainItems = filterNavItems(MAIN_NAV, user.role.permissions);
  const adminItems = filterNavItems(ADMIN_NAV, user.role.permissions);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="flex w-full shrink-0 flex-col justify-between border-b bg-sidebar/95 px-4 py-4 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-64 md:border-r md:border-b-0 md:py-5">
        <div className="flex flex-col gap-7">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-xs">
              物
            </div>
            <div className="min-w-0">
              <span className="block text-[0.95rem] font-semibold tracking-tight">物理部</span>
              <span className="text-muted-foreground block text-xs">部内ポータル</span>
            </div>
          </div>
          <SidebarNav items={mainItems} />
          {adminItems.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-sidebar-border pt-4">
              <span className="text-muted-foreground px-2 text-[0.68rem] font-semibold tracking-wide uppercase">
                管理
              </span>
              <SidebarNav items={adminItems} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
          <div className="rounded-lg border border-sidebar-border bg-card/75 px-3 py-2.5">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="text-muted-foreground mt-0.5 block truncate text-xs">
              {user.role.name}
              {user.department ? ` / ${user.department}課` : ""}
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
