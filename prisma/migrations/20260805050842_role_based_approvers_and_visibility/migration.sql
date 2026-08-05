-- AlterEnum
BEGIN;
CREATE TYPE "ApproverType_new" AS ENUM ('SPECIFIC_ROLE', 'SPECIFIC_USERS');
ALTER TABLE "ApprovalStep" ALTER COLUMN "approverType" TYPE "ApproverType_new" USING ("approverType"::text::"ApproverType_new");
ALTER TYPE "ApproverType" RENAME TO "ApproverType_old";
ALTER TYPE "ApproverType_new" RENAME TO "ApproverType";
DROP TYPE "public"."ApproverType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VisibilityScope_new" AS ENUM ('PUBLIC_STUDENT', 'DEPARTMENT_ONLY', 'MEMBERS_ONLY', 'SPECIFIC_ROLE', 'SPECIFIC_USERS');
ALTER TABLE "VisibilityPolicy" ALTER COLUMN "scope" TYPE "VisibilityScope_new" USING ("scope"::text::"VisibilityScope_new");
ALTER TYPE "VisibilityScope" RENAME TO "VisibilityScope_old";
ALTER TYPE "VisibilityScope_new" RENAME TO "VisibilityScope";
DROP TYPE "public"."VisibilityScope_old";
COMMIT;

-- AlterTable
ALTER TABLE "ApprovalStep" DROP COLUMN "minRoleLevel",
ADD COLUMN     "approverRoleId" TEXT;

-- AlterTable
ALTER TABLE "VisibilityPolicy" DROP COLUMN "minRoleLevel",
ADD COLUMN     "targetRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "VisibilityPolicy" ADD CONSTRAINT "VisibilityPolicy_targetRoleId_fkey" FOREIGN KEY ("targetRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_approverRoleId_fkey" FOREIGN KEY ("approverRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
