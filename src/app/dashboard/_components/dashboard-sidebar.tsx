"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Bike, Wallet, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/orders", label: "Pedidos", icon: Package },
  { href: "/dashboard/products", label: "Catálogo", icon: Bike },
  { href: "/dashboard/settlements", label: "Liquidaciones", icon: Wallet },
  { href: "/dashboard/profile", label: "Mi perfil", icon: User },
];

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-border/60 bg-card/30 py-6 px-3">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-border/60" />
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Shield className="size-4 shrink-0" />
              Admin
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
