"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { StrategyMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StrategyCardProps {
  meta: StrategyMeta;
  active: boolean;
  timeframe: string;
  onSelect: () => void;
  onBacktest: () => void;
  backtestLoading?: boolean;
}

const riskColors = {
  LOW: "border-emerald-500/30 text-emerald-400",
  MEDIUM: "border-amber-500/30 text-amber-400",
  HIGH: "border-red-500/30 text-red-400",
};

export function StrategyCard({
  meta,
  active,
  timeframe,
  onSelect,
  onBacktest,
  backtestLoading,
}: StrategyCardProps) {
  return (
    <GlassCard
      className={cn(
        "p-4 lg:p-5 flex flex-col h-full",
        active && "ring-1 ring-violet-500/40"
      )}
      glow={active}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold">{meta.name}</h3>
          <p className="text-[10px] text-violet-400/80 mt-0.5">Real OG strategy</p>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", riskColors[meta.risk])}>
          {meta.risk}
        </Badge>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed flex-1 mb-3">
        {meta.description}
      </p>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 mb-3">
        <div>
          <span className="block text-zinc-600">Timeframes</span>
          {meta.timeframes.join(", ")}
        </div>
        <div>
          <span className="block text-zinc-600">Trade freq.</span>
          {meta.tradeFrequency}
        </div>
        <div>
          <span className="block text-zinc-600">Status</span>
          <span className={active ? "text-emerald-400" : "text-zinc-400"}>
            {active ? "Active" : "Inactive"}
          </span>
        </div>
        <div>
          <span className="block text-zinc-600">TF selected</span>
          {active ? timeframe : "—"}
        </div>
      </div>

      {meta.id === "scalping" && (
        <p className="text-[10px] text-amber-400/90 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          Warning: Scalping = high frequency + HIGH risk. Paper Trading recommended
          first. Fees and slippage can erase small gains.
        </p>
      )}

      {meta.id === "grid" && (
        <p className="text-[10px] text-blue-400/90 mb-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          Grid works in sideways markets. Live grid is prepared but disabled by default.
          Configure range in Strategy Center before use.
        </p>
      )}

      <p className="text-[10px] text-zinc-600 mb-4 italic">{meta.disclaimer}</p>

      <div className="flex gap-2 mt-auto">
        <Button
          size="sm"
          onClick={onSelect}
          className={cn(
            "flex-1 border-0",
            active
              ? "bg-violet-600/50 text-violet-200"
              : "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
          )}
        >
          {active ? "Selected" : "Select Strategy"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-white/10"
          onClick={onBacktest}
          disabled={backtestLoading}
        >
          {backtestLoading ? "..." : "Backtest"}
        </Button>
      </div>
    </GlassCard>
  );
}

export function StrategyCardGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-4 md:grid-cols-2"
    >
      {children}
    </motion.div>
  );
}
