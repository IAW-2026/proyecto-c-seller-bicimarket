-- AlterTable
ALTER TABLE "products" ADD COLUMN "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_idempotency_key_key" ON "products"("idempotency_key");
