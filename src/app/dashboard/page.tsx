import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "./_components/orders-tab";
import { ProductsTab } from "./_components/products-tab";
import { SettlementsTab } from "./_components/settlements-tab";
import { ProfileTab } from "./_components/profile-tab";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <h1 className="font-heading text-lg font-semibold tracking-tight">BiciMarket Vendedor</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user.firstName} {user.lastName}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
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
