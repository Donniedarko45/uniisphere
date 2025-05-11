/*
  Warnings:

  - You are about to drop the `AnonymousChat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnonymousMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnonymousChat" DROP CONSTRAINT "AnonymousChat_userId1_fkey";

-- DropForeignKey
ALTER TABLE "AnonymousChat" DROP CONSTRAINT "AnonymousChat_userId2_fkey";

-- DropForeignKey
ALTER TABLE "AnonymousMessage" DROP CONSTRAINT "AnonymousMessage_chatId_fkey";

-- DropTable
DROP TABLE "AnonymousChat";

-- DropTable
DROP TABLE "AnonymousMessage";

-- CreateTable
CREATE TABLE "HumanLib" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,

    CONSTRAINT "HumanLib_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HumanLib" ADD CONSTRAINT "HumanLib_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanLib" ADD CONSTRAINT "HumanLib_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
