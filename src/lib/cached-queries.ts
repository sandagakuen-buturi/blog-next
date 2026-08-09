import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * ロール一覧はセレクトボックス/テーブル表示にしか使わないページが大半で、変更頻度も低い
 * (管理者操作のみ)ため、admin/roles/actions.tsのミューテーションで明示的に無効化するタグ付き
 * キャッシュとして扱う。Next.jsのData CacheはJSON.stringifyで永続化するため、
 * BigInt(permissions)を含めるとシリアライズに失敗する — 呼び出し側は誰もpermissionsを
 * 読まないので、selectで最初から除外する。
 */
export const getCachedRoles = unstable_cache(
  async () =>
    prisma.role.findMany({
      select: { id: true, name: true, level: true, isCustom: true },
      orderBy: { level: "asc" },
    }),
  ["roles"],
  { tags: ["roles"], revalidate: 300 },
);

export const getCachedApplicationTemplates = unstable_cache(
  async () => prisma.applicationTemplate.findMany({ orderBy: { createdAt: "asc" } }),
  ["application-templates"],
  { tags: ["application-templates"], revalidate: 300 },
);

export const getCachedApplicationTemplatesWithSteps = unstable_cache(
  async () =>
    prisma.applicationTemplate.findMany({
      include: { steps: true },
      orderBy: { createdAt: "asc" },
    }),
  ["application-templates-with-steps"],
  { tags: ["application-templates"], revalidate: 300 },
);

/**
 * 板一覧(カテゴリ)は頻繁には増減しないが、_count.threadsは投稿があるたびに変わる。
 * revalidateはboard作成/削除時のみタグで即時無効化し、スレッド数の反映は
 * revalidate:60(秒)の範囲で多少遅延することを許容する。
 */
export const getCachedBoards = unstable_cache(
  async () =>
    prisma.board.findMany({
      include: { _count: { select: { threads: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ["boards"],
  { tags: ["boards"], revalidate: 60 },
);
