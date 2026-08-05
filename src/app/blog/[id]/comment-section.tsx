"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment, deleteComment } from "../actions";

type Comment = {
  id: string;
  authorId: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  author: { name: string };
};

function CommentForm({
  postId,
  parentId,
  onDone,
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            await createComment(formData);
            onDone?.();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "投稿に失敗しました。");
          }
        })
      }
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <Textarea name="body" required rows={parentId ? 2 : 3} placeholder="コメントを書く" />
      <Button type="submit" size="sm" disabled={isPending} className="w-fit">
        {parentId ? "返信する" : "コメントする"}
      </Button>
    </form>
  );
}

function DeleteCommentButton({ commentId, postId }: { commentId: string; postId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="text-muted-foreground text-xs hover:underline"
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("commentId", commentId);
          formData.set("postId", postId);
          try {
            await deleteComment(formData);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "削除に失敗しました。");
          }
        })
      }
    >
      削除
    </button>
  );
}

export function CommentSection({
  postId,
  comments,
  currentUserId,
  canModerate,
}: {
  postId: string;
  comments: Comment[];
  currentUserId: string;
  canModerate: boolean;
}) {
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = new Map<string, Comment[]>();
  for (const comment of comments) {
    if (comment.parentId) {
      repliesByParent.set(comment.parentId, [
        ...(repliesByParent.get(comment.parentId) ?? []),
        comment,
      ]);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">コメント ({comments.length})</h2>

      <CommentForm postId={postId} />

      <ul className="flex flex-col gap-4">
        {topLevel.map((comment) => (
          <li key={comment.id} className="flex flex-col gap-2 rounded-lg border p-3">
            <CommentBody comment={comment} postId={postId} currentUserId={currentUserId} canModerate={canModerate} />

            <ul className="ml-6 flex flex-col gap-2 border-l pl-3">
              {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                <li key={reply.id}>
                  <CommentBody comment={reply} postId={postId} currentUserId={currentUserId} canModerate={canModerate} />
                </li>
              ))}
            </ul>

            <details className="ml-6">
              <summary className="text-muted-foreground w-fit cursor-pointer text-xs">
                返信する
              </summary>
              <div className="mt-2">
                <CommentForm postId={postId} parentId={comment.id} />
              </div>
            </details>
          </li>
        ))}
        {topLevel.length === 0 && (
          <p className="text-muted-foreground text-sm">まだコメントはありません。</p>
        )}
      </ul>
    </section>
  );
}

function CommentBody({
  comment,
  postId,
  currentUserId,
  canModerate,
}: {
  comment: Comment;
  postId: string;
  currentUserId: string;
  canModerate: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{comment.author.name}</span>
        {(comment.authorId === currentUserId || canModerate) && (
          <DeleteCommentButton commentId={comment.id} postId={postId} />
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
    </div>
  );
}
