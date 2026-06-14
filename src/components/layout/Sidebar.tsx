"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/strategy-center", label: "Strategies" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-bold">
          TP
        </div>
        <div>
          <h1 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            TradePilot AI
          </h1>
          <p className="text-[10px] text-zinc-500">Smart Trading</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                active
                  ? "bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-white border border-violet-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[100] border-t border-white/10 bg-black/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] text-xs transition-colors touch-manipulation",
                active ? "text-violet-400" : "text-zinc-500 active:text-violet-300"
              )}
            >
              {item.label === "Settings" ? (
                <Settings className="h-5 w-5" />
              ) : item.label === "Strategies" ? (
                <span className="text-base">⚡</span>
              ) : (
                <span className="h-5 w-5 flex items-center justify-center text-base">
                  📊
                </span>
              )}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function HeaderSettingsLink() {
  const pathname = usePathname();
  const active = pathname === "/settings";

  return (
    <Link
      href="/settings"
      prefetch
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors shrink-0 touch-manipulation",
        active
          ? "border-violet-500/40 text-violet-400 bg-violet-500/10"
          : "border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
      )}
    >
      <Settings className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Settings</span>
    </Link>
  );
}
