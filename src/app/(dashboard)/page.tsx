import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { evaluatePolicy } from "@/lib/visibility";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await verifySession();

  const [unreadCount, myApplicationCount, pendingApplicationCount, recentPosts] =
    await Promise.all([
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      prisma.application.count({ where: { applicantId: user.id } }),
      prisma.application.count({ where: { applicantId: user.id, status: "PENDING" } }),
      prisma.blogPost.findMany({
        where: { publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: "desc" },
        take: 20,
        include: { author: true },
      }),
    ]);

  const policies = await prisma.visibilityPolicy.findMany({
    where: { resourceType: "BLOG_POST", resourceId: { in: recentPosts.map((p) => p.id) } },
  });
  const policyByPostId = new Map(policies.map((p) => [p.resourceId, p]));
  const visiblePosts = recentPosts
    .filter((post) => {
      const policy = policyByPostId.get(post.id);
      return policy && evaluatePolicy(user, policy);
    })
    .slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8">
      <div className="border-b pb-5">
        <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ようこそ、{user.name}さん({user.role.name}
          {user.department ? ` / ${user.department}課` : ""})
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/notifications">
          <Card className="h-full transition-colors hover:border-primary/30 hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                未読通知
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl leading-none font-semibold tracking-tight">
              {unreadCount}
            </CardContent>
          </Card>
        </Link>
        <Link href="/applications">
          <Card className="h-full transition-colors hover:border-primary/30 hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                審査中の自分の申請
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl leading-none font-semibold tracking-tight">
              {pendingApplicationCount}
            </CardContent>
          </Card>
        </Link>
        <Link href="/applications">
          <Card className="h-full transition-colors hover:border-primary/30 hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                提出した申請の総数
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl leading-none font-semibold tracking-tight">
              {myApplicationCount}
            </CardContent>
          </Card>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">新着ブログ</h2>
          <Link href="/blog" className="text-primary text-sm font-medium hover:underline">
            すべて見る
          </Link>
        </div>
        <ul className="flex flex-col gap-2">
          {visiblePosts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-3 text-sm shadow-xs transition-colors hover:border-primary/25 hover:bg-muted/40"
              >
                <span className="min-w-0 truncate font-medium">{post.title}</span>
                <Badge variant="outline">{post.department}課</Badge>
              </Link>
            </li>
          ))}
          {visiblePosts.length === 0 && (
            <p className="text-muted-foreground rounded-lg border border-dashed bg-card/60 px-4 py-6 text-center text-sm">
              閲覧可能な記事はまだありません。
            </p>
          )}
        </ul>
      </section>
    </div>
  );
}
