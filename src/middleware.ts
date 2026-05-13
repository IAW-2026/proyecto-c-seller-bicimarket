import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api-docs(.*)",
  "/api/webhooks(.*)",
  "/api/v1/openapi.json",
  // Public catalog — no auth needed
  "/api/v1/products(.*)",
  // Seller profile pickup-address — validated by X-Service-Token, not Clerk
  "/api/v1/seller-profile/:id/pickup-address",
  // Sales orders server-to-server — validated by X-Service-Token inside the handler
  "/api/v1/sales-orders",
  "/api/v1/sales-orders/:id/payment-status",
  "/api/v1/sales-orders/:id/shipping-status",
  // Legacy routes kept for backwards compat
  "/products(.*)",
  "/api/products(.*)",
  // Dev simulator — guarded by NODE_ENV check inside each handler
  "/dev(.*)",
  "/api/dev(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
