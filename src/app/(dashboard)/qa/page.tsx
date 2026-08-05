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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">部員内QA</h1>
        {canAsk && (
          <Button render={<Link href="/qa/new" />} nativeButton={false}>
            質問する
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {questions.map((question) => (
          <li key={question.id} className="rounded-lg border p-4">
            <Link href={`/qa/${question.id}`} className="text-lg font-medium hover:underline">
              {question.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
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
          <p className="text-muted-foreground text-sm">まだ質問はありません。</p>
        )}
      </ul>
    </main>
  );
}
