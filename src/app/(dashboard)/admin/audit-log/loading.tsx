import { TableSkeleton } from "@/components/skeletons";

export default function AuditLogLoading() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <TableSkeleton rows={8} />
    </main>
  );
}
