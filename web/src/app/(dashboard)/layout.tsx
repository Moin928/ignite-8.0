"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  LogOut,
  Users,
  Settings,
} from "lucide-react";

import HeaderWardBadge from "./HeaderWardBadge";

const NAV = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Issues", href: "/issues", icon: ClipboardList },
  { label: "City Map", href: "/map", icon: Map },
  { label: "Workers", href: "/workers", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex flex-col shrink-0 bg-slate-900 text-slate-300">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div>
            <div className="text-white font-bold text-sm leading-none tracking-tight">CivicLens</div>
            <div className="text-slate-500 text-[10px] mt-0.5 leading-none">Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 pt-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  active
                    ? "bg-amber-500/15 text-amber-400 font-semibold border-l-2 border-amber-500"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t border-slate-800 pt-3">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-slate-500 leading-tight">Dept. of Public Works</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Admin Officer</div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-amber-500 flex items-center px-6 justify-between shrink-0 shadow-xs">
          <span className="text-slate-950 font-semibold text-xs tracking-wide truncate max-w-[400px]">
            Municipal Works Dashboard
          </span>
          <HeaderWardBadge />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
