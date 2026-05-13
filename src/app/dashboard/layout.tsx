import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bike } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "./_components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { userId } = await auth();
  if (userId) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { clerkUserId: userId },
      select: { verificationStatus: true },
    });
    if (profile?.verificationStatus === "suspended") {
      redirect("/suspended");
    }
  }

  const isAdmin = user.publicMetadata?.admin === true;
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bike className="size-4" />
            </div>
            <span className="font-semibold">BiciMarket Vendedor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.firstName} {user.lastName}
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <DashboardSidebar isAdmin={isAdmin} />
        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
