-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_authorId_fkey";

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mealPlanSharedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
