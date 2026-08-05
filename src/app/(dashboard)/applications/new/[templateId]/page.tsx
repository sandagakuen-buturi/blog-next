import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { fieldDefSchema } from "@/lib/application-fields";
import { z } from "zod";
import { NewApplicationForm } from "./new-application-form";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  await verifySession();
  const { templateId } = await params;

  const template = await prisma.applicationTemplate.findUnique({ where: { id: templateId } });
  if (!template) notFound();

  const fields = z.array(fieldDefSchema).parse(template.fields);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{template.name}</h1>
      <NewApplicationForm templateId={template.id} fields={fields} />
    </main>
  );
}
