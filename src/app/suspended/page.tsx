import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bike, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SuspendedPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bike className="size-4" />
            </div>
            <span className="font-semibold">BiciMarket Vendedor</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-8" />
            </div>
            <Badge variant="destructive">Cuenta suspendida</Badge>
            <h2 className="font-heading text-xl font-semibold">
              Tu cuenta de vendedor está suspendida
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No podés acceder al panel hasta resolver la situación.
              Contactá a soporte para más información.
            </p>
            <Button className="mt-2">
              <Link href="mailto:soporte@bicimarket.com">Contactar a soporte</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
