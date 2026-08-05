import { verifySession } from "@/lib/dal";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession();

  return <AppShell user={user}>{children}</AppShell>;
}
