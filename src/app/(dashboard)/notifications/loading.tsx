import { ListSkeleton } from "@/components/skeletons";

export default function NotificationsLoading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <ListSkeleton rows={6} />
    </main>
  );
}
