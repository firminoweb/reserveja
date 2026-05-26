/*
  Warnings:

  - You are about to drop the column `facebookUrl` on the `Establishment` table. All the data in the column will be lost.
  - You are about to drop the column `instagramUrl` on the `Establishment` table. All the data in the column will be lost.
  - You are about to drop the column `tiktokUrl` on the `Establishment` table. All the data in the column will be lost.
  - You are about to drop the column `youtubeUrl` on the `Establishment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Establishment" DROP COLUMN "facebookUrl",
DROP COLUMN "instagramUrl",
DROP COLUMN "tiktokUrl",
DROP COLUMN "youtubeUrl",
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "youtube" TEXT;
