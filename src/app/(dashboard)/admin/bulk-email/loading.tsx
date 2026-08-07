import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons";

export default function BulkEmailLoading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <Skeleton className="h-40 w-full rounded-lg" />
      <TableSkeleton rows={4} />
    </main>
  );
}
