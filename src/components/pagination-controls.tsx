import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PaginationControls({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {prevPage >= 1 ? (
        <Button variant="outline" size="sm" render={<Link href={`?page=${prevPage}`} />} nativeButton={false}>
          前へ
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          前へ
        </Button>
      )}
      <span className="text-muted-foreground text-sm">
        {currentPage} / {totalPages} ページ
      </span>
      {nextPage <= totalPages ? (
        <Button variant="outline" size="sm" render={<Link href={`?page=${nextPage}`} />} nativeButton={false}>
          次へ
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          次へ
        </Button>
      )}
    </div>
  );
}

export function resolvePage(pageParam: string | string[] | undefined, totalPages: number) {
  const raw = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, Math.max(totalPages, 1));
}
