import { ListSkeleton } from "@/components/skeletons";

export default function BoardListLoading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <ListSkeleton rows={4} />
    </main>
  );
}
