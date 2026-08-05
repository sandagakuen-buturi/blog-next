"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, verifySession } from "@/lib/dal";
import { canView, setVisibilityPolicy, type VisibilityInput } from "@/lib/visibility";
import { notifyDiscord } from "@/lib/discord";
import { PERMISSIONS } from "@/lib/permissions";

const visibilitySchema: z.ZodType<VisibilityInput> = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("PUBLIC_STUDENT") }),
  z.object({ scope: z.literal("MEMBERS_ONLY") }),
  z.object({ scope: z.literal("DEPARTMENT_ONLY"), targetDepartment: z.enum(["IT", "ROBOT", "HYBRID"]) }),
  z.object({ scope: z.literal("ROLE_LEVEL_GTE"), minRoleLevel: z.coerce.number().int() }),
  z.object({ scope: z.literal("SPECIFIC_USERS"), targetUserIds: z.array(z.string()) }),
]);

const createPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  bodyMarkdown: z.string().trim().min(1),
  targetDepartment: z.enum(["IT", "ROBOT"]).optional(),
  publishedAt: z.coerce.date().optional(),
  visibility: visibilitySchema,
});

export type CreatePostState = { error?: string };

/**
 * useActionState と組んで使う。バリデーション/権限エラーは投げずに { error } を返す —
 * redirect() は成功時にこの関数の外側(try/catchの外)で1回だけ呼ばれるので、
 * Next.jsのNEXT_REDIRECT特殊例外を誤って握りつぶすことがない。
 */
export async function createBlogPost(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  let redirectTo: string;

  try {
    const author = await requirePermission(PERMISSIONS.CAN_POST_BLOG);

    if (!author.department) {
      return {
        error: "所属課が設定されていないため投稿できません。システム管理者に所属課の設定を依頼してください。",
      };
    }

    const rawVisibility = formData.get("visibilityScope");
    const visibility: VisibilityInput =
      rawVisibility === "DEPARTMENT_ONLY"
        ? { scope: "DEPARTMENT_ONLY", targetDepartment: author.department }
        : rawVisibility === "ROLE_LEVEL_GTE"
          ? { scope: "ROLE_LEVEL_GTE", minRoleLevel: Number(formData.get("minRoleLevel")) }
          : rawVisibility === "SPECIFIC_USERS"
            ? {
                scope: "SPECIFIC_USERS",
                targetUserIds: String(formData.get("targetUserIds") ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }
            : rawVisibility === "MEMBERS_ONLY"
              ? { scope: "MEMBERS_ONLY" }
              : { scope: "PUBLIC_STUDENT" };

    const parsed = createPostSchema.parse({
      title: formData.get("title"),
      bodyMarkdown: formData.get("bodyMarkdown"),
      targetDepartment: formData.get("targetDepartment") || undefined,
      publishedAt: formData.get("publishedAt") || undefined,
      visibility,
    });

    // ハイブリッド課員は投稿時にIT課/ロボット課どちらのブログに載せるか選ぶ。それ以外は自分の所属課に固定。
    if (author.department === "HYBRID" && !parsed.targetDepartment) {
      return { error: "ハイブリッド課員は投稿先(IT課/ロボット課)を選択してください。" };
    }
    const department = author.department === "HYBRID" ? parsed.targetDepartment! : author.department;

    const post = await prisma.blogPost.create({
      data: {
        authorId: author.id,
        department,
        title: parsed.title,
        bodyMarkdown: parsed.bodyMarkdown,
        publishedAt: parsed.publishedAt ?? new Date(),
      },
    });

    await setVisibilityPolicy("BLOG_POST", post.id, parsed.visibility);

    const isImmediatelyPublished = post.publishedAt !== null && post.publishedAt <= new Date();
    if (isImmediatelyPublished) {
      await notifyDiscord(department, `📝 新しいブログ投稿: **${post.title}**\n投稿者: ${author.name}`);
    }

    redirectTo = `/blog/${post.id}`;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "入力内容を確認してください。" };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(redirectTo);
}

const createCommentSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  body: z.string().trim().min(1).max(2000),
});

export async function createComment(formData: FormData) {
  const user = await verifySession();

  const parsed = createCommentSchema.parse({
    postId: formData.get("postId"),
    parentId: formData.get("parentId") || undefined,
    body: formData.get("body"),
  });

  const canSee = await canView(user, "BLOG_POST", parsed.postId);
  if (!canSee) {
    throw new Error("この記事を閲覧する権限がありません。");
  }

  if (parsed.parentId) {
    const parent = await prisma.comment.findUniqueOrThrow({ where: { id: parsed.parentId } });
    if (parent.parentId) {
      throw new Error("返信は1階層までです。");
    }
  }

  await prisma.comment.create({
    data: {
      postId: parsed.postId,
      authorId: user.id,
      parentId: parsed.parentId,
      body: parsed.body,
    },
  });

  revalidatePath(`/blog/${parsed.postId}`);
}

const deleteCommentSchema = z.object({
  commentId: z.string().min(1),
  postId: z.string().min(1),
});

export async function deleteComment(formData: FormData) {
  const user = await verifySession();

  const parsed = deleteCommentSchema.parse({
    commentId: formData.get("commentId"),
    postId: formData.get("postId"),
  });

  const comment = await prisma.comment.findUniqueOrThrow({ where: { id: parsed.commentId } });

  const isAuthor = comment.authorId === user.id;
  const canModerate = (user.role.permissions & PERMISSIONS.CAN_MODERATE_BLOG) !== 0n;
  if (!isAuthor && !canModerate) {
    throw new Error("このコメントを削除する権限がありません。");
  }

  await prisma.comment.delete({ where: { id: parsed.commentId } });
  revalidatePath(`/blog/${parsed.postId}`);
}
