import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ── Error responses ──────────────────────────────────────────

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export const Errors = {
  unauthorized: () => errorResponse("UNAUTHORIZED", "Missing or invalid credentials", 401),
  forbidden: () => errorResponse("FORBIDDEN", "Insufficient permissions", 403),
  notFound: (resource: string) => errorResponse("NOT_FOUND", `${resource} not found`, 404),
  conflict: (code: string, message: string, details?: Record<string, unknown>) =>
    errorResponse(code, message, 409, details),
  unprocessable: (code: string, message: string, details?: Record<string, unknown>) =>
    errorResponse(code, message, 422, details),
  badRequest: (message: string, details?: Record<string, unknown>) =>
    errorResponse("BAD_REQUEST", message, 400, details),
  internal: () => errorResponse("INTERNAL", "Internal server error", 500),
};

// ── Auth ────────────────────────────────────────────────────

export async function requireAuth() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { userId: null, error: Errors.unauthorized() };

  const email = (sessionClaims as Record<string, unknown>)?.email as string | undefined;
  if (email) {
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email },
      update: { email },
    });
  }

  return { userId, error: null };
}

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { userId: null, error: Errors.unauthorized() };
  const user = await currentUser();
  if (user?.publicMetadata?.admin !== true) return { userId: null, error: Errors.forbidden() };
  return { userId, error: null };
}

export async function requireSellerProfile() {
  const { userId, error } = await requireAuth();
  if (error || !userId) return { profile: null, error: error ?? Errors.unauthorized() };

  const profile = await prisma.sellerProfile.findUnique({
    where: { clerkUserId: userId },
  });
  if (!profile) {
    return {
      profile: null,
      error: errorResponse("SELLER_PROFILE_NOT_FOUND", "Create your seller profile first", 404),
    };
  }
  return { profile, error: null };
}

// ── Service token validation ─────────────────────────────────
//
// Each caller app has its own secret (per docs §2 rule 2 / §7).
// Env vars: PAYMENTS_TO_SELLER_SERVICE_TOKEN, SHIPPING_TO_SELLER_SERVICE_TOKEN,
//           BUYER_TO_SELLER_SERVICE_TOKEN.
// Pass the expected env var name so each route validates against the right secret.

export function validateServiceToken(request: Request, envVar: string): boolean {
  const token = request.headers.get("X-Service-Token");
  const expected = process.env[envVar];
  if (!expected) return false;
  return token === expected;
}

export function requireServiceToken(request: Request, envVar: string) {
  if (!validateServiceToken(request, envVar)) return Errors.unauthorized();
  return null;
}

export async function requireAdminOrDashboardToken(request: Request) {
  if (validateServiceToken(request, "DASHBOARD_TO_SELLER_SERVICE_TOKEN")) return null;
  const { error } = await requireAdmin();
  return error;
}

// ── Pagination ───────────────────────────────────────────────

export function getPaginationParams(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      has_more: page * limit < total,
      next_cursor: null,
    },
  };
}

// ── ID prefixes ──────────────────────────────────────────────

export function withPrefix(prefix: string, cuid: string) {
  return `${prefix}_${cuid}`;
}
