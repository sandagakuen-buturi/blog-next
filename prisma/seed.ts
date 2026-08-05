import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { DEFAULT_ROLES } from "../src/lib/permissions";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { level: role.level, permissions: role.permissions },
      create: {
        name: role.name,
        level: role.level,
        permissions: role.permissions,
        isCustom: false,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_ROLES.length} default roles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
