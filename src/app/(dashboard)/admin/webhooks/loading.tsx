import { Skeleton } from "@/components/ui/skeleton";

export default function AdminWebhooksLoading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
