import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrDashboardToken } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const error = await requireAdminOrDashboardToken(request);
  if (error) return error;

  const [total, byStatus, productTotal] = await Promise.all([
    prisma.sellerProfile.count({ where: { deletedAt: null } }),
    prisma.sellerProfile.groupBy({
      by: ["verificationStatus"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    prisma.product.count({ where: { deletedAt: null } }),
  ]);

  const countFor = (status: string) =>
    byStatus.find((g) => g.verificationStatus === status)?._count.id ?? 0;

  return Response.json({
    total,
    verified_count: countFor("verified"),
    pending_count: countFor("pending_review"),
    suspended_count: countFor("suspended"),
    product_count_total: productTotal,
  });
}
