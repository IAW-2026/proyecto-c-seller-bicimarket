import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SellersList } from "@/app/admin/_components/sellers-list";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (user.publicMetadata?.admin !== true) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Vendedores registrados</h1>
        <p className="text-sm text-muted-foreground">
          Verificá o suspendé perfiles desde esta pantalla.
        </p>
      </div>
      <SellersList />
    </div>
  );
}
