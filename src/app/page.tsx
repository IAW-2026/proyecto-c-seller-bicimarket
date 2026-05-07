import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, Package, Truck, Banknote } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bike className="size-4" />
            </div>
            <span className="font-semibold">BiciMarket Vendedor</span>
          </div>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Vendé tus bicicletas en BiciMarket
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Gestioná tu catálogo, pedidos y liquidaciones en un solo lugar.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className={buttonVariants({ size: "lg" })}
          >
            Crear cuenta de vendedor
          </Link>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ya tengo cuenta → Ingresar
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Package className="size-5" />,
              title: "Catálogo sin límites",
              body: "Publicá bicicletas, repuestos y accesorios. Toda publicación activa tiene disponibilidad ilimitada.",
            },
            {
              icon: <Truck className="size-5" />,
              title: "Logística integrada",
              body: "Generá envíos y etiquetas automáticamente cuando marcás un pedido como listo.",
            },
            {
              icon: <Banknote className="size-5" />,
              title: "Liquidaciones automáticas",
              body: "Recibís el pago neto tras la entrega confirmada, descontando solo la comisión del marketplace.",
            },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2026 BiciMarket
      </footer>
    </div>
  );
}
