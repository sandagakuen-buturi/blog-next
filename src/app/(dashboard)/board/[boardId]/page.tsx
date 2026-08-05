import { notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/visibility";
import { PERMISSIONS } from "@/lib/permissions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { NewThreadForm } from "./new-thread-form";
import { deleteThread } from "../actions";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const user = await verifySession();

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) notFound();

  const visible = await canView(user, "BOARD", board.id);
  if (!visible) notFound();

  const threads = await prisma.thread.findMany({
    where: { boardId },
    include: { author: true, _count: { select: { posts: true } } },
    orderBy: { createdAt: "desc" },
  });

  const canModerate = (user.role.permissions & PERMISSIONS.CAN_BAN_BOARD_USER) !== 0n;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{board.name}</h1>

      <ul className="flex flex-col gap-3">
        {threads.map((thread) => (
          <li key={thread.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div>
              <Link
                href={`/board/${boardId}/${thread.id}`}
                className="font-medium hover:underline"
              >
                {thread.title}
              </Link>
              <p className="text-muted-foreground text-sm">
                {thread.author.name} / レス{thread._count.posts}件
              </p>
            </div>
            {(thread.authorId === user.id || canModerate) && (
              <form action={deleteThread}>
                <input type="hidden" name="threadId" value={thread.id} />
                <input type="hidden" name="boardId" value={boardId} />
                <ConfirmSubmitButton
                  confirmMessage="このスレッドを削除しますか?中の全レスも削除されます。"
                  variant="destructive"
                  size="sm"
                >
                  削除
                </ConfirmSubmitButton>
              </form>
            )}
          </li>
        ))}
        {threads.length === 0 && (
          <p className="text-muted-foreground text-sm">まだスレッドはありません。</p>
        )}
      </ul>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">新規スレッド作成</h2>
        <NewThreadForm boardId={boardId} />
      </div>
    </main>
  );
}
