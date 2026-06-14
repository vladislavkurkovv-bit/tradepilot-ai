import type {
  GridSettings,
  IndicatorSnapshot,
  RiskLevel,
  Signal,
  StrategyMeta,
  StrategyType,
  TradingSignal,
} from "./types";

export const STRATEGY_CATALOG: StrategyMeta[] = [
  {
    id: "ema_trend",
    name: "EMA Trend Strategy",
    description:
      "Real OG trend-following: EMA20/EMA50 crossover with RSI and volume filter. Best for directional moves on 15m–4h.",
    timeframes: ["15m", "1h", "4h"],
    tradeFrequency: "Low–Medium",
    risk: "MEDIUM",
    disclaimer:
      "Educational strategy. Past performance in backtest does not guarantee future results.",
  },
  {
    id: "scalping",
    name: "Scalping Strategy",
    description:
      "Real OG scalping: EMA9/EMA21 momentum + RSI + ATR filter. More trades on 1m/5m — higher fees & slippage risk.",
    timeframes: ["1m", "5m"],
    tradeFrequency: "High",
    risk: "HIGH",
    disclaimer:
      "Scalping is risky. Use Paper Trading first. Not financial advice.",
  },
  {
    id: "grid",
    name: "Grid Bot Strategy",
    description:
      "Real OG range grid: buy lower levels, sell at next grid step. Works in sideways markets only.",
    timeframes: ["15m", "1h"],
    tradeFrequency: "Medium (range-bound)",
    risk: "MEDIUM",
    disclaimer:
      "Grid can lose heavily in strong trends. Live grid disabled by default.",
    paperOnly: false,
  },
  {
    id: "ai_hybrid",
    name: "AI Hybrid Strategy",
    description:
      "Real OG hybrid: indicators produce a preliminary signal, OpenAI confirms with should_trade flag.",
    timeframes: ["15m", "1h", "4h"],
    tradeFrequency: "Low (AI filtered)",
    risk: "MEDIUM",
    disclaimer:
      "AI can be wrong. Live trades only when should_trade=true and confidence threshold met.",
  },
];

export function getStrategyMeta(id: StrategyType): StrategyMeta {
  return STRATEGY_CATALOG.find((s) => s.id === id) ?? STRATEGY_CATALOG[0];
}

function volumeAboveAverage(ind: IndicatorSnapshot): boolean {
  if (ind.avgVolume20 === null) return false;
  return ind.volume > ind.avgVolume20;
}

export function evaluateEmaTrend(ind: IndicatorSnapshot): TradingSignal {
  let signal: Signal = "HOLD";
  let reason = "No EMA trend setup";

  if (
    ind.ema20CrossUp &&
    ind.rsi !== null &&
    ind.rsi >= 40 &&
    ind.rsi <= 70 &&
    volumeAboveAverage(ind)
  ) {
    signal = "BUY";
    reason = "EMA20 crossed above EMA50, RSI 40–70, volume above avg";
  } else if (ind.ema20CrossDown || (ind.rsi !== null && ind.rsi > 75)) {
    signal = "SELL";
    reason = ind.ema20CrossDown
      ? "EMA20 crossed below EMA50"
      : "RSI overbought > 75";
  }

  return {
    signal,
    reason,
    strategy: "ema_trend",
    timeframe: "",
    risk: "MEDIUM",
  };
}

export function evaluateScalping(
  ind: IndicatorSnapshot,
  price: number,
  hitTpSl?: "tp" | "sl" | null
): TradingSignal {
  if (hitTpSl === "tp" || hitTpSl === "sl") {
    return {
      signal: "SELL",
      reason: hitTpSl === "tp" ? "Take Profit hit" : "Stop Loss hit",
      strategy: "scalping",
      timeframe: "",
      risk: "HIGH",
    };
  }

  const atrValue = ind.atr;
  const atrOk = atrValue != null && price > 0 && atrValue / price < 0.02;

  if (
    ind.ema9Above21 &&
    ind.rsi !== null &&
    ind.rsi >= 45 &&
    ind.rsi <= 65 &&
    volumeAboveAverage(ind) &&
    atrOk
  ) {
    return {
      signal: "BUY",
      reason: "EMA9>EMA21, RSI 45–65, volume up, ATR normal",
      strategy: "scalping",
      timeframe: "",
      risk: "HIGH",
    };
  }

  if (ind.ema9Below21 || (ind.rsi !== null && ind.rsi > 70)) {
    return {
      signal: "SELL",
      reason: ind.ema9Below21 ? "EMA9 below EMA21" : "RSI > 70",
      strategy: "scalping",
      timeframe: "",
      risk: "HIGH",
    };
  }

  return {
    signal: "HOLD",
    reason: "Scalping conditions not met",
    strategy: "scalping",
    timeframe: "",
    risk: "HIGH",
  };
}

export function evaluateGrid(
  price: number,
  grid: GridSettings,
  nearestLevelIndex: number,
  levelStatus: "empty" | "bought"
): TradingSignal {
  if (price < grid.lowerPrice || price > grid.upperPrice) {
    return {
      signal: "HOLD",
      reason: "Price outside grid range",
      strategy: "grid",
      timeframe: "",
      risk: "MEDIUM",
    };
  }

  const step = (grid.upperPrice - grid.lowerPrice) / grid.gridLevels;
  const levelPrice = grid.lowerPrice + step * nearestLevelIndex;

  if (levelStatus === "empty" && price <= levelPrice * 1.001) {
    return {
      signal: "BUY",
      reason: `Grid BUY at level ${nearestLevelIndex + 1}`,
      strategy: "grid",
      timeframe: "",
      risk: "MEDIUM",
    };
  }

  if (levelStatus === "bought") {
    const target = levelPrice * (1 + grid.takeProfitPerGrid / 100);
    if (price >= target) {
      return {
        signal: "SELL",
        reason: `Grid SELL level ${nearestLevelIndex + 1}`,
        strategy: "grid",
        timeframe: "",
        risk: "MEDIUM",
      };
    }
  }

  return {
    signal: "HOLD",
    reason: "Waiting for grid level",
    strategy: "grid",
    timeframe: "",
    risk: "MEDIUM",
  };
}

export function evaluateAiHybridPreliminary(
  ind: IndicatorSnapshot
): TradingSignal {
  const ema = evaluateEmaTrend(ind);
  if (ema.signal !== "HOLD") {
    return { ...ema, strategy: "ai_hybrid" };
  }
  return {
    signal: "HOLD",
    reason: "No preliminary setup for AI hybrid",
    strategy: "ai_hybrid",
    timeframe: "",
    risk: "MEDIUM",
  };
}

export function evaluateStrategy(
  strategy: StrategyType,
  ind: IndicatorSnapshot,
  price: number,
  grid?: GridSettings,
  gridCtx?: { levelIndex: number; status: "empty" | "bought" }
): TradingSignal {
  switch (strategy) {
    case "ema_trend":
      return evaluateEmaTrend(ind);
    case "scalping":
      return evaluateScalping(ind, price);
    case "grid":
      if (!grid || !gridCtx) {
        return {
          signal: "HOLD",
          reason: "Grid not configured",
          strategy: "grid",
          timeframe: "",
          risk: "MEDIUM",
        };
      }
      return evaluateGrid(price, grid, gridCtx.levelIndex, gridCtx.status);
    case "ai_hybrid":
      return evaluateAiHybridPreliminary(ind);
    default:
      return evaluateEmaTrend(ind);
  }
}

export function mapTimeframeToApi(
  timeframe: string,
  exchange: "binance" | "bybit"
): { interval: string; limit: number } {
  const limits: Record<string, number> = {
    "1m": 500,
    "5m": 500,
    "15m": 500,
    "1h": 500,
    "4h": 500,
  };
  const limit = limits[timeframe] ?? 500;

  if (exchange === "binance") {
    return { interval: timeframe, limit };
  }
  const bybitMap: Record<string, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "4h": "240",
  };
  return { interval: bybitMap[timeframe] ?? "60", limit };
}

export function periodToLimit(period: string): number {
  switch (period) {
    case "7d":
      return 200;
    case "30d":
      return 500;
    case "90d":
      return 500;
    case "365d":
      return 500;
    default:
      return 200;
  }
}

export function defaultTimeframeForStrategy(strategy: StrategyType): string {
  switch (strategy) {
    case "scalping":
      return "5m";
    case "grid":
      return "1h";
    default:
      return "1h";
  }
}

export function getStrategyRiskLevel(strategy: StrategyType): RiskLevel {
  return getStrategyMeta(strategy).risk;
}
