-- CreateTable
CREATE TABLE "account" (
    "account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_first_name" TEXT NOT NULL,
    "account_last_name" TEXT NOT NULL,
    "account_email" TEXT NOT NULL,
    "account_password" TEXT NOT NULL,
    "account_type" TEXT DEFAULT 'admin',
    "account_status" TEXT DEFAULT 'active',
    "account_contact_number" TEXT,
    "account_permissions" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("account_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_account_email_key" ON "account"("account_email");
