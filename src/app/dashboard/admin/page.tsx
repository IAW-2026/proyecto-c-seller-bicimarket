import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SellersList } from "@/app/admin/_components/sellers-list";
import { AdminProductsList } from "@/app/admin/_components/products-list";
import { AdminOrdersList } from "@/app/admin/_components/orders-list";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (user.publicMetadata?.admin !== true) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná vendedores y revisá el catálogo completo.
        </p>
      </div>

      <Tabs defaultValue="sellers">
        <TabsList className="mb-4">
          <TabsTrigger value="sellers">Vendedores</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
        </TabsList>

        <TabsContent value="sellers">
          <SellersList />
        </TabsContent>

        <TabsContent value="products">
          <AdminProductsList />
        </TabsContent>

        <TabsContent value="orders">
          <AdminOrdersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
