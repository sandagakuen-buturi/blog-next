import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { evaluatePolicy } from "@/lib/visibility";
import { PERMISSIONS } from "@/lib/permissions";
import { CreateBoardForm } from "./create-board-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteBoard } from "./actions";

export default async function BoardListPage() {
  const user = await verifySession();

  const boards = await prisma.board.findMany({
    include: { _count: { select: { threads: true } } },
    orderBy: { createdAt: "asc" },
  });

  const policies = await prisma.visibilityPolicy.findMany({
    where: { resourceType: "BOARD", resourceId: { in: boards.map((b) => b.id) } },
  });
  const policyByBoardId = new Map(policies.map((p) => [p.resourceId, p]));

  const visibleBoards = boards.filter((board) => {
    const policy = policyByBoardId.get(board.id);
    return policy && evaluatePolicy(user, policy);
  });

  const canCreateBoard = (user.role.permissions & PERMISSIONS.CAN_CREATE_BOARD) !== 0n;
  const canModerate = (user.role.permissions & PERMISSIONS.CAN_BAN_BOARD_USER) !== 0n;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="border-b pb-5">
        <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">掲示板</h1>
        <p className="text-muted-foreground mt-1 text-sm">板ごとに話題を整理</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {visibleBoards.map((board) => (
          <li
            key={board.id}
            className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4 shadow-xs transition-colors hover:border-primary/25 hover:bg-muted/35"
          >
            <div>
              <Link href={`/board/${board.id}`} className="font-semibold tracking-tight hover:underline">
                {board.name}
              </Link>
              <p className="text-muted-foreground mt-1 text-sm">{board._count.threads}スレッド</p>
            </div>
            {(board.creatorId === user.id || canModerate) && (
              <form action={deleteBoard}>
                <input type="hidden" name="boardId" value={board.id} />
                <ConfirmSubmitButton
                  confirmMessage="この板を削除しますか?中の全スレッド・レスも削除されます。"
                  variant="destructive"
                  size="sm"
                >
                  削除
                </ConfirmSubmitButton>
              </form>
            )}
          </li>
        ))}
        {visibleBoards.length === 0 && (
          <p className="text-muted-foreground rounded-lg border border-dashed bg-card/60 px-4 py-8 text-center text-sm sm:col-span-2">
            閲覧可能な板はまだありません。
          </p>
        )}
      </ul>

      {canCreateBoard && (
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-xs">
          <h2 className="text-base font-semibold tracking-tight">板を作成</h2>
          <CreateBoardForm />
        </div>
      )}
    </main>
  );
}
