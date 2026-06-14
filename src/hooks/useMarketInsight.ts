"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useTradingStore } from "@/store/trading-store";
import { computeMarketInsight } from "@/lib/market-insight";
import { calculatePositionSize } from "@/services/paper-trading";

export function useMarketInsight() {
  const marketData = useTradingStore((s) => s.marketData);
  const paperBalance = useTradingStore((s) => s.paperAccount.balance);
  const setMarketInsight = useTradingStore((s) => s.setMarketInsight);
  const { risk } = useSettingsStore();

  useEffect(() => {
    if (!marketData?.klines.length) {
      setMarketInsight(null);
      return;
    }

    const positionSize = calculatePositionSize(paperBalance, risk);

    const insight = computeMarketInsight(
      marketData.klines,
      risk.takeProfitPercent,
      risk.stopLossPercent,
      positionSize
    );

    setMarketInsight(insight);
  }, [marketData, risk, paperBalance, setMarketInsight]);
}
