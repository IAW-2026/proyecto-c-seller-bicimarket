export const openapiSpec = {
  openapi: "3.1.0",
  info: {
    title: "BiciMarket — Seller App API",
    version: "1.0.0",
    description:
      "REST API for the Seller App of BiciMarket. Handles the product catalog, seller profiles, and sales orders (sub-orders per vendor). All endpoints live under `/api/v1/`. **Stock is unlimited** — no inventory management exists by design.",
  },
  servers: [{ url: "/api/v1", description: "Seller App" }],
  tags: [
    { name: "Seller Profile", description: "Seller profile management" },
    { name: "Products — Public", description: "Public product catalog (no auth required)" },
    { name: "Products — Private", description: "Product management (seller JWT required)" },
    { name: "Product Images", description: "Product image management" },
    { name: "Sales Orders", description: "Sub-orders created by Payments App after payment" },
    { name: "Sales Orders — Server-to-Server", description: "Endpoints called by other apps with X-Service-Token" },
    { name: "Settlements", description: "Seller liquidations — proxied from Payments App" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Clerk JWT from Seller App Clerk instance",
      },
      ServiceToken: {
        type: "apiKey",
        in: "header",
        name: "X-Service-Token",
        description: "Shared secret for server-to-server calls between apps",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "NOT_FOUND" },
              message: { type: "string", example: "Product not found" },
              details: { type: "object", additionalProperties: true },
            },
            required: ["code", "message"],
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", example: 87 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          has_more: { type: "boolean", example: true },
          next_cursor: { type: "string", nullable: true, example: null },
        },
      },
      DimensionsCm: {
        type: "object",
        properties: {
          length: { type: "integer", example: 180 },
          width: { type: "integer", example: 60 },
          height: { type: "integer", example: 110 },
        },
      },
      PickupAddress: {
        type: "object",
        properties: {
          street: { type: "string", example: "Av. Rivadavia" },
          number: { type: "string", example: "9000" },
          city: { type: "string", example: "Caballito" },
          province: { type: "string", example: "Buenos Aires" },
          postal_code: { type: "string", example: "C1406" },
          country: { type: "string", example: "AR" },
        },
      },
      SellerProfile: {
        type: "object",
        properties: {
          id: { type: "string", example: "slp_01H…" },
          clerk_user_id: { type: "string", example: "user_seller_xyz" },
          legal_name: { type: "string", example: "Bicicletería del Sur SRL" },
          display_name: { type: "string", example: "BiciSur" },
          tax_id: { type: "string", example: "30-71234567-8" },
          tax_condition: {
            type: "string",
            enum: ["monotributo", "responsable_inscripto", "consumidor_final"],
          },
          bank_account_reference: { type: "string", example: "mp_collector_123456789" },
          pickup_address: { $ref: "#/components/schemas/PickupAddress" },
          verification_status: {
            type: "string",
            enum: ["pending_review", "verified", "suspended"],
          },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ProductImage: {
        type: "object",
        properties: {
          id: { type: "string", example: "img_01H…" },
          url: { type: "string", example: "https://cdn.bicimarket.com/prd_01H…/1.jpg" },
          position: { type: "integer", example: 0 },
        },
      },
      ProductSummary: {
        type: "object",
        properties: {
          id: { type: "string", example: "prd_01H…" },
          seller_profile_id: { type: "string", example: "slp_01H…" },
          title: { type: "string", example: "Bicicleta Trek Marlin 5 - 2024" },
          brand: { type: "string", example: "Trek" },
          model: { type: "string", example: "Marlin 5" },
          category: {
            type: "string",
            enum: ["mtb", "road", "urban", "kids", "bmx", "parts", "accessories"],
          },
          price_cents: { type: "integer", example: 65000000 },
          currency: { type: "string", example: "ARS" },
          weight_grams: { type: "integer", example: 14500 },
          dimensions_cm: { $ref: "#/components/schemas/DimensionsCm", nullable: true },
          status: {
            type: "string",
            enum: ["draft", "active", "paused", "archived"],
          },
          main_image_url: { type: "string", nullable: true, example: "https://cdn.bicimarket.com/…/main.jpg" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Product: {
        allOf: [
          { $ref: "#/components/schemas/ProductSummary" },
          {
            type: "object",
            properties: {
              description: { type: "string", example: "MTB rodado 29, 24 velocidades." },
              condition: {
                type: "string",
                enum: ["new", "used_like_new", "used_good", "used_fair"],
              },
              seller_display_name: { type: "string", example: "BiciSur" },
              images: {
                type: "array",
                items: { $ref: "#/components/schemas/ProductImage" },
              },
            },
          },
        ],
      },
      ProductAvailability: {
        type: "object",
        properties: {
          product_id: { type: "string", example: "prd_01H…" },
          seller_profile_id: { type: "string", example: "slp_01H…" },
          status: { type: "string", example: "active" },
          available: { type: "boolean", example: true },
          unit_price_cents: { type: "integer", example: 65000000 },
          currency: { type: "string", example: "ARS" },
          weight_grams: { type: "integer", example: 14500 },
          dimensions_cm: { $ref: "#/components/schemas/DimensionsCm", nullable: true },
          checked_at: { type: "string", format: "date-time" },
        },
      },
      SalesOrderItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "soi_01H…" },
          product_id: { type: "string", example: "prd_01H…" },
          product_name_snapshot: { type: "string", example: "Bicicleta Trek Marlin 5" },
          unit_price_cents: { type: "integer", example: 65000000 },
          quantity: { type: "integer", example: 1 },
        },
      },
      SalesOrder: {
        type: "object",
        properties: {
          id: { type: "string", example: "sor_01H…" },
          order_id: { type: "string", example: "ord_01H…" },
          order_seller_group_id: { type: "string", example: "osg_01H…" },
          seller_profile_id: { type: "string", example: "slp_01H…" },
          buyer_profile_id: { type: "string", example: "byp_01H…" },
          fulfillment_status: {
            type: "string",
            enum: ["pending", "accepted", "rejected", "preparing", "ready_to_ship", "handed_over", "delivered", "cancelled"],
          },
          shipping_status: {
            type: "string",
            enum: ["pending", "ready_for_pickup", "picked_up", "in_transit", "out_for_delivery", "delivered", "returned"],
          },
          payment_status: {
            type: "string",
            enum: ["pending", "paid", "refunded", "settled"],
          },
          shipment_id: { type: "string", nullable: true, example: "shp_01H…" },
          shipping_quote_id: { type: "string", nullable: true, example: "qte_01H…" },
          items_subtotal_cents: { type: "integer", example: 65000000 },
          shipping_cost_cents: { type: "integer", example: 1200000 },
          total_cents: { type: "integer", example: 66200000 },
          currency: { type: "string", example: "ARS" },
          shipping_address_snapshot: { type: "object" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/SalesOrderItem" },
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/seller-profile/me": {
      get: {
        summary: "Get my seller profile",
        tags: ["Seller Profile"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Seller profile", content: { "application/json": { schema: { $ref: "#/components/schemas/SellerProfile" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Profile not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        summary: "Create or update my seller profile",
        tags: ["Seller Profile"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  legal_name: { type: "string", example: "Bicicletería del Sur SRL" },
                  display_name: { type: "string", example: "BiciSur" },
                  tax_id: { type: "string", example: "30-71234567-8" },
                  tax_condition: { type: "string", enum: ["monotributo", "responsable_inscripto", "consumidor_final"] },
                  bank_account_reference: { type: "string", example: "mp_collector_123456789" },
                  pickup_address: { $ref: "#/components/schemas/PickupAddress" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SellerProfile" } } } },
          201: { description: "Profile created", content: { "application/json": { schema: { $ref: "#/components/schemas/SellerProfile" } } } },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/seller-profile/{sellerProfileId}/pickup-address": {
      get: {
        summary: "Get seller pickup address (server-to-server, consumed by Shipping App)",
        tags: ["Seller Profile"],
        security: [{ ServiceToken: [] }],
        parameters: [
          { name: "sellerProfileId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Pickup address",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    seller_profile_id: { type: "string" },
                    pickup_address: { $ref: "#/components/schemas/PickupAddress" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/products": {
      get: {
        summary: "List active products (public catalog)",
        tags: ["Products — Public"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Full-text search on title" },
          { name: "category", in: "query", schema: { type: "string", enum: ["mtb", "road", "urban", "kids", "bmx", "parts", "accessories"] } },
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "condition", in: "query", schema: { type: "string", enum: ["new", "used_like_new", "used_good", "used_fair"] } },
          { name: "seller_id", in: "query", schema: { type: "string" } },
          { name: "min_price_cents", in: "query", schema: { type: "integer" } },
          { name: "max_price_cents", in: "query", schema: { type: "integer" } },
          { name: "sort", in: "query", schema: { type: "string", default: "-created_at" }, description: "Prefix with - for descending. E.g. -price_cents, created_at" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "Paginated product list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/ProductSummary" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a product (seller JWT required)",
        tags: ["Products — Private"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "brand", "model", "category", "condition", "price_cents", "weight_grams"],
                properties: {
                  title: { type: "string", example: "Bicicleta Trek Marlin 5 - 2024" },
                  description: { type: "string", example: "MTB rodado 29, 24 velocidades." },
                  brand: { type: "string", example: "Trek" },
                  model: { type: "string", example: "Marlin 5" },
                  category: { type: "string", enum: ["mtb", "road", "urban", "kids", "bmx", "parts", "accessories"] },
                  condition: { type: "string", enum: ["new", "used_like_new", "used_good", "used_fair"] },
                  price_cents: { type: "integer", example: 65000000 },
                  currency: { type: "string", default: "ARS" },
                  weight_grams: { type: "integer", example: 14500 },
                  dimensions_cm: { $ref: "#/components/schemas/DimensionsCm" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Product created (status=draft)", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          400: { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/products/{productId}": {
      get: {
        summary: "Get product detail (public)",
        tags: ["Products — Public"],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Product detail", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        summary: "Update a product (seller JWT required)",
        tags: ["Products — Private"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  brand: { type: "string" },
                  model: { type: "string" },
                  category: { type: "string", enum: ["mtb", "road", "urban", "kids", "bmx", "parts", "accessories"] },
                  condition: { type: "string", enum: ["new", "used_like_new", "used_good", "used_fair"] },
                  price_cents: { type: "integer" },
                  weight_grams: { type: "integer" },
                  dimensions_cm: { $ref: "#/components/schemas/DimensionsCm" },
                  status: { type: "string", enum: ["draft", "active", "paused", "archived"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Product updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          422: {
            description: "Validation failed (e.g. activating without images)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { error: { code: "VALIDATION_FAILED", message: "At least one image is required to activate", details: { images: "at least 1" } } },
              },
            },
          },
        },
      },
      delete: {
        summary: "Archive (soft-delete) a product",
        tags: ["Products — Private"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Product archived" },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/products/{productId}/availability": {
      get: {
        summary: "Check product availability (consumed by Buyer App)",
        description: "Returns whether the product is active and provides current price and weight. **No stock check** — stock is unlimited.",
        tags: ["Products — Public"],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Availability info", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductAvailability" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/products/{productId}/images": {
      post: {
        summary: "Add an image to a product",
        tags: ["Product Images"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", example: "https://cdn.bicimarket.com/prd_01H…/1.jpg" },
                  position: { type: "integer", example: 0 },
                },
              },
            },
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  position: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Image created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    product_id: { type: "string" },
                    url: { type: "string" },
                    position: { type: "integer" },
                  },
                },
              },
            },
          },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Product not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/products/{productId}/images/{imageId}": {
      delete: {
        summary: "Delete a product image",
        tags: ["Product Images"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
          { name: "imageId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          204: { description: "Image deleted" },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/sales-orders": {
      get: {
        summary: "List my sales orders (seller JWT)",
        tags: ["Sales Orders"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["pending", "accepted", "rejected", "preparing", "ready_to_ship", "handed_over", "delivered", "cancelled"],
            },
          },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "Paginated sales orders",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/SalesOrder" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        summary: "Create sales order (called by Payments App — X-Service-Token)",
        tags: ["Sales Orders — Server-to-Server"],
        security: [{ ServiceToken: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["order_id", "order_seller_group_id", "buyer_profile_id", "buyer_clerk_user_id", "items", "items_subtotal_cents", "shipping_cost_cents", "total_cents", "shipping_address_snapshot", "payment_id"],
                properties: {
                  order_id: { type: "string", example: "ord_01H…" },
                  order_seller_group_id: { type: "string", example: "osg_01H…" },
                  buyer_profile_id: { type: "string", example: "byp_01H…" },
                  buyer_clerk_user_id: { type: "string", example: "user_buyer_abc" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["product_id", "product_name_snapshot", "unit_price_cents", "quantity"],
                      properties: {
                        product_id: { type: "string" },
                        product_name_snapshot: { type: "string" },
                        unit_price_cents: { type: "integer" },
                        quantity: { type: "integer" },
                      },
                    },
                  },
                  items_subtotal_cents: { type: "integer", example: 65000000 },
                  shipping_cost_cents: { type: "integer", example: 1200000 },
                  total_cents: { type: "integer", example: 66200000 },
                  currency: { type: "string", default: "ARS" },
                  shipping_address_snapshot: { type: "object" },
                  payment_id: { type: "string", example: "pay_01H…" },
                  shipping_quote_id: { type: "string", description: "Optional — forwarded to Shipping App when creating the shipment", example: "qte_01H…" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Sales order created", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/sales-orders/{salesOrderId}": {
      get: {
        summary: "Get sales order detail",
        tags: ["Sales Orders"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "salesOrderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Sales order", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/sales-orders/{salesOrderId}/accept": {
      post: {
        summary: "Accept a sales order",
        tags: ["Sales Orders"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "salesOrderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Order accepted (fulfillment_status=accepted)", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Invalid status transition", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/sales-orders/{salesOrderId}/reject": {
      post: {
        summary: "Reject a sales order",
        tags: ["Sales Orders"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "salesOrderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string", example: "Producto dañado al revisar" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Order rejected", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Invalid status transition", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/sales-orders/{salesOrderId}/prepare": {
      patch: {
        summary: "Advance preparation status (preparing → ready_to_ship)",
        tags: ["Sales Orders"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "salesOrderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fulfillment_status: { type: "string", enum: ["preparing", "ready_to_ship"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "Invalid status transition", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/sales-orders/{salesOrderId}/payment-status": {
      patch: {
        summary: "Update payment status (called by Payments App — X-Service-Token)",
        tags: ["Sales Orders — Server-to-Server"],
        security: [{ ServiceToken: [] }],
        parameters: [{ name: "salesOrderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["payment_status"],
                properties: {
                  payment_status: { type: "string", enum: ["paid", "refunded", "settled"] },
                  settlement_id: { type: "string", example: "set_01H…" },
                  occurred_at: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Payment status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/sales-orders/{salesOrderId}/shipping-status": {
      patch: {
        summary: "Update shipping status (called by Shipping App — X-Service-Token)",
        tags: ["Sales Orders — Server-to-Server"],
        security: [{ ServiceToken: [] }],
        parameters: [{ name: "salesOrderId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["shipping_status"],
                properties: {
                  shipping_status: {
                    type: "string",
                    enum: ["ready_for_pickup", "picked_up", "in_transit", "out_for_delivery", "delivered", "returned"],
                  },
                  shipment_id: { type: "string", example: "shp_01H…" },
                  occurred_at: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Shipping status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SalesOrder" } } } },
          400: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/settlements": {
      get: {
        summary: "List my settlements (proxied from Payments App)",
        description: "Seller App does not own settlement data — it proxies this call to Payments App, locking `sellerId` to the authenticated seller. The response shape mirrors Payments App's GET /api/v1/settlements.",
        tags: ["Settlements"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["pending", "paid", "failed", "manual_review"] },
          },
          { name: "from", in: "query", schema: { type: "string", format: "date" }, description: "ISO date — filter settlements created from this date" },
          { name: "to", in: "query", schema: { type: "string", format: "date" }, description: "ISO date — filter settlements created up to this date" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "Paginated settlements from Payments App",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", example: "set_01H…" },
                          order_id: { type: "string", example: "ord_01H…" },
                          seller_profile_id: { type: "string", example: "slp_01H…" },
                          gross_amount_cents: { type: "integer", example: 66200000 },
                          fee_amount_cents: { type: "integer", example: 6620000 },
                          net_amount_cents: { type: "integer", example: 59580000 },
                          currency: { type: "string", example: "ARS" },
                          status: { type: "string", enum: ["pending", "paid", "failed", "manual_review"] },
                          paid_at: { type: "string", format: "date-time", nullable: true },
                          created_at: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          502: { description: "Payments App unreachable after 3 retries", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};
