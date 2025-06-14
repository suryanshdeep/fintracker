/*
  Warnings:

  - The `lastAlertSent` column on the `budgets` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "budgets_lastAlertSent_key";

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "lastAlertSent",
ADD COLUMN     "lastAlertSent" TIMESTAMP(3);
