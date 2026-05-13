"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Bike, Wallet, User, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/orders", label: "Pedidos", icon: Package },
  { href: "/dashboard/products", label: "Catálogo", icon: Bike },
  { href: "/dashboard/settlements", label: "Liquidaciones", icon: Wallet },
  { href: "/dashboard/profile", label: "Mi perfil", icon: User },
];

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative shrink-0 border-r border-border/60 bg-card/30 py-6 transition-all duration-200",
        collapsed ? "w-14 px-2" : "w-52 px-3"
      )}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-border/60" />
            <Link
              href="/dashboard/admin"
              title={collapsed ? "Admin" : undefined}
              className={cn(
                "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                pathname.startsWith("/dashboard/admin")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Shield className="size-4 shrink-0" />
              {!collapsed && "Admin"}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
