import {
  startOfYesterday,
  endOfYesterday,
  isWithinInterval,
  format,
} from "date-fns";
import { calculateRSI, calculateSMA } from "./indicators";
import { getPreliminarySignal } from "./strategy";
import type { Kline, Signal } from "./types";

export interface ProfitableMoment {
  time: number;
  price: number;
  rsi: number;
  ma50: number;
  exitPrice: number;
  profitPercent: number;
  profitUsdt: number;
}

export interface MarketInsight {
  currentSummary: string;
  waitingFor: string;
  whyNoTrade: string;
  signal: Signal;
  rsiToBuy: number | null;
  priceVsMa50: "above" | "below" | "unknown";
  lastProfitableMoment: ProfitableMoment | null;
  yesterdayProfitableCount: number;
  yesterdayProfitableMoments: ProfitableMoment[];
  yesterdayTheoreticalProfit: number;
  sinceYesterdayProfitableCount: number;
  sinceYesterdayTheoreticalProfit: number;
  chartMarkers: Array<{ time: number; price: number; type: "buy" }>;
  analyzedAt: number;
}

function simulateProfitableBuy(
  klines: Kline[],
  index: number,
  takeProfitPercent: number,
  stopLossPercent: number,
  positionSizeUsdt: number,
  maxHoldCandles = 48
): ProfitableMoment | null {
  const slice = klines.slice(0, index + 1);
  const closes = slice.map((k) => k.close);
  const rsi = calculateRSI(closes);
  const ma50 = calculateSMA(closes, 50);
  const price = klines[index].close;

  if (rsi === null || ma50 === null) return null;
  if (!(rsi < 30 && price > ma50)) return null;

  const takeProfit = price * (1 + takeProfitPercent / 100);
  const stopLoss = price * (1 - stopLossPercent / 100);

  for (let j = index + 1; j < Math.min(index + maxHoldCandles, klines.length); j++) {
    if (klines[j].low <= stopLoss) return null;
    if (klines[j].high >= takeProfit) {
      const profitPercent = takeProfitPercent;
      const profitUsdt = positionSizeUsdt * (profitPercent / 100);
      return {
        time: klines[index].time,
        price,
        rsi,
        ma50,
        exitPrice: takeProfit,
        profitPercent,
        profitUsdt,
      };
    }
  }
  return null;
}

function scanProfitableMoments(
  klines: Kline[],
  takeProfitPercent: number,
  stopLossPercent: number,
  positionSizeUsdt: number,
  maxHoldCandles = 48
): ProfitableMoment[] {
  const moments: ProfitableMoment[] = [];
  for (let i = 50; i < klines.length; i++) {
    const m = simulateProfitableBuy(
      klines,
      i,
      takeProfitPercent,
      stopLossPercent,
      positionSizeUsdt,
      maxHoldCandles
    );
    if (m) moments.push(m);
  }
  return moments;
}

export interface InsightOptions {
  /** Max candles to hold before giving up (48h for 1H, ~90d for 1D) */
  maxHoldCandles?: number;
}

function buildWaitingExplanation(
  rsi: number | null,
  price: number,
  ma50: number | null,
  signal: Signal
): { waitingFor: string; whyNoTrade: string; rsiToBuy: number | null } {
  const rsiToBuy = rsi !== null ? Math.max(0, rsi - 30) : null;

  if (signal === "BUY") {
    return {
      waitingFor:
        "Сигнал BUY уже есть! Бот готов войти в сделку на следующем цикle сканирования.",
      whyNoTrade:
        "Условия для покупки выполнены (RSI < 30 и цена выше MA50). Ожидаем исполнение.",
      rsiToBuy: 0,
    };
  }

  if (signal === "SELL") {
    return {
      waitingFor:
        "Сейчас рынок перекуплен (RSI > 70). Ждём отката или закрываем открытые позиции.",
      whyNoTrade:
        "RSI слишком высокий для покупки. Покупать сейчас рискованно — ждём снижения RSI.",
      rsiToBuy,
    };
  }

  const parts: string[] = [];
  if (rsi !== null && rsi >= 30) {
    parts.push(
      `RSI = ${rsi.toFixed(1)} (нужно < 30, осталось опуститься на ${(rsi - 30).toFixed(1)} пункта)`
    );
  }
  if (ma50 !== null && price <= ma50) {
    parts.push(
      `цена $${price.toFixed(2)} ниже MA50 ($${ma50.toFixed(2)}) — ждём рост выше тренда`
    );
  }
  if (parts.length === 0) {
    parts.push("условия почти совпали, но сигнал HOLD — ждём чёткого момента");
  }

  return {
    waitingFor:
      "Ждём «дешёвую покупку в восхощем тренде»: RSI ниже 30, цена выше MA50. Это когда актив продают в панике, но общий тренд ещё растущий.",
    whyNoTrade: `Сейчас HOLD — ${parts.join("; ")}.`,
    rsiToBuy,
  };
}

function buildCurrentSummary(
  rsi: number | null,
  price: number,
  ma20: number | null,
  ma50: number | null,
  signal: Signal
): string {
  const trend =
    ma50 !== null
      ? price > ma50
        ? "восхощий (цена выше MA50)"
        : "нисхощий (цена ниже MA50)"
      : "неопределённый";

  let rsiText = "недостаточно данных";
  if (rsi !== null) {
    if (rsi < 30) rsiText = "перепродан — возможен отскок";
    else if (rsi > 70) rsiText = "перекуплен — возможна коррекция";
    else rsiText = "нейтральная зона (RSI 30–70)";
  }

  return `Сейчас ${signal}. Цена $${price.toFixed(2)}, тренд ${trend}. RSI: ${rsi?.toFixed(1) ?? "—"} — ${rsiText}. MA20: ${ma20?.toFixed(2) ?? "—"}, MA50: ${ma50?.toFixed(2) ?? "—"}.`;
}

export interface YearlyInsight {
  /** Source: Binance/Bybit public REST API */
  dataSource: string;
  interval: string;
  candleCount: number;
  lastProfitableMoment: ProfitableMoment | null;
  /** All profitable BUY+TP moments in the period */
  yearlyProfitableCount: number;
  yearlyTheoreticalProfit: number;
  profitableMoments: ProfitableMoment[];
  chartMarkers: Array<{ time: number; price: number; type: "buy" }>;
  analyzedAt: number;
}

export function computeYearlyInsight(
  klines: Kline[],
  takeProfitPercent: number,
  stopLossPercent: number,
  positionSizeUsdt: number,
  exchange: string
): YearlyInsight {
  const allProfitable = scanProfitableMoments(
    klines,
    takeProfitPercent,
    stopLossPercent,
    positionSizeUsdt,
    90
  );

  const lastProfitable =
    allProfitable.length > 0
      ? allProfitable[allProfitable.length - 1]
      : null;

  return {
    dataSource: `${exchange.toUpperCase()} Spot API (публичные свечи)`,
    interval: "1D",
    candleCount: klines.length,
    lastProfitableMoment: lastProfitable,
    yearlyProfitableCount: allProfitable.length,
    yearlyTheoreticalProfit: allProfitable.reduce((s, m) => s + m.profitUsdt, 0),
    profitableMoments: allProfitable,
    chartMarkers: allProfitable.map((m) => ({
      time: m.time,
      price: m.price,
      type: "buy" as const,
    })),
    analyzedAt: Date.now(),
  };
}

export function computeMarketInsight(
  klines: Kline[],
  takeProfitPercent: number,
  stopLossPercent: number,
  positionSizeUsdt: number,
  options?: InsightOptions
): MarketInsight {
  const closes = klines.map((k) => k.close);
  const rsi = calculateRSI(closes);
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const price = klines[klines.length - 1]?.close ?? 0;
  const signal = getPreliminarySignal(rsi, price, ma50);

  const maxHold = options?.maxHoldCandles ?? 48;

  const allProfitable = scanProfitableMoments(
    klines,
    takeProfitPercent,
    stopLossPercent,
    positionSizeUsdt,
    maxHold
  );

  const yesterdayStart = startOfYesterday();
  const yesterdayEnd = endOfYesterday();

  const yesterdayMoments = allProfitable.filter((m) =>
    isWithinInterval(new Date(m.time), {
      start: yesterdayStart,
      end: yesterdayEnd,
    })
  );

  const sinceYesterdayMoments = allProfitable.filter(
    (m) => m.time >= yesterdayStart.getTime()
  );

  const lastProfitable =
    allProfitable.length > 0
      ? allProfitable[allProfitable.length - 1]
      : null;

  const { waitingFor, whyNoTrade, rsiToBuy } = buildWaitingExplanation(
    rsi,
    price,
    ma50,
    signal
  );

  return {
    currentSummary: buildCurrentSummary(rsi, price, ma20, ma50, signal),
    waitingFor,
    whyNoTrade,
    signal,
    rsiToBuy,
    priceVsMa50:
      ma50 !== null ? (price > ma50 ? "above" : "below") : "unknown",
    lastProfitableMoment: lastProfitable,
    yesterdayProfitableCount: yesterdayMoments.length,
    yesterdayProfitableMoments: yesterdayMoments,
    yesterdayTheoreticalProfit: yesterdayMoments.reduce(
      (s, m) => s + m.profitUsdt,
      0
    ),
    sinceYesterdayProfitableCount: sinceYesterdayMoments.length,
    sinceYesterdayTheoreticalProfit: sinceYesterdayMoments.reduce(
      (s, m) => s + m.profitUsdt,
      0
    ),
    chartMarkers: allProfitable.map((m) => ({
      time: m.time,
      price: m.price,
      type: "buy" as const,
    })),
    analyzedAt: Date.now(),
  };
}

export function formatMomentTime(ts: number): string {
  return format(new Date(ts), "dd.MM.yyyy HH:mm");
}
