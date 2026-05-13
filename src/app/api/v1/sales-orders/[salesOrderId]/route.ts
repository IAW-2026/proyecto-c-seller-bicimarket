import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { formatSalesOrder } from "../_format";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ salesOrderId: string }> }
) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { salesOrderId } = await params;

  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, sellerProfileId: profile!.id },
    include: { items: true },
  });
  if (!order) return Errors.notFound("Sales order");

  return Response.json(formatSalesOrder(order));
}

