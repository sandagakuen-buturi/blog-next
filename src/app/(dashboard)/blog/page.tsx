import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { evaluatePolicy } from "@/lib/visibility";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/lib/permissions";

export default async function BlogListPage() {
  const user = await verifySession();

  const posts = await prisma.blogPost.findMany({
    where: { publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { author: true },
  });

  const policies = await prisma.visibilityPolicy.findMany({
    where: { resourceType: "BLOG_POST", resourceId: { in: posts.map((p) => p.id) } },
  });
  const policyByPostId = new Map(policies.map((p) => [p.resourceId, p]));

  const visiblePosts = posts.filter((post) => {
    const policy = policyByPostId.get(post.id);
    return policy && evaluatePolicy(user, policy);
  });

  const canPost = (user.role.permissions & PERMISSIONS.CAN_POST_BLOG) !== 0n;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ブログ</h1>
        {canPost && (
          <Button render={<Link href="/blog/new" />} nativeButton={false}>
            投稿する
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {visiblePosts.map((post) => (
          <li key={post.id} className="rounded-lg border p-4">
            <Link href={`/blog/${post.id}`} className="text-lg font-medium hover:underline">
              {post.title}
            </Link>
            <p className="text-muted-foreground text-sm">
              {post.department}課 / {post.author.name} /{" "}
              {post.publishedAt?.toLocaleDateString("ja-JP")}
            </p>
          </li>
        ))}
        {visiblePosts.length === 0 && (
          <p className="text-muted-foreground text-sm">閲覧可能な記事はまだありません。</p>
        )}
      </ul>
    </main>
  );
}
