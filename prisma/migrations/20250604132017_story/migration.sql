/*
  Warnings:

  - You are about to drop the column `createdAt` on the `StoryView` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `StoryView` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[storyId,viewerId]` on the table `StoryView` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `viewerId` to the `StoryView` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StoryView" DROP CONSTRAINT "StoryView_userId_fkey";

-- DropIndex
DROP INDEX "StoryView_storyId_userId_key";

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "caption" TEXT;

-- AlterTable
ALTER TABLE "StoryView" DROP COLUMN "createdAt",
DROP COLUMN "userId",
ADD COLUMN     "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "viewerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "Semester" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_storyId_viewerId_key" ON "StoryView"("storyId", "viewerId");

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
