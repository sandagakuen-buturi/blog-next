"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const markReadSchema = z.object({ notificationId: z.string().min(1) });

export async function markNotificationRead(formData: FormData) {
  const user = await verifySession();
  const { notificationId } = markReadSchema.parse({
    notificationId: formData.get("notificationId"),
  });

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
}
