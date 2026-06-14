"use client";

import { useCallback, useEffect } from "react";
import type { Exchange } from "@/lib/types";
import { useSettingsStore } from "@/store/settings-store";
import { useTradingStore } from "@/store/trading-store";
import { computeYearlyInsight } from "@/lib/market-insight";
import { calculatePositionSize } from "@/services/paper-trading";

/** Fetches ~1 year of daily candles from exchange public API */
export function useYearlyHistory(exchange: Exchange, symbol: string) {
  const { risk } = useSettingsStore();
  const paperBalance = useTradingStore((s) => s.paperAccount.balance);
  const setYearlyKlines = useTradingStore((s) => s.setYearlyKlines);
  const setYearlyInsight = useTradingStore((s) => s.setYearlyInsight);
  const setYearlyLoading = useTradingStore((s) => s.setYearlyLoading);

  const fetchYearly = useCallback(async () => {
    setYearlyLoading(true);
    try {
      const res = await fetch(
        `/api/${exchange}/klines?symbol=${symbol.toUpperCase()}&interval=1d&limit=366`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch yearly data");
      }
      const data = await res.json();
      const klines = data.klines ?? [];
      setYearlyKlines(klines);

      const positionSize = calculatePositionSize(paperBalance, risk);
      const insight = computeYearlyInsight(
        klines,
        risk.takeProfitPercent,
        risk.stopLossPercent,
        positionSize,
        exchange
      );
      setYearlyInsight(insight);
      return insight;
    } catch {
      setYearlyKlines([]);
      setYearlyInsight(null);
      return null;
    } finally {
      setYearlyLoading(false);
    }
  }, [
    exchange,
    symbol,
    risk,
    paperBalance,
    setYearlyKlines,
    setYearlyInsight,
    setYearlyLoading,
  ]);

  useEffect(() => {
    fetchYearly();
  }, [fetchYearly]);

  return { fetchYearly };
}
