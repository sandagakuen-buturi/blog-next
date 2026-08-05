import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/visibility";
import { PERMISSIONS } from "@/lib/permissions";
import { SafeMarkdown } from "@/components/safe-markdown";
import { CommentSection } from "./comment-section";

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

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{post.title}</h1>
        <p className="text-muted-foreground text-sm">
          {post.department}課 / {post.author.name} / {post.publishedAt.toLocaleDateString("ja-JP")}
        </p>
      </div>

      <SafeMarkdown>{post.bodyMarkdown}</SafeMarkdown>

      <CommentSection
        postId={post.id}
        comments={comments}
        currentUserId={user.id}
        canModerate={(user.role.permissions & PERMISSIONS.CAN_MODERATE_BLOG) !== 0n}
      />
    </main>
  );
}
