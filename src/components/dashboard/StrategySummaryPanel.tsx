"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { useStrategyStore } from "@/store/strategy-store";
import { getStrategyMeta } from "@/lib/strategies";

export function StrategySummaryPanel() {
  const activeStrategy = useStrategyStore((s) => s.activeStrategy);
  const strategyTimeframe = useStrategyStore((s) => s.strategyTimeframe);
  const lastResult = useStrategyStore((s) => s.lastStrategyResult);
  const lastBacktest = useStrategyStore((s) => s.lastBacktest);
  const aiConfirmation = useStrategyStore((s) => s.aiConfirmation);
  const meta = getStrategyMeta(activeStrategy);

  return (
    <GlassCard className="p-4 lg:p-6" glow>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold">Active Strategy</h3>
        <Link
          href="/strategy-center"
          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"
        >
          Change Strategy
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div>
          <p className="text-zinc-500">Strategy</p>
          <p className="font-medium mt-0.5">{meta.name}</p>
          <Badge variant="outline" className="mt-1 text-[10px]">
            {strategyTimeframe}
          </Badge>
        </div>
        <div>
          <p className="text-zinc-500">Last signal</p>
          <p className="font-medium mt-0.5">
            {lastResult?.signal ?? "—"}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1 line-clamp-2">
            {lastResult?.reason ?? "Run bot or Analyze"}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">AI confirm</p>
          <p
            className={`font-medium mt-0.5 ${aiConfirmation?.approved ? "text-emerald-400" : "text-zinc-400"}`}
          >
            {aiConfirmation
              ? aiConfirmation.approved
                ? "Approved"
                : "Blocked"
              : "—"}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">
            {aiConfirmation?.reason ?? "Hybrid only"}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Backtest</p>
          <p
            className={`font-medium mt-0.5 tabular-nums ${(lastBacktest?.totalReturnPercent ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {lastBacktest
              ? `${lastBacktest.totalReturnPercent.toFixed(1)}%`
              : "Run in Strategy Center"}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
