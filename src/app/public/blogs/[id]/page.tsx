import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/visibility";
import { Badge } from "@/components/ui/badge";
import { SafeMarkdown } from "@/components/safe-markdown";
import { AttachmentList } from "@/components/attachment-list";

export default async function PublicBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Link href="/public/blogs" className="text-muted-foreground w-fit text-sm hover:underline">
        ← 記事一覧に戻る
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">{post.author.name}</span>
          <span>·</span>
          <span>{post.publishedAt.toLocaleDateString("ja-JP")}</span>
          <Badge variant="outline">{post.department}課</Badge>
        </div>
      </div>

      <SafeMarkdown>{post.bodyMarkdown}</SafeMarkdown>

      <AttachmentList resourceType="BLOG_POST" resourceId={post.id} />

      <Link
        href={`/blog/${post.id}`}
        className="text-primary w-fit text-sm font-medium hover:underline"
      >
        コメントを見る・書く →
      </Link>
    </main>
  );
}
