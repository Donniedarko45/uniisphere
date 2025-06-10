/*
  Warnings:

  - You are about to drop the column `contentVideo` on the `Blogs` table. All the data in the column will be lost.
  - You are about to drop the column `titlePhoto` on the `Blogs` table. All the data in the column will be lost.
  - The `mediaUrl` column on the `Blogs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Blogs" DROP COLUMN "contentVideo",
DROP COLUMN "titlePhoto",
DROP COLUMN "mediaUrl",
ADD COLUMN     "mediaUrl" TEXT[];
