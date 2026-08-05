import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STUDENT_ROLE_ID } from "@/lib/permissions";

const ALLOWED_EMAIL_DOMAIN = "sandagakuen.ed.jp";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // UXのヒントとしてドメインを絞るが、偽装され得るため信頼しない。
      // 実際の検証は databaseHooks.user.create.before で必ず行う。
      hd: ALLOWED_EMAIL_DOMAIN,
    },
  },
  user: {
    additionalFields: {
      // defaultValue は同期関数のみ許容(Better-Authがrequiredチェック前に同期評価するため)、
      // よってDBルックアップではなく固定IDのシード済みロールを既定値にする。
      roleId: { type: "string", required: true, input: false, defaultValue: () => DEFAULT_STUDENT_ROLE_ID },
      department: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
            throw new APIError("FORBIDDEN", {
              message: `Only @${ALLOWED_EMAIL_DOMAIN} accounts are allowed to sign in.`,
            });
          }
        },
      },
    },
  },
});
