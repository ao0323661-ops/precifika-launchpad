import { ReactNode, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: SidebarProps) {
  const { logout, session } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Clientes", icon: Users, href: "/dashboard/customers" },
    { label: "Assinaturas", icon: CreditCard, href: "/dashboard/subscriptions" },
    { label: "Pagamentos", icon: BarChart3, href: "/dashboard/payments" },
    { label: "Produtos", icon: Package, href: "/dashboard/products" },
    { label: "Webhooks", icon: Activity, href: "/dashboard/webhooks" },
    { label: "Configuracoes", icon: Settings, href: "#" },
  ];

  const currentPath = location.pathname;

  const navLinkClass = (href: string, mobile = false) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      currentPath === href
        ? mobile
          ? "bg-primary text-white"
          : "bg-primary text-white shadow-sm"
        : mobile
          ? "text-slate-600 hover:bg-slate-50"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Precifika</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) =>
            item.href === "#" ? (
              <a key={item.label} href={item.href} className={navLinkClass(item.href)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.href} className={navLinkClass(item.href)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {session?.user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-slate-900">{session?.user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 transition-colors hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <span className="text-xl font-bold text-primary">Precifika</span>
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {menuItems.map((item) =>
            item.href === "#" ? (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={navLinkClass(item.href, true)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={navLinkClass(item.href, true)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-4" />
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
