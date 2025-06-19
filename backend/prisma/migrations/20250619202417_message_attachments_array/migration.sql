-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "attachmentUrl" DROP NOT NULL,
ALTER COLUMN "attachmentUrl" DROP DEFAULT,
ALTER COLUMN "attachmentUrl" SET DATA TYPE TEXT;
