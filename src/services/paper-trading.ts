import type {
  PaperAccount,
  Position,
  RiskSettings,
  Trade,
} from "@/lib/types";

export function calculatePositionSize(
  balance: number,
  risk: RiskSettings
): number {
  if (risk.positionSizeMode === "fixed") {
    return Math.min(risk.fixedAmount, balance * 0.95);
  }
  return balance * (risk.percentAmount / 100);
}

export function checkDailyLossLimit(
  account: PaperAccount,
  maxDailyLossPercent: number
): boolean {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (now - account.dailyPnlResetAt > dayMs) {
    return false;
  }

  const lossPercent = (Math.abs(Math.min(0, account.dailyPnl)) / 10000) * 100;
  return lossPercent >= maxDailyLossPercent;
}

export function openPaperPosition(
  symbol: string,
  price: number,
  amount: number,
  risk: RiskSettings
): Position {
  const quantity = amount / price;
  const stopLoss =
    price * (1 - risk.stopLossPercent / 100);
  const takeProfit =
    price * (1 + risk.takeProfitPercent / 100);

  return {
    id: `pos-${Date.now()}`,
    symbol,
    side: "LONG",
    entryPrice: price,
    quantity,
    stopLoss,
    takeProfit,
    openedAt: Date.now(),
    mode: "paper",
  };
}

export function closePaperPosition(
  position: Position,
  exitPrice: number,
  reason: string
): Trade {
  const amount = position.quantity * exitPrice;
  const entryAmount = position.quantity * position.entryPrice;
  const pnl = amount - entryAmount;

  return {
    id: `trade-${Date.now()}`,
    symbol: position.symbol,
    side: "SELL",
    price: exitPrice,
    quantity: position.quantity,
    amount,
    pnl,
    mode: "paper",
    exchange: "binance",
    timestamp: Date.now(),
    reason,
  };
}

export function checkPositionExit(
  position: Position,
  currentPrice: number
): "sl" | "tp" | null {
  if (currentPrice <= position.stopLoss) return "sl";
  if (currentPrice >= position.takeProfit) return "tp";
  return null;
}

export function executePaperBuy(
  account: PaperAccount,
  position: Position,
  amount: number
): PaperAccount {
  return {
    ...account,
    balance: account.balance - amount,
    positions: [...account.positions, position],
  };
}

export function executePaperSell(
  account: PaperAccount,
  positionId: string,
  trade: Trade
): PaperAccount {
  return {
    ...account,
    balance: account.balance + trade.amount,
    dailyPnl: account.dailyPnl + (trade.pnl || 0),
    positions: account.positions.filter((p) => p.id !== positionId),
  };
}
