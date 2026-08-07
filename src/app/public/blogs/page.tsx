import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { evaluatePolicy } from "@/lib/visibility";
import { createExcerpt } from "@/lib/excerpt";
import { Badge } from "@/components/ui/badge";
import { PaginationControls, resolvePage } from "@/components/pagination-controls";

const PAGE_SIZE = 20;

export default async function PublicBlogsPage(props: PageProps<"/public/blogs">) {
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ブログ</h1>
          <p className="text-muted-foreground mt-1 text-sm">部内の記事をまとめて読めます</p>
        </div>
        <Link href="/" className="text-primary text-sm font-medium hover:underline">
          ダッシュボードへ
        </Link>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {visiblePosts.map((post) => (
          <li key={post.id} className="py-6 first:pt-0">
            <Link href={`/public/blogs/${post.id}`} className="group flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight group-hover:underline">
                {post.title}
              </h2>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {createExcerpt(post.bodyMarkdown)}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">{post.author.name}</span>
                <span>·</span>
                <span>{post.publishedAt?.toLocaleDateString("ja-JP")}</span>
                <Badge variant="outline">{post.department}課</Badge>
              </div>
            </Link>
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
