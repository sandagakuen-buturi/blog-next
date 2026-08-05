import { requirePermission } from "@/lib/dal";
import { PERMISSIONS } from "@/lib/permissions";
import { NewQuestionForm } from "./new-question-form";

export default async function NewQuestionPage() {
  await requirePermission(PERMISSIONS.CAN_ASK_QA);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">質問する</h1>
      <NewQuestionForm />
    </main>
  );
}
