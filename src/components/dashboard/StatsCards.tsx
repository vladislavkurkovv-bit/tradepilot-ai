"use client";

import { motion } from "framer-motion";
import { TrendingUp, Wallet, Activity, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { useTradingStore } from "@/store/trading-store";
import { useSettingsStore } from "@/store/settings-store";

export function StatsCards() {
  const marketData = useTradingStore((s) => s.marketData);
  const paperAccount = useTradingStore((s) => s.paperAccount);
  const trades = useTradingStore((s) => s.trades);
  const { tradingMode } = useSettingsStore();

  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winRate =
    trades.filter((t) => t.pnl !== undefined).length > 0
      ? (
          (trades.filter((t) => (t.pnl || 0) > 0).length /
            trades.filter((t) => t.pnl !== undefined).length) *
          100
        ).toFixed(1)
      : "0.0";

  const stats = [
    {
      label: "Price",
      value: marketData ? `$${marketData.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—",
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: tradingMode === "paper" ? "Paper Balance" : "Balance",
      value: `$${paperAccount.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "from-violet-500 to-purple-500",
    },
    {
      label: "Total PnL",
      value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`,
      icon: Activity,
      color: totalPnl >= 0 ? "from-emerald-500 to-green-500" : "from-red-500 to-orange-500",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: BarChart3,
      color: "from-amber-500 to-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">{stat.label}</span>
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
