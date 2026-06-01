-- Data migration: add resource prefixes to existing IDs
-- Skips rows that already have a prefix (idempotent).
-- Uses session_replication_role to bypass FK checks during the update.

SET session_replication_role = 'replica';

-- seller_profiles: slp_
UPDATE "seller_profiles" SET "id" = 'slp_' || "id" WHERE "id" NOT LIKE 'slp_%';

-- FK references to seller_profiles
UPDATE "products"     SET "seller_profile_id" = 'slp_' || "seller_profile_id" WHERE "seller_profile_id" NOT LIKE 'slp_%';
UPDATE "sales_orders" SET "seller_profile_id" = 'slp_' || "seller_profile_id" WHERE "seller_profile_id" NOT LIKE 'slp_%';

-- products: prd_
UPDATE "products" SET "id" = 'prd_' || "id" WHERE "id" NOT LIKE 'prd_%';

-- FK references to products
UPDATE "product_images"    SET "product_id" = 'prd_' || "product_id" WHERE "product_id" NOT LIKE 'prd_%';
UPDATE "sales_order_items" SET "product_id" = 'prd_' || "product_id" WHERE "product_id" NOT LIKE 'prd_%';

-- product_images: img_
UPDATE "product_images" SET "id" = 'img_' || "id" WHERE "id" NOT LIKE 'img_%';

-- sales_orders: sor_
UPDATE "sales_orders" SET "id" = 'sor_' || "id" WHERE "id" NOT LIKE 'sor_%';

-- FK references to sales_orders
UPDATE "sales_order_items"          SET "sales_order_id" = 'sor_' || "sales_order_id" WHERE "sales_order_id" NOT LIKE 'sor_%';
UPDATE "sales_order_status_history" SET "sales_order_id" = 'sor_' || "sales_order_id" WHERE "sales_order_id" NOT LIKE 'sor_%';

-- sales_order_items: soi_
UPDATE "sales_order_items" SET "id" = 'soi_' || "id" WHERE "id" NOT LIKE 'soi_%';

SET session_replication_role = 'origin';
