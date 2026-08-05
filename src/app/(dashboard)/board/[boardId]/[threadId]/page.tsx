import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/visibility";
import { PERMISSIONS } from "@/lib/permissions";
import { ReplyForm } from "./reply-form";
import { BanButton } from "./ban-button";
import { DeletePostButton } from "./delete-post-button";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ boardId: string; threadId: string }>;
}) {
  const { boardId, threadId } = await params;
  const user = await verifySession();

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { board: true },
  });
  if (!thread || thread.boardId !== boardId) notFound();

  const visible = await canView(user, "BOARD", boardId);
  if (!visible) notFound();

  const posts = await prisma.post.findMany({
    where: { threadId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });

  const canBan = (user.role.permissions & PERMISSIONS.CAN_BAN_BOARD_USER) !== 0n;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{thread.title}</h1>

      <ul className="flex flex-col gap-3">
        {posts.map((post, index) => (
          <li key={post.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {index + 1}. {post.author.name}
              </span>
              <div className="flex items-center gap-1">
                {(post.authorId === user.id || canBan) && (
                  <DeletePostButton postId={post.id} boardId={boardId} threadId={threadId} />
                )}
                {canBan && post.authorId !== user.id && <BanButton userId={post.authorId} />}
              </div>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{post.body}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {post.createdAt.toLocaleString("ja-JP")}
            </p>
          </li>
        ))}
      </ul>

      <ReplyForm boardId={boardId} threadId={threadId} />
    </main>
  );
}
