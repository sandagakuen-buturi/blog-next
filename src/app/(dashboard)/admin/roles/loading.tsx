import { TableSkeleton } from "@/components/skeletons";

export default function AdminRolesLoading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <TableSkeleton rows={5} />
    </main>
  );
}
