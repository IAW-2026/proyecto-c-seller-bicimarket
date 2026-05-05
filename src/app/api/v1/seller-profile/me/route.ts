import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireAuth } from "@/lib/api-utils";

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const profile = await prisma.sellerProfile.findUnique({
    where: { clerkUserId: userId! },
  });
  if (!profile) return Errors.notFound("Seller profile");

  return Response.json(formatProfile(profile));
}

export async function PUT(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Errors.badRequest("Invalid JSON body");
  }

  const {
    legal_name,
    display_name,
    tax_id,
    tax_condition,
    bank_account_reference,
    pickup_address,
    phone,
  } = body as Record<string, unknown>;

  const existing = await prisma.sellerProfile.findUnique({
    where: { clerkUserId: userId! },
  });

  if (existing) {
    const updated = await prisma.sellerProfile.update({
      where: { clerkUserId: userId! },
      data: {
        ...(legal_name != null && { legalName: String(legal_name) }),
        ...(display_name != null && { displayName: String(display_name) }),
        ...(tax_id != null && { taxId: String(tax_id) }),
        ...(tax_condition != null && { taxCondition: tax_condition as never }),
        ...(bank_account_reference != null && {
          bankAccountReference: String(bank_account_reference),
        }),
        ...(pickup_address != null && { pickupAddress: pickup_address as never }),
      },
    });
    return Response.json(formatProfile(updated));
  }

  if (!legal_name || !display_name || !tax_id || !tax_condition || !bank_account_reference || !pickup_address) {
    return Errors.badRequest("legal_name, display_name, tax_id, tax_condition, bank_account_reference, and pickup_address are required");
  }

  const created = await prisma.sellerProfile.create({
    data: {
      clerkUserId: userId!,
      legalName: String(legal_name),
      displayName: String(display_name),
      taxId: String(tax_id),
      taxCondition: tax_condition as never,
      bankAccountReference: String(bank_account_reference),
      pickupAddress: pickup_address as never,
    },
  });

  return Response.json(formatProfile(created), { status: 201 });
}

function formatProfile(p: {
  id: string;
  clerkUserId: string;
  legalName: string;
  displayName: string;
  taxId: string;
  taxCondition: string;
  bankAccountReference: string;
  pickupAddress: unknown;
  verificationStatus: string;
  createdAt: Date;
  updatedAt?: Date;
}) {
  return {
    id: p.id,
    clerk_user_id: p.clerkUserId,
    legal_name: p.legalName,
    display_name: p.displayName,
    tax_id: p.taxId,
    tax_condition: p.taxCondition,
    bank_account_reference: p.bankAccountReference,
    pickup_address: p.pickupAddress,
    verification_status: p.verificationStatus,
    created_at: p.createdAt,
  };
}
