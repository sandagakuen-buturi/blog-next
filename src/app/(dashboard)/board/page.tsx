import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { evaluatePolicy } from "@/lib/visibility";
import { PERMISSIONS } from "@/lib/permissions";
import { CreateBoardForm } from "./create-board-form";

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

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">掲示板</h1>

      <ul className="flex flex-col gap-3">
        {visibleBoards.map((board) => (
          <li key={board.id} className="rounded-lg border p-3">
            <Link href={`/board/${board.id}`} className="font-medium hover:underline">
              {board.name}
            </Link>
            <p className="text-muted-foreground text-sm">{board._count.threads}スレッド</p>
          </li>
        ))}
        {visibleBoards.length === 0 && (
          <p className="text-muted-foreground text-sm">閲覧可能な板はまだありません。</p>
        )}
      </ul>

      {canCreateBoard && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">板を作成</h2>
          <CreateBoardForm />
        </div>
      )}
    </main>
  );
}
