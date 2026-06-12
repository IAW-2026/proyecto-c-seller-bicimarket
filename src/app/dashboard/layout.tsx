import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./_components/app-sidebar";
import { ThemeToggle } from "./_components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [profile, clerkUser] = await Promise.all([
    prisma.sellerProfile.findUnique({
      where: { clerkUserId: userId },
      select: { verificationStatus: true },
    }),
    currentUser(),
  ]);

  if (profile?.verificationStatus === "suspended") {
    redirect("/suspended");
  }

  const isAdmin = clerkUser?.publicMetadata?.admin === true;

  return (
    <SidebarProvider>
      <AppSidebar isAdmin={isAdmin} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span className="font-semibold text-sm">BiciMarket Vendedor</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
