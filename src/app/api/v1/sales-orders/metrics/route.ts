import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireAdmin } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  const fromDate = fromStr ? new Date(fromStr) : undefined;
  const toDate = toStr ? new Date(toStr) : undefined;

  if (fromDate && isNaN(fromDate.getTime())) return Errors.badRequest("Invalid 'from' date");
  if (toDate && isNaN(toDate.getTime())) return Errors.badRequest("Invalid 'to' date");

  const dateFilter =
    fromDate || toDate
      ? { createdAt: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
      : {};

  const [statusGroups, pendingBySeller] = await Promise.all([
    prisma.salesOrder.groupBy({
      by: ["fulfillmentStatus"],
      where: dateFilter,
      _count: { id: true },
    }),
    prisma.salesOrder.groupBy({
      by: ["sellerProfileId"],
      where: { ...dateFilter, fulfillmentStatus: "pending" },
      _count: { id: true },
      _min: { createdAt: true },
    }),
  ]);

  const countFor = (status: string) =>
    statusGroups.find((g) => g.fulfillmentStatus === status)?._count.id ?? 0;

  const total = statusGroups.reduce((sum, g) => sum + g._count.id, 0);
  const cancelledCount = countFor("cancelled");
  const rejectedCount = countFor("rejected");
  const deliveredCount = countFor("delivered");
  const acceptedAndBeyond =
    countFor("accepted") +
    countFor("preparing") +
    countFor("ready_to_ship") +
    countFor("handed_over") +
    deliveredCount;
  const denominator = total - cancelledCount - rejectedCount;
  const acceptanceRate = denominator > 0 ? acceptedAndBeyond / denominator : 0;

  const sellerIds = pendingBySeller.map((g) => g.sellerProfileId);
  const sellers =
    sellerIds.length > 0
      ? await prisma.sellerProfile.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, displayName: true },
        })
      : [];
  const sellerMap = new Map(sellers.map((s) => [s.id, s.displayName]));

  return Response.json({
    total,
    pending_count: countFor("pending"),
    accepted_count: countFor("accepted"),
    delivered_count: deliveredCount,
    acceptance_rate: acceptanceRate,
    pending_by_seller: pendingBySeller.map((g) => ({
      seller_profile_id: g.sellerProfileId,
      seller_name: sellerMap.get(g.sellerProfileId) ?? "Unknown",
      count: g._count.id,
      oldest_date: g._min.createdAt,
    })),
  });
}
