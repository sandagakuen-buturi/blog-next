import "server-only";
import { prisma } from "@/lib/prisma";

type RecordAuditInput = {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
};

/** 管理系操作(ロール変更・申請決定・Webhook設定変更・一括メール・BAN等)の記録に使う。 */
export async function recordAudit(input: RecordAuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      before: input.before === undefined ? undefined : (input.before as object),
      after: input.after === undefined ? undefined : (input.after as object),
    },
  });
}
