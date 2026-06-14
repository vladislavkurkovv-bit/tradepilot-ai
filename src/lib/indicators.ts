import type { Kline } from "./types";

export function calculateSMA(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

export const calculateEMA = calculateSMA;

export function calculateEMASeries(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  const result: number[] = new Array(period - 1).fill(NaN);
  result.push(ema);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

export function calculateRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateATR(klines: Kline[], period = 14): number | null {
  if (klines.length < period + 1) return null;
  let trSum = 0;
  for (let i = klines.length - period; i < klines.length; i++) {
    const high = klines[i].high;
    const low = klines[i].low;
    const prevClose = klines[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trSum += tr;
  }
  return trSum / period;
}

export function averageVolume(klines: Kline[], period = 20): number | null {
  if (klines.length < period) return null;
  const slice = klines.slice(-period);
  return slice.reduce((s, k) => s + k.volume, 0) / period;
}

export function detectCrossUp(
  seriesA: number[],
  seriesB: number[],
  index: number
): boolean {
  if (index < 1) return false;
  const a0 = seriesA[index - 1];
  const b0 = seriesB[index - 1];
  const a1 = seriesA[index];
  const b1 = seriesB[index];
  if ([a0, b0, a1, b1].some((v) => Number.isNaN(v))) return false;
  return a0 <= b0 && a1 > b1;
}

export function detectCrossDown(
  seriesA: number[],
  seriesB: number[],
  index: number
): boolean {
  if (index < 1) return false;
  const a0 = seriesA[index - 1];
  const b0 = seriesB[index - 1];
  const a1 = seriesA[index];
  const b1 = seriesB[index];
  if ([a0, b0, a1, b1].some((v) => Number.isNaN(v))) return false;
  return a0 >= b0 && a1 < b1;
}

export function buildIndicatorsAtIndex(
  klines: Kline[],
  index: number
) {
  const slice = klines.slice(0, index + 1);
  const closes = slice.map((k) => k.close);
  const ema9Series = calculateEMASeries(closes, 9);
  const ema20Series = calculateEMASeries(closes, 20);
  const ema21Series = calculateEMASeries(closes, 21);
  const ema50Series = calculateEMASeries(closes, 50);

  const rsi = calculateRSI(closes);
  const ema9 = ema9Series[index] ?? null;
  const ema20 = ema20Series[index] ?? null;
  const ema21 = ema21Series[index] ?? null;
  const ema50 = ema50Series[index] ?? null;
  const atr = calculateATR(slice);
  const volume = slice[slice.length - 1].volume;
  const avgVolume20 = averageVolume(slice);
  const prevVol = slice.length > 1 ? slice[slice.length - 2].volume : volume;
  const volumeChange =
    prevVol > 0 ? ((volume - prevVol) / prevVol) * 100 : null;

  return {
    rsi,
    ema9: Number.isNaN(ema9) ? null : ema9,
    ema20: Number.isNaN(ema20) ? null : ema20,
    ema21: Number.isNaN(ema21) ? null : ema21,
    ema50: Number.isNaN(ema50) ? null : ema50,
    atr,
    volume,
    avgVolume20,
    volumeChange,
    ema20CrossUp: detectCrossUp(ema20Series, ema50Series, index),
    ema20CrossDown: detectCrossDown(ema20Series, ema50Series, index),
    ema9Above21:
      ema9 !== null &&
      ema21 !== null &&
      !Number.isNaN(ema9) &&
      !Number.isNaN(ema21) &&
      ema9 > ema21,
    ema9Below21:
      ema9 !== null &&
      ema21 !== null &&
      !Number.isNaN(ema9) &&
      !Number.isNaN(ema21) &&
      ema9 < ema21,
  };
}

export function enrichKlinesWithIndicators(klines: Kline[]) {
  if (klines.length === 0) {
    return {
      rsi: null,
      ma20: null,
      ma50: null,
      indicators: null as ReturnType<typeof buildIndicatorsAtIndex> | null,
    };
  }
  const idx = klines.length - 1;
  const indicators = buildIndicatorsAtIndex(klines, idx);
  return {
    rsi: indicators.rsi,
    ma20: indicators.ema20,
    ma50: indicators.ema50,
    indicators,
  };
}

export function getLatestVolume(klines: Kline[]): number {
  if (klines.length === 0) return 0;
  return klines[klines.length - 1].volume;
}
