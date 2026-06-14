"use client";

import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STRATEGY_CATALOG } from "@/lib/strategies";
import { StrategyCard, StrategyCardGrid } from "@/components/strategy/StrategyCard";
import { BacktestPanel } from "@/components/strategy/BacktestPanel";
import { GridConfigPanel } from "@/components/strategy/GridConfigPanel";
import { useStrategyStore } from "@/store/strategy-store";
import { useSettingsStore } from "@/store/settings-store";
import { runBacktest } from "@/lib/backtest";
import { mapTimeframeToApi } from "@/lib/strategies";
import type { BacktestPeriod, StrategyType } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { getStrategyMeta } from "@/lib/strategies";

export function StrategyPanel() {
  const {
    activeStrategy,
    strategyTimeframe,
    setActiveStrategy,
    setStrategyTimeframe,
    lastBacktest,
    setLastBacktest,
    backtestLoading,
    setBacktestLoading,
  } = useStrategyStore();
  const { exchange, symbol, risk } = useSettingsStore();
  const gridSettings = useStrategyStore((s) => s.gridSettings);
  const [backtestPeriod, setBacktestPeriod] = useState<BacktestPeriod>("30d");

  const selectStrategy = (id: StrategyType) => {
    setActiveStrategy(id);
    const meta = getStrategyMeta(id);
    if (!meta.timeframes.includes(strategyTimeframe)) {
      setStrategyTimeframe(meta.timeframes[0]);
    }
  };

  const runStrategyBacktest = async (id: StrategyType) => {
    setBacktestLoading(true);
    try {
      const tf =
        id === activeStrategy ? strategyTimeframe : getStrategyMeta(id).timeframes[0];
      const { interval, limit } = mapTimeframeToApi(tf, exchange);
      const res = await fetch(
        `/api/${exchange}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      const data = await res.json();
      const result = runBacktest(
        data.klines,
        id,
        symbol,
        tf,
        backtestPeriod,
        10000,
        risk,
        id === "grid" ? gridSettings : undefined
      );
      setLastBacktest(result);
    } catch {
      setLastBacktest(null);
    } finally {
      setBacktestLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Strategy Center</h2>
        <p className="text-sm text-zinc-500 max-w-2xl">
          Choose a Real OG strategy, run Paper backtests, then activate one for the
          bot. No profit promises — educational tooling only.
        </p>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <AlertDescription className="text-xs text-zinc-400">
          Disclaimer: TradePilot AI does not trade for you automatically on an
          exchange server. Strategies run in your browser; Live sends orders only
          when you enable it and risk rules pass. Past backtest ≠ future results.
          Who who does not trade, works at the factory.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <Label className="text-xs text-zinc-400">Active timeframe</Label>
          <Select
            value={strategyTimeframe}
            onValueChange={(v) => v && setStrategyTimeframe(v)}
          >
            <SelectTrigger className="mt-1 w-32 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getStrategyMeta(activeStrategy).timeframes.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Backtest period</Label>
          <Select
            value={backtestPeriod}
            onValueChange={(v) => v && setBacktestPeriod(v as BacktestPeriod)}
          >
            <SelectTrigger className="mt-1 w-32 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["7d", "30d", "90d", "1y"] as BacktestPeriod[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeStrategy === "grid" && <GridConfigPanel />}

      <StrategyCardGrid>
        {STRATEGY_CATALOG.map((meta) => (
          <StrategyCard
            key={meta.id}
            meta={meta}
            active={activeStrategy === meta.id}
            timeframe={strategyTimeframe}
            onSelect={() => selectStrategy(meta.id)}
            onBacktest={() => runStrategyBacktest(meta.id)}
            backtestLoading={backtestLoading}
          />
        ))}
      </StrategyCardGrid>

      <BacktestPanel result={lastBacktest} loading={backtestLoading} />
    </motion.div>
  );
}

export const StrategyPanelLegacy = StrategyPanel;
