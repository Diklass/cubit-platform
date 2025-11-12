-- CreateTable
CREATE TABLE "SubjectStudent" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubjectStudent_groupId_idx" ON "SubjectStudent"("groupId");

-- CreateIndex
CREATE INDEX "SubjectStudent_userId_idx" ON "SubjectStudent"("userId");

-- CreateIndex
CREATE INDEX "SubjectStudent_subjectId_idx" ON "SubjectStudent"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectStudent_subjectId_userId_key" ON "SubjectStudent"("subjectId", "userId");

-- CreateIndex
CREATE INDEX "StudentGroup_subjectId_idx" ON "StudentGroup"("subjectId");

-- AddForeignKey
ALTER TABLE "SubjectStudent" ADD CONSTRAINT "SubjectStudent_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectStudent" ADD CONSTRAINT "SubjectStudent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectStudent" ADD CONSTRAINT "SubjectStudent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGroup" ADD CONSTRAINT "StudentGroup_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
