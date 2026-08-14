-- AlterTable
ALTER TABLE "users" ADD COLUMN "totalchatAttendantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_totalchatAttendantId_key" ON "users"("totalchatAttendantId");
