import type {
  Exchange,
  GridSettings,
  HybridAISignal,
  Kline,
  RiskSettings,
  Signal,
  StrategyResult,
  StrategyType,
} from "@/lib/types";
import { buildIndicatorsAtIndex } from "@/lib/indicators";
import {
  defaultTimeframeForStrategy,
  evaluateStrategy,
  getStrategyMeta,
} from "@/lib/strategies";
import type { GridLevel } from "@/lib/types";

export function findNearestGridLevelIndex(
  price: number,
  gridSettings: GridSettings
): number {
  const step =
    (gridSettings.upperPrice - gridSettings.lowerPrice) / gridSettings.gridLevels;
  let nearest = 0;
  let minDist = Infinity;
  for (let i = 0; i < gridSettings.gridLevels; i++) {
    const lp = gridSettings.lowerPrice + step * i;
    const d = Math.abs(price - lp);
    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  }
  return nearest;
}

export function updateGridLevelAfterTrade(
  levels: GridLevel[],
  levelIndex: number,
  side: "BUY" | "SELL"
): GridLevel[] {
  return levels.map((level, i) => {
    if (i !== levelIndex) return level;
    return {
      ...level,
      status: side === "BUY" ? "bought" : "empty",
    };
  });
}

export function computeStrategySignal(
  klines: Kline[],
  strategy: StrategyType,
  timeframe: string,
  price: number,
  gridSettings?: GridSettings,
  gridLevels?: GridLevel[]
): StrategyResult {
  const index = klines.length - 1;
  const indicators = buildIndicatorsAtIndex(klines, index);

  let gridCtx: { levelIndex: number; status: "empty" | "bought" } | undefined;
  if (strategy === "grid" && gridSettings && gridLevels) {
    const nearest = findNearestGridLevelIndex(price, gridSettings);
    const level = gridLevels[nearest];
    gridCtx = {
      levelIndex: nearest,
      status: level?.status === "bought" ? "bought" : "empty",
    };
  }

  const tradingSignal = evaluateStrategy(
    strategy,
    indicators,
    price,
    gridSettings,
    gridCtx
  );

  return {
    ...tradingSignal,
    timeframe,
    indicators,
    timestamp: Date.now(),
    gridLevelIndex: gridCtx?.levelIndex,
  };
}

export function buildGridLevels(settings: GridSettings, price: number): GridLevel[] {
  const step =
    (settings.upperPrice - settings.lowerPrice) / settings.gridLevels;
  return Array.from({ length: settings.gridLevels }, (_, i) => ({
    id: `grid-${i}`,
    price: settings.lowerPrice + step * i,
    status: price >= settings.lowerPrice + step * i ? "empty" : "empty",
    quantity: settings.investmentAmount / settings.gridLevels / price,
  }));
}

export function canExecuteLiveTrade(
  strategy: StrategyType,
  tradingMode: "paper" | "live",
  signal: Signal,
  ai: HybridAISignal | null,
  risk: RiskSettings,
  gridLiveEnabled: boolean
): { allowed: boolean; reason: string } {
  if (tradingMode === "paper") {
    return { allowed: signal === "BUY" || signal === "SELL", reason: "Paper mode" };
  }

  if (strategy === "grid" && !gridLiveEnabled) {
    return { allowed: false, reason: "Grid Live Trading disabled by default" };
  }

  if (strategy === "ai_hybrid") {
    if (!ai) return { allowed: false, reason: "No AI hybrid response" };
    if (!ai.should_trade)
      return { allowed: false, reason: "AI should_trade is false" };
    if (ai.confidence < risk.minAiConfidence)
      return {
        allowed: false,
        reason: `Confidence ${ai.confidence}% < min ${risk.minAiConfidence}%`,
      };
    if (ai.risk === "HIGH")
      return { allowed: false, reason: "AI risk HIGH blocked for Live" };
    if (ai.signal === "HOLD")
      return { allowed: false, reason: "AI signal HOLD" };
    return { allowed: true, reason: "AI hybrid approved" };
  }

  if (signal === "BUY" || signal === "SELL") {
    return { allowed: true, reason: "Strategy signal" };
  }
  return { allowed: false, reason: "HOLD" };
}

export function isCooldownActive(
  lastTradeAt: number,
  cooldownMs: number
): boolean {
  if (!lastTradeAt) return false;
  return Date.now() - lastTradeAt < cooldownMs;
}

export function fetchKlinesUrl(
  exchange: Exchange,
  symbol: string,
  timeframe: string,
  limit: number
): string {
  return `/api/${exchange}/klines?symbol=${symbol.toUpperCase()}&interval=${timeframe}&limit=${limit}`;
}

export function getDefaultTimeframe(strategy: StrategyType): string {
  return defaultTimeframeForStrategy(strategy);
}

export function getStrategyLabel(strategy: StrategyType): string {
  return getStrategyMeta(strategy).name;
}

export { defaultTimeframeForStrategy };
