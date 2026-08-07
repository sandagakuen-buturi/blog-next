import { Skeleton } from "@/components/ui/skeleton";

export default function PublicBlogPostLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </main>
  );
}
