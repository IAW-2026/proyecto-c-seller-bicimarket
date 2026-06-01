-- E2: soft delete en seller_profiles
ALTER TABLE "seller_profiles" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- B8: idempotency_key en product_images
ALTER TABLE "product_images" ADD COLUMN "idempotency_key" TEXT;
CREATE UNIQUE INDEX "product_images_idempotency_key_key" ON "product_images"("idempotency_key");

-- B8: idempotency_key en sales_orders
ALTER TABLE "sales_orders" ADD COLUMN "idempotency_key" TEXT;
CREATE UNIQUE INDEX "sales_orders_idempotency_key_key" ON "sales_orders"("idempotency_key");

-- E10: nuevos valores al enum SalesOrderShippingStatus
ALTER TYPE "SalesOrderShippingStatus" ADD VALUE IF NOT EXISTS 'created';
ALTER TYPE "SalesOrderShippingStatus" ADD VALUE IF NOT EXISTS 'failed_delivery';

-- E4: índice full-text en products.title (GIN para búsqueda en español)
CREATE INDEX IF NOT EXISTS "products_title_fts_idx" ON "products" USING GIN (to_tsvector('spanish', "title"));
