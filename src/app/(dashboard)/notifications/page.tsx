import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { MarkReadButton } from "./mark-read-button";

export default async function NotificationsPage() {
  const user = await verifySession();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
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
    </main>
  );
}
