import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { evaluatePolicy } from "@/lib/visibility";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/lib/permissions";
import { PaginationControls, resolvePage } from "@/components/pagination-controls";

const PAGE_SIZE = 50;

export default async function BlogListPage(props: PageProps<"/blog">) {
  const user = await verifySession();

  const where = { publishedAt: { lte: new Date() } };
  const total = await prisma.blogPost.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = resolvePage((await props.searchParams).page, totalPages);

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">ブログ</h1>
          <p className="text-muted-foreground mt-1 text-sm">部内のお知らせと活動記録</p>
        </div>
        {canPost && (
          <Button render={<Link href="/blog/new" />} nativeButton={false}>
            投稿する
          </Button>
        )}
      </div>

      <ul className="grid gap-3">
        {visiblePosts.map((post) => (
          <li key={post.id} className="rounded-lg border bg-card p-4 shadow-xs transition-colors hover:border-primary/25 hover:bg-muted/35">
            <Link href={`/blog/${post.id}`} className="text-base font-semibold tracking-tight hover:underline">
              {post.title}
            </Link>
            <p className="text-muted-foreground mt-1 text-sm">
              {post.department}課 / {post.author.name} /{" "}
              {post.publishedAt?.toLocaleDateString("ja-JP")}
            </p>
          </li>
        ))}
        {visiblePosts.length === 0 && (
          <p className="text-muted-foreground rounded-lg border border-dashed bg-card/60 px-4 py-8 text-center text-sm">
            閲覧可能な記事はまだありません。
          </p>
        )}
      </ul>

      <PaginationControls currentPage={page} totalPages={totalPages} />
    </main>
  );
}
