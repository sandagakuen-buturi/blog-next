import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { MarkReadButton } from "./mark-read-button";
import { PaginationControls, resolvePage } from "@/components/pagination-controls";

const PAGE_SIZE = 100;

export default async function NotificationsPage(props: PageProps<"/notifications">) {
  const user = await verifySession();

  const where = { userId: user.id };
  const total = await prisma.notification.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = resolvePage((await props.searchParams).page, totalPages);

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">通知</h1>
      <ul className="flex flex-col gap-3">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className="flex items-start justify-between gap-3 rounded-lg border p-3"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {!notification.readAt && <Badge variant="secondary">未読</Badge>}
                <span className="text-sm">{notification.message}</span>
              </div>
              {notification.link && (
                <Link href={notification.link} className="text-xs hover:underline">
                  詳細を見る
                </Link>
              )}
            </div>
            {!notification.readAt && <MarkReadButton notificationId={notification.id} />}
          </li>
        ))}
        {notifications.length === 0 && (
          <p className="text-muted-foreground text-sm">通知はありません。</p>
        )}
      </ul>

      <PaginationControls currentPage={page} totalPages={totalPages} />
    </main>
  );
}
