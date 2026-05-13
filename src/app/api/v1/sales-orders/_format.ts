import type { SalesOrder, SalesOrderItem } from "@prisma/client";

export function formatSalesOrder(order: SalesOrder & { items: SalesOrderItem[] }) {
  return {
    id: order.id,
    order_id: order.orderId,
    order_seller_group_id: order.orderSellerGroupId,
    seller_profile_id: order.sellerProfileId,
    buyer_profile_id: order.buyerProfileId,
    fulfillment_status: order.fulfillmentStatus,
    shipping_status: order.shippingStatus,
    payment_status: order.paymentStatus,
    shipment_id: order.shipmentId,
    items_subtotal_cents: order.itemsSubtotalCents,
    shipping_cost_cents: order.shippingCostCents,
    total_cents: order.totalCents,
    currency: order.currency,
    shipping_address_snapshot: order.shippingAddressSnapshot,
    items: order.items.map((i) => ({
      id: i.id,
      product_id: i.productId,
      product_name_snapshot: i.productNameSnapshot,
      unit_price_cents: i.unitPriceCents,
      quantity: i.quantity,
    })),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}
