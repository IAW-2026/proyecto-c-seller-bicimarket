import { auth } from "@clerk/nextjs/server";
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
  const { userId } = await auth();
  if (!userId) return { userId: null, error: Errors.unauthorized() };
  return { userId, error: null };
}

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { userId: null, error: Errors.unauthorized() };
  const isAdmin = (sessionClaims?.publicMetadata as Record<string, unknown> | undefined)?.admin === true;
  if (!isAdmin) return { userId: null, error: Errors.forbidden() };
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

export function validateServiceToken(request: Request): boolean {
  const token = request.headers.get("X-Service-Token");
  const expected = process.env.INCOMING_SERVICE_TOKEN;
  if (!expected) return false;
  return token === expected;
}

export function requireServiceToken(request: Request) {
  if (!validateServiceToken(request)) return Errors.unauthorized();
  return null;
}

// ── Pagination ───────────────────────────────────────────────

export function getPaginationParams(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
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
