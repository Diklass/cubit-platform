/*
  Warnings:

  - You are about to drop the column `readByStudent` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `readByTeacher` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "readByStudent",
DROP COLUMN "readByTeacher",
ALTER COLUMN "attachmentUrl" DROP NOT NULL,
ALTER COLUMN "attachmentUrl" DROP DEFAULT,
ALTER COLUMN "attachmentUrl" SET DATA TYPE TEXT;
