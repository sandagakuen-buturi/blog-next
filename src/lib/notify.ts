import "server-only";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { notifyDiscord } from "@/lib/discord";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** サイト内通知を1件作成する。 */
export async function notifyInApp(userId: string, type: string, message: string, link?: string) {
  await prisma.notification.create({ data: { userId, type, message, link } });
}

/**
 * 申請イベント(申請/承認依頼/承認/却下/差し戻し)は、Q3-5の決定通り
 * サイト内通知・Discord(システム通知チャンネル)・Resendメールの3系統全てに送る。
 */
export async function notifyApplicationEvent(params: {
  userIds: string[];
  type: string;
  message: string;
  link: string;
}) {
  const { userIds, type, message, link } = params;
  if (userIds.length === 0) return;

  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });

  await Promise.all(users.map((u) => notifyInApp(u.id, type, message, link)));

  await notifyDiscord("SYSTEM", `🔔 ${message}`);

  if (resend) {
    await Promise.all(
      users.map((u) =>
        resend!.emails
          .send({
            from: "物理部ブログ <onboarding@resend.dev>",
            to: u.email,
            subject: "【物理部ブログ】申請の通知",
            text: message,
          })
          .catch((error) => console.error("[resend] failed to send notification email:", error)),
      ),
    );
  }
}
