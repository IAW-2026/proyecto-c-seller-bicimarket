import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Shield } from "lucide-react";
import { SellersList } from "./_components/sellers-list";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (user.publicMetadata?.admin !== true) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Shield className="size-4" />
            </div>
            <span className="font-semibold">BiciMarket — Panel Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.firstName} {user.lastName}
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Vendedores registrados</h1>
          <p className="text-sm text-muted-foreground">
            Verificá o suspendé perfiles desde esta pantalla.
          </p>
        </div>
        <SellersList />
      </main>
    </div>
  );
}
