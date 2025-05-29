/*
  Warnings:

  - You are about to alter the column `account_first_name` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `account_last_name` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `account_email` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `account_password` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `account_type` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.
  - You are about to alter the column `account_status` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - You are about to alter the column `account_contact_number` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.
  - Made the column `account_type` on table `account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_status` on table `account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_contact_number` on table `account` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "account" ALTER COLUMN "account_first_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "account_last_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "account_email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "account_password" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "account_type" SET NOT NULL,
ALTER COLUMN "account_type" DROP DEFAULT,
ALTER COLUMN "account_type" SET DATA TYPE VARCHAR(60),
ALTER COLUMN "account_status" SET NOT NULL,
ALTER COLUMN "account_status" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "account_contact_number" SET NOT NULL,
ALTER COLUMN "account_contact_number" SET DATA TYPE VARCHAR(60);
