/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TaxCondition" AS ENUM ('monotributo', 'responsable_inscripto', 'consumidor_final');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending_review', 'verified', 'suspended');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('mtb', 'road', 'urban', 'kids', 'bmx', 'parts', 'accessories');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('new', 'used_like_new', 'used_good', 'used_fair');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "SalesOrderPaymentStatus" AS ENUM ('pending', 'paid', 'refunded', 'settled');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('pending', 'accepted', 'rejected', 'preparing', 'ready_to_ship', 'handed_over', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "SalesOrderShippingStatus" AS ENUM ('pending', 'ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned');

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "tax_id" TEXT NOT NULL,
    "tax_condition" "TaxCondition" NOT NULL,
    "bank_account_reference" TEXT NOT NULL,
    "pickup_address" JSONB NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "seller_profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "condition" "ProductCondition" NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "weight_grams" INTEGER NOT NULL,
    "length_cm" INTEGER,
    "width_cm" INTEGER,
    "height_cm" INTEGER,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_seller_group_id" TEXT NOT NULL,
    "seller_profile_id" TEXT NOT NULL,
    "buyer_profile_id" TEXT NOT NULL,
    "buyer_clerk_user_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "payment_status" "SalesOrderPaymentStatus" NOT NULL DEFAULT 'pending',
    "fulfillment_status" "FulfillmentStatus" NOT NULL DEFAULT 'pending',
    "shipping_status" "SalesOrderShippingStatus" NOT NULL DEFAULT 'pending',
    "shipment_id" TEXT,
    "items_subtotal_cents" INTEGER NOT NULL,
    "shipping_cost_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "shipping_address_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name_snapshot" TEXT NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_status_history" (
    "id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_clerk_user_id_key" ON "seller_profiles"("clerk_user_id");

-- CreateIndex
CREATE INDEX "products_status_category_idx" ON "products"("status", "category");

-- CreateIndex
CREATE INDEX "products_seller_profile_id_idx" ON "products"("seller_profile_id");

-- CreateIndex
CREATE INDEX "products_brand_model_idx" ON "products"("brand", "model");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_product_id_position_key" ON "product_images"("product_id", "position");

-- CreateIndex
CREATE INDEX "sales_orders_seller_profile_id_fulfillment_status_idx" ON "sales_orders"("seller_profile_id", "fulfillment_status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_seller_profile_id_fkey" FOREIGN KEY ("seller_profile_id") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_status_history" ADD CONSTRAINT "sales_order_status_history_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
