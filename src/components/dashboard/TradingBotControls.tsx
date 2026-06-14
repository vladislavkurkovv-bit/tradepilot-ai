"use client";

import { motion } from "framer-motion";
import { Play, Pause, Square, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useTradingStore } from "@/store/trading-store";
import { useStrategyStore } from "@/store/strategy-store";
import { getStrategyMeta } from "@/lib/strategies";
import Link from "next/link";

interface TradingBotControlsProps {
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onEmergencyStop: () => void;
}

export function TradingBotControls({
  onStart,
  onPause,
  onStop,
  onEmergencyStop,
}: TradingBotControlsProps) {
  const botStatus = useTradingStore((s) => s.botStatus);
  const botStatusMessage = useTradingStore((s) => s.botStatusMessage);
  const paperAccount = useTradingStore((s) => s.paperAccount);

  const activeStrategy = useStrategyStore((s) => s.activeStrategy);
  const meta = getStrategyMeta(activeStrategy);

  return (
    <GlassCard className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Trading Bot Controls</h3>
        <Link href="/strategy-center" className="text-[10px] text-violet-400 hover:underline">
          {meta.name}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          onClick={onStart}
          disabled={botStatus === "running"}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-0"
        >
          <Play className="h-4 w-4 mr-1.5" />
          Start Bot
        </Button>
        <Button
          onClick={onPause}
          disabled={botStatus !== "running"}
          variant="outline"
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          <Pause className="h-4 w-4 mr-1.5" />
          Pause
        </Button>
        <Button
          onClick={onStop}
          disabled={botStatus === "stopped"}
          variant="outline"
          className="border-white/10 text-zinc-300 hover:bg-white/5"
        >
          <Square className="h-4 w-4 mr-1.5" />
          Stop
        </Button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onEmergencyStop}
            variant="destructive"
            className="w-full bg-red-600/80 hover:bg-red-600"
          >
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            Emergency Stop
          </Button>
        </motion.div>
      </div>

      {botStatus !== "stopped" && (
        <p className="text-xs text-zinc-400 mb-3 p-2 rounded-lg bg-white/5 border border-white/5 leading-relaxed">
          {botStatusMessage}
        </p>
      )}

      <div className="space-y-2 text-xs border-t border-white/10 pt-3">
        <div className="flex justify-between">
          <span className="text-zinc-500">Open Positions</span>
          <span className="font-medium">{paperAccount.positions.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Daily PnL</span>
          <span
            className={`font-medium tabular-nums ${paperAccount.dailyPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {paperAccount.dailyPnl >= 0 ? "+" : ""}
            ${paperAccount.dailyPnl.toFixed(2)}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
