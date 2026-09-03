"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, ListTodo, LogOut, ShieldAlert, FileText } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Manage Issues", href: "/issues", icon: ListTodo },
    { name: "City Map View", href: "/map", icon: Map },
    { name: "Submit Report (Demo)", href: "/report", icon: FileText },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Sidebar - Clean, High Contrast */}
      <aside className="w-64 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-slate-900">
            <ShieldAlert size={20} />
          </div>
          <span className="font-semibold text-lg tracking-wide text-white">CivicLens</span>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-slate-800 text-amber-400 border-l-2 border-amber-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/login" className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar - Government Yellow Banner */}
        <header className="h-14 bg-amber-500 border-b border-amber-600 flex items-center px-6 justify-between shadow-sm">
          <div className="font-semibold text-slate-900 text-sm tracking-wide">
            OFFICIAL AUTHORITY DASHBOARD
          </div>
          <div className="flex items-center gap-4 text-slate-900">
            <span className="text-sm font-medium">Dept. of Public Works</span>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              PW
            </div>
          </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
