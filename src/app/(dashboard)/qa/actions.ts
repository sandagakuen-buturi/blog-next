"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, verifySession } from "@/lib/dal";
import { PERMISSIONS } from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/ratelimit";

const createQuestionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)),
});

export type CreateQuestionState = { error?: string };

export async function createQuestion(
  _prevState: CreateQuestionState,
  formData: FormData,
): Promise<CreateQuestionState> {
  let questionId: string;

  try {
    const author = await requirePermission(PERMISSIONS.CAN_ASK_QA);
    await enforceRateLimit("qa-question", author.id, 5, 600);

    const parsed = createQuestionSchema.parse({
      title: formData.get("title"),
      body: formData.get("body"),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    const question = await prisma.qaQuestion.create({
      data: { authorId: author.id, title: parsed.title, body: parsed.body, tags: parsed.tags },
    });
    questionId = question.id;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "入力内容を確認してください。" };
    }
    if (error instanceof Error) return { error: error.message };
    throw error;
  }

  redirect(`/qa/${questionId}`);
}

const createAnswerSchema = z.object({
  questionId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

export async function createAnswer(formData: FormData) {
  const author = await requirePermission(PERMISSIONS.CAN_ANSWER_QA);
  await enforceRateLimit("qa-answer", author.id, 20, 300);

  const parsed = createAnswerSchema.parse({
    questionId: formData.get("questionId"),
    body: formData.get("body"),
  });

  await prisma.qaAnswer.create({
    data: { questionId: parsed.questionId, authorId: author.id, body: parsed.body },
  });

  revalidatePath(`/qa/${parsed.questionId}`);
}

const deleteAnswerSchema = z.object({
  answerId: z.string().min(1),
  questionId: z.string().min(1),
});

export async function deleteAnswer(formData: FormData) {
  const user = await verifySession();

  const parsed = deleteAnswerSchema.parse({
    answerId: formData.get("answerId"),
    questionId: formData.get("questionId"),
  });

  const answer = await prisma.qaAnswer.findUniqueOrThrow({ where: { id: parsed.answerId } });
  if (answer.authorId !== user.id) {
    throw new Error("自分の回答のみ削除できます。");
  }

  await prisma.qaAnswer.delete({ where: { id: parsed.answerId } });
  revalidatePath(`/qa/${parsed.questionId}`);
}

const deleteQuestionSchema = z.object({ questionId: z.string().min(1) });

export async function deleteQuestion(formData: FormData) {
  const user = await verifySession();

  const { questionId } = deleteQuestionSchema.parse({
    questionId: formData.get("questionId"),
  });

  const question = await prisma.qaQuestion.findUniqueOrThrow({ where: { id: questionId } });
  if (question.authorId !== user.id) {
    throw new Error("自分の質問のみ削除できます。");
  }

  await prisma.qaQuestion.delete({ where: { id: questionId } });
  redirect("/qa");
}

const markBestSchema = z.object({
  answerId: z.string().min(1),
  questionId: z.string().min(1),
});

export async function markBestAnswer(formData: FormData) {
  const user = await verifySession();

  const parsed = markBestSchema.parse({
    answerId: formData.get("answerId"),
    questionId: formData.get("questionId"),
  });

  const question = await prisma.qaQuestion.findUniqueOrThrow({
    where: { id: parsed.questionId },
  });
  if (question.authorId !== user.id) {
    throw new Error("質問者のみベストアンサーを選べます。");
  }

  await prisma.$transaction([
    prisma.qaAnswer.updateMany({
      where: { questionId: parsed.questionId },
      data: { isBestAnswer: false },
    }),
    prisma.qaAnswer.update({
      where: { id: parsed.answerId },
      data: { isBestAnswer: true },
    }),
  ]);

  revalidatePath(`/qa/${parsed.questionId}`);
}
