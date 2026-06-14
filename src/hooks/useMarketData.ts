"use client";

import { useCallback, useEffect, useState } from "react";
import type { Exchange, MarketData } from "@/lib/types";
import { useTradingStore } from "@/store/trading-store";
import { useStrategyStore } from "@/store/strategy-store";
import { mapTimeframeToApi } from "@/lib/strategies";
import { getPreliminarySignal } from "@/lib/strategy";
import { enrichKlinesWithIndicators } from "@/lib/indicators";

export function useMarketData(exchange: Exchange, symbol: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setMarketData = useTradingStore((s) => s.setMarketData);
  const strategyTimeframe = useStrategyStore((s) => s.strategyTimeframe);

  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { interval, limit } = mapTimeframeToApi(strategyTimeframe, exchange);
      const res = await fetch(
        `/api/${exchange}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch market data");
      }
      const data = await res.json();
      const enriched = enrichKlinesWithIndicators(data.klines);
      const marketData: MarketData = {
        symbol: data.symbol,
        price: data.price,
        volume: data.volume,
        rsi: enriched.rsi,
        ma20: enriched.ma20,
        ma50: enriched.ma50,
        preliminarySignal: getPreliminarySignal(
          enriched.rsi,
          data.price,
          enriched.ma50
        ),
        klines: data.klines,
        indicators: enriched.indicators ?? undefined,
        timeframe: strategyTimeframe,
      };
      setMarketData(marketData);
      return marketData;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [exchange, symbol, strategyTimeframe, setMarketData]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void fetchMarketData();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchMarketData]);

  return { loading, error, refetch: fetchMarketData };
}
