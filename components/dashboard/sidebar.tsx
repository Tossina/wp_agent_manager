"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Settings,
  LogOut,
  Activity,
  ChevronRight,
  BookOpen,
  CircuitBoard,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/dashboard/sites", icon: Globe, label: "Mes sites" },
  { href: "/dashboard/logs", icon: Activity, label: "Activité" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

const bottomNav = [
  { href: "/docs", icon: BookOpen, label: "Documentation", external: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card/30 backdrop-blur-xl flex flex-col relative z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
          <CircuitBoard className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm font-mono tracking-wider">WP_MNGR</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 group",
                active
                  ? "bg-primary/20 text-primary font-medium border border-primary/50 shadow-neon"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", active && "text-primary")} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="p-3 border-t border-border space-y-0.5">
        {bottomNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 w-full transition-colors"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
