import { DetailSkeleton } from "@/components/skeletons";

export default function ApplicationDetailLoading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <DetailSkeleton />
    </main>
  );
}
