"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, verifySession } from "@/lib/dal";
import { canView, setVisibilityPolicy, deleteVisibilityPolicy } from "@/lib/visibility";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/ratelimit";

const createBoardSchema = z.object({
  name: z.string().trim().min(1).max(100),
  scope: z.enum(["PUBLIC_STUDENT", "MEMBERS_ONLY"]),
});

export type CreateBoardState = { error?: string };

export async function createBoard(
  _prevState: CreateBoardState,
  formData: FormData,
): Promise<CreateBoardState> {
  let boardId: string;

  try {
    const creator = await requirePermission(PERMISSIONS.CAN_CREATE_BOARD);

    const parsed = createBoardSchema.parse({
      name: formData.get("name"),
      scope: formData.get("scope"),
    });

    const board = await prisma.board.create({
      data: { name: parsed.name, creatorId: creator.id },
    });
    await setVisibilityPolicy("BOARD", board.id, { scope: parsed.scope });
    boardId = board.id;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "入力内容を確認してください。" };
    }
    if (error instanceof Error) return { error: error.message };
    throw error;
  }

  redirect(`/board/${boardId}`);
}

const createThreadSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
});

export type CreateThreadState = { error?: string };

export async function createThread(
  _prevState: CreateThreadState,
  formData: FormData,
): Promise<CreateThreadState> {
  let boardId: string;
  let threadId: string;

  try {
    const user = await verifySession();

    if (user.boardBannedAt) {
      return { error: "掲示板の利用が停止されています。" };
    }

    await enforceRateLimit("board-thread", user.id, 10, 600);

    const parsed = createThreadSchema.parse({
      boardId: formData.get("boardId"),
      title: formData.get("title"),
      body: formData.get("body"),
    });

    const visible = await canView(user, "BOARD", parsed.boardId);
    if (!visible) {
      return { error: "この板にスレッドを作成する権限がありません。" };
    }

    const thread = await prisma.thread.create({
      data: { boardId: parsed.boardId, authorId: user.id, title: parsed.title },
    });
    await prisma.post.create({
      data: { threadId: thread.id, authorId: user.id, body: parsed.body },
    });

    boardId = parsed.boardId;
    threadId = thread.id;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "入力内容を確認してください。" };
    }
    if (error instanceof Error) return { error: error.message };
    throw error;
  }

  redirect(`/board/${boardId}/${threadId}`);
}

const createPostSchema = z.object({
  threadId: z.string().min(1),
  boardId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

export async function createPost(formData: FormData) {
  const user = await verifySession();

  if (user.boardBannedAt) {
    throw new Error("掲示板の利用が停止されています。");
  }

  await enforceRateLimit("board-post", user.id, 20, 300);

  const parsed = createPostSchema.parse({
    threadId: formData.get("threadId"),
    boardId: formData.get("boardId"),
    body: formData.get("body"),
  });

  const visible = await canView(user, "BOARD", parsed.boardId);
  if (!visible) {
    throw new Error("この板に投稿する権限がありません。");
  }

  await prisma.post.create({
    data: { threadId: parsed.threadId, authorId: user.id, body: parsed.body },
  });

  revalidatePath(`/board/${parsed.boardId}/${parsed.threadId}`);
}

const banSchema = z.object({ userId: z.string().min(1) });

export async function banBoardUser(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_BAN_BOARD_USER);
  const { userId } = banSchema.parse({ userId: formData.get("userId") });

  if (userId === actor.id) {
    throw new Error("自分自身をBANすることはできません。");
  }

  await prisma.user.update({ where: { id: userId }, data: { boardBannedAt: new Date() } });

  await recordAudit({
    actorId: actor.id,
    action: "BOARD_BAN",
    targetType: "User",
    targetId: userId,
  });

  revalidatePath("/board");
}

const deletePostSchema = z.object({
  postId: z.string().min(1),
  boardId: z.string().min(1),
  threadId: z.string().min(1),
});

export async function deletePost(formData: FormData) {
  const user = await verifySession();

  const parsed = deletePostSchema.parse({
    postId: formData.get("postId"),
    boardId: formData.get("boardId"),
    threadId: formData.get("threadId"),
  });

  const post = await prisma.post.findUniqueOrThrow({ where: { id: parsed.postId } });
  const canModerate = (user.role.permissions & PERMISSIONS.CAN_BAN_BOARD_USER) !== 0n;
  if (post.authorId !== user.id && !canModerate) {
    throw new Error("このレスを削除する権限がありません。");
  }

  await prisma.post.delete({ where: { id: parsed.postId } });
  revalidatePath(`/board/${parsed.boardId}/${parsed.threadId}`);
}

const deleteThreadSchema = z.object({ threadId: z.string().min(1), boardId: z.string().min(1) });

export async function deleteThread(formData: FormData) {
  const user = await verifySession();

  const { threadId, boardId } = deleteThreadSchema.parse({
    threadId: formData.get("threadId"),
    boardId: formData.get("boardId"),
  });

  const thread = await prisma.thread.findUniqueOrThrow({ where: { id: threadId } });
  const canModerate = (user.role.permissions & PERMISSIONS.CAN_BAN_BOARD_USER) !== 0n;
  if (thread.authorId !== user.id && !canModerate) {
    throw new Error("このスレッドを削除する権限がありません。");
  }

  await prisma.thread.delete({ where: { id: threadId } });
  redirect(`/board/${boardId}`);
}

const deleteBoardSchema = z.object({ boardId: z.string().min(1) });

export async function deleteBoard(formData: FormData) {
  const user = await verifySession();

  const { boardId } = deleteBoardSchema.parse({ boardId: formData.get("boardId") });

  const board = await prisma.board.findUniqueOrThrow({ where: { id: boardId } });
  const canModerate = (user.role.permissions & PERMISSIONS.CAN_BAN_BOARD_USER) !== 0n;
  if (board.creatorId !== user.id && !canModerate) {
    throw new Error("この板を削除する権限がありません。");
  }

  await prisma.board.delete({ where: { id: boardId } });
  await deleteVisibilityPolicy("BOARD", boardId);
  redirect("/board");
}

export async function unbanBoardUser(formData: FormData) {
  const actor = await requirePermission(PERMISSIONS.CAN_BAN_BOARD_USER);
  const { userId } = banSchema.parse({ userId: formData.get("userId") });

  await prisma.user.update({ where: { id: userId }, data: { boardBannedAt: null } });

  await recordAudit({
    actorId: actor.id,
    action: "BOARD_UNBAN",
    targetType: "User",
    targetId: userId,
  });

  revalidatePath("/board");
}
