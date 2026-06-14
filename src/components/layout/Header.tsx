"use client";

import { useSettingsStore } from "@/store/settings-store";
import { useTradingStore } from "@/store/trading-store";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/glass-card";
import { HeaderSettingsLink } from "@/components/layout/Sidebar";

export function Header() {
  const { exchange, tradingMode, symbol } = useSettingsStore();
  const botStatus = useTradingStore((s) => s.botStatus);

  const statusColors = {
    running: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    stopped: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-white/10 bg-black/40 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-3 lg:hidden min-w-0">
        <h1 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent truncate">
          TradePilot AI
        </h1>
      </div>
      <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
        <Badge variant="outline" className="border-white/10 text-xs capitalize hidden xs:flex">
          {exchange}
        </Badge>
        <Badge variant="outline" className="border-white/10 text-xs hidden sm:flex">
          {symbol}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs capitalize ${tradingMode === "live" ? "border-red-500/30 text-red-400" : "border-blue-500/30 text-blue-400"}`}
        >
          {tradingMode}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs capitalize flex items-center gap-1.5 ${statusColors[botStatus]}`}
        >
          <StatusDot active={botStatus === "running"} />
          {botStatus}
        </Badge>
        <HeaderSettingsLink />
      </div>
    </header>
  );
}
