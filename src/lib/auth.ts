import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMAIL_DOMAIN = "sandagakuen.ed.jp";

/** 新規ユーザー作成時にデフォルトで割り当てる「学生」ロールのIDを解決する。 */
async function resolveDefaultRoleId(): Promise<string> {
  const studentRole = await prisma.role.findUnique({ where: { name: "学生" } });
  if (!studentRole) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Default role '学生' is not seeded. Run `bun run db:seed` first.",
    });
  }
  return studentRole.id;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // UXのヒントとしてドメインを絞るが、偽装され得るため信頼しない。
      // 実際の検証は signIn.before フックで必ず行う。
      hd: ALLOWED_EMAIL_DOMAIN,
    },
  },
  user: {
    additionalFields: {
      roleId: { type: "string", required: true, input: false },
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
          return {
            data: {
              ...user,
              roleId: await resolveDefaultRoleId(),
            },
          };
        },
      },
    },
  },
});
