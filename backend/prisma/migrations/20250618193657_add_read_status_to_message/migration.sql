-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "readByStudent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readByTeacher" BOOLEAN NOT NULL DEFAULT false;
