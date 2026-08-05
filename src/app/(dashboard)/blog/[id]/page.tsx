import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/visibility";
import { PERMISSIONS } from "@/lib/permissions";
import { SafeMarkdown } from "@/components/safe-markdown";
import { AttachmentList } from "@/components/attachment-list";
import { FileUploadWidget } from "@/components/file-upload-widget";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CommentSection } from "./comment-section";
import { deleteBlogPost } from "../actions";

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifySession();

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: true },
  });
  if (!post || !post.publishedAt || post.publishedAt > new Date()) {
    notFound();
  }

  const visible = await canView(user, "BLOG_POST", post.id);
  if (!visible) {
    notFound();
  }

  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });

  const canModerate = (user.role.permissions & PERMISSIONS.CAN_MODERATE_BLOG) !== 0n;
  const canDelete = post.authorId === user.id || canModerate;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{post.title}</h1>
          <p className="text-muted-foreground text-sm">
            {post.department}課 / {post.author.name} / {post.publishedAt.toLocaleDateString("ja-JP")}
          </p>
        </div>
        {canDelete && (
          <form action={deleteBlogPost}>
            <input type="hidden" name="postId" value={post.id} />
            <ConfirmSubmitButton
              confirmMessage="この記事を削除しますか?元に戻せません。"
              variant="destructive"
              size="sm"
            >
              削除
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      <SafeMarkdown>{post.bodyMarkdown}</SafeMarkdown>

      <AttachmentList resourceType="BLOG_POST" resourceId={post.id} />

      {canDelete && <FileUploadWidget resourceType="BLOG_POST" resourceId={post.id} />}

      <CommentSection
        postId={post.id}
        comments={comments}
        currentUserId={user.id}
        canModerate={canModerate}
      />
    </main>
  );
}
