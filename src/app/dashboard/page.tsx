import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Bike } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "./_components/orders-tab";
import { ProductsTab } from "./_components/products-tab";
import { SettlementsTab } from "./_components/settlements-tab";
import { ProfileTab } from "./_components/profile-tab";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Redirect suspended sellers
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

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Catálogo</TabsTrigger>
            <TabsTrigger value="settlements">Liquidaciones</TabsTrigger>
            <TabsTrigger value="profile">Mi perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="settlements">
            <SettlementsTab />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab isAdmin={user.publicMetadata?.admin === true} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
