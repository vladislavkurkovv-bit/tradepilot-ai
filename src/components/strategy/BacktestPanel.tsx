"use client";

import { GlassCard } from "@/components/ui/glass-card";
import type { BacktestResult } from "@/lib/types";

interface BacktestPanelProps {
  result: BacktestResult | null;
  loading?: boolean;
}

export function BacktestPanel({ result, loading }: BacktestPanelProps) {
  if (loading) {
    return (
      <GlassCard className="p-6 text-center text-sm text-zinc-500">
        Running backtest on real candles…
      </GlassCard>
    );
  }

  if (!result) {
    return (
      <GlassCard className="p-6 text-center text-sm text-zinc-500">
        Select a strategy and click Run Backtest. Results are simulated on real
        data — not a guarantee of future profit.
      </GlassCard>
    );
  }

  const stats = [
    {
      label: "Total Return",
      value: `${result.totalReturnPercent.toFixed(2)}%`,
      highlight: true,
    },
    { label: "Final Balance", value: `$${result.finalBalance.toFixed(2)}` },
    { label: "Total Trades", value: String(result.totalTrades) },
    { label: "Win Rate", value: `${result.winRate.toFixed(1)}%` },
    { label: "Profit Factor", value: result.profitFactor.toFixed(2) },
    { label: "Max Drawdown", value: `${result.maxDrawdown.toFixed(2)}%` },
    { label: "Avg Win", value: `$${result.averageWin.toFixed(2)}` },
    { label: "Avg Loss", value: `$${result.averageLoss.toFixed(2)}` },
    { label: "Best Trade", value: `$${result.bestTrade.toFixed(2)}` },
    { label: "Worst Trade", value: `$${result.worstTrade.toFixed(2)}` },
  ];

  return (
    <GlassCard className="p-4 lg:p-6" glow>
      <h3 className="text-sm font-semibold mb-1">Backtest performance</h3>
      <p className="text-[10px] text-zinc-600 mb-4">
        {result.strategy} • {result.symbol} • {result.timeframe} • {result.period}
        — educational simulation only.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-3 rounded-xl bg-white/5 border border-white/5 text-center"
          >
            <p className="text-[10px] text-zinc-500 uppercase">{s.label}</p>
            <p
              className={`text-sm font-bold tabular-nums mt-1 ${s.highlight ? (result.totalReturnPercent >= 0 ? "text-emerald-400" : "text-red-400") : ""}`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
