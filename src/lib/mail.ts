import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendBulkEmail(recipients: string[], subject: string, body: string) {
  if (!resend) {
    throw new Error("RESEND_API_KEYが設定されていないため送信できません。");
  }
  if (recipients.length === 0) {
    throw new Error("送信対象が0件です。");
  }

  // Resendは1回の呼び出しで多数のtoを受け付けられるが、宛先間で互いのアドレスが
  // 見えてしまわないよう、bccとして1件ずつ個別に送信する。
  await Promise.all(
    recipients.map((to) =>
      resend!.emails.send({
        from: "物理部ブログ <onboarding@resend.dev>",
        to,
        subject,
        text: body,
      }),
    ),
  );
}
