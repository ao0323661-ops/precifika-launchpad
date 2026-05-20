import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: ReactNode;
  isDemo?: boolean;
}

export function DashboardLayout({ children, isDemo }: SidebarProps) {
  const { logout, session } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Clientes", icon: Users, href: "/dashboard/customers" },
    { label: "Assinaturas", icon: CreditCard, href: "/dashboard/subscriptions" },
    { label: "Pagamentos", icon: BarChart3, href: "/dashboard/payments" },
    { label: "Produtos", icon: Package, href: "/dashboard/products" },
    { label: "Webhooks", icon: Activity, href: "/dashboard/webhooks" },
    { label: "Configurações", icon: Settings, href: "#" },
  ];

  const currentPath = window.location.pathname;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r border-slate-200 bg-white md:flex flex-col sticky top-0 h-screen">
        <div className="flex h-16 items-center border-b border-slate-100 px-6 gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Precifika</span>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                currentPath === item.href
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {session?.user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-slate-900">{session?.user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center border-b border-slate-100 px-6 justify-between">
          <span className="text-xl font-bold text-primary">Precifika</span>
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                currentPath === item.href
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden rounded-lg p-2 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1 flex justify-end items-center gap-4">
            {isDemo && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-200 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Modo Demonstração
                </span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
