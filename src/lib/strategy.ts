import type { Signal } from "./types";

/** Legacy RSI+MA50 signal — kept for market insight compat */
export function getPreliminarySignal(
  rsi: number | null,
  price: number,
  ma50: number | null
): Signal {
  if (rsi === null) return "HOLD";

  if (rsi < 30 && ma50 !== null && price > ma50) {
    return "BUY";
  }

  if (rsi > 70) {
    return "SELL";
  }

  return "HOLD";
}
