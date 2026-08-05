import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/permissions";

export default async function QaListPage() {
  const user = await verifySession();

  const questions = await prisma.qaQuestion.findMany({
    include: { author: true, answers: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const canAsk = (user.role.permissions & PERMISSIONS.CAN_ASK_QA) !== 0n;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">部員内QA</h1>
          <p className="text-muted-foreground mt-1 text-sm">質問と回答を部内で共有</p>
        </div>
        {canAsk && (
          <Button render={<Link href="/qa/new" />} nativeButton={false}>
            質問する
          </Button>
        )}
      </div>

      <ul className="grid gap-3">
        {questions.map((question) => (
          <li key={question.id} className="rounded-lg border bg-card p-4 shadow-xs transition-colors hover:border-primary/25 hover:bg-muted/35">
            <Link href={`/qa/${question.id}`} className="text-base font-semibold tracking-tight hover:underline">
              {question.title}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {question.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {question.author.name} / 回答{question.answers.length}件
              {question.answers.some((a) => a.isBestAnswer) && " / 解決済み"}
            </p>
          </li>
        ))}
        {questions.length === 0 && (
          <p className="text-muted-foreground rounded-lg border border-dashed bg-card/60 px-4 py-8 text-center text-sm">
            まだ質問はありません。
          </p>
        )}
      </ul>
    </main>
  );
}
