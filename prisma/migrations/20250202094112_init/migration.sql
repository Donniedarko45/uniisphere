/*
  Warnings:

  - Added the required column `expiresAt` to the `otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "coverUrl" DROP NOT NULL,
ALTER COLUMN "pdfUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "otp" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
