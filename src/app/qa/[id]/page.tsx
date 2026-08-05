import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { SafeMarkdown } from "@/components/safe-markdown";
import { AnswerForm } from "./answer-form";
import { BestAnswerButton } from "./best-answer-button";

export default async function QaQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifySession();

  const question = await prisma.qaQuestion.findUnique({
    where: { id },
    include: { author: true, answers: { include: { author: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!question) notFound();

  const canAnswer = (user.role.permissions & PERMISSIONS.CAN_ANSWER_QA) !== 0n;
  const isQuestioner = question.authorId === user.id;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{question.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {question.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {question.author.name} / {question.createdAt.toLocaleDateString("ja-JP")}
        </p>
      </div>

      <SafeMarkdown>{question.body}</SafeMarkdown>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">回答 ({question.answers.length})</h2>
        <ul className="flex flex-col gap-3">
          {question.answers.map((answer) => (
            <li
              key={answer.id}
              className={`rounded-lg border p-3 ${answer.isBestAnswer ? "border-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{answer.author.name}</span>
                {answer.isBestAnswer && <Badge>ベストアンサー</Badge>}
              </div>
              <div className="mt-1">
                <SafeMarkdown>{answer.body}</SafeMarkdown>
              </div>
              {isQuestioner && !answer.isBestAnswer && (
                <BestAnswerButton answerId={answer.id} questionId={question.id} />
              )}
            </li>
          ))}
          {question.answers.length === 0 && (
            <p className="text-muted-foreground text-sm">まだ回答はありません。</p>
          )}
        </ul>

        {canAnswer && <AnswerForm questionId={question.id} />}
      </section>
    </main>
  );
}
