import { DetailSkeleton } from "@/components/skeletons";

export default function NewApplicationLoading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <DetailSkeleton />
    </main>
  );
}
