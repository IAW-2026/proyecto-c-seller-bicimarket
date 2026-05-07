import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Bike } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-12">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bike className="size-5" />
        </div>
        <span className="font-semibold text-lg">BiciMarket Vendedor</span>
      </div>
      <SignUp />
      <p className="text-sm text-muted-foreground">
        Luego de registrarte, completá tu perfil de vendedor para publicar productos.
      </p>
      <p className="text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  );
}
