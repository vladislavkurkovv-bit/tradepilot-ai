import type {
  BacktestPeriod,
  BacktestResult,
  BacktestTrade,
  GridSettings,
  Kline,
  RiskSettings,
  StrategyType,
} from "./types";
import { buildIndicatorsAtIndex } from "./indicators";
import { evaluateGrid, evaluateStrategy } from "./strategies";
import { calculatePositionSize } from "@/services/paper-trading";
import { findNearestGridLevelIndex } from "@/services/strategy-engine";

type OpenPosition = {
  entry: number;
  qty: number;
  stopLoss: number;
  takeProfit: number;
} | null;

function simulateBar(
  klines: Kline[],
  index: number,
  strategy: StrategyType,
  balance: number,
  positionSize: number,
  risk: RiskSettings,
  openPosition: OpenPosition
): {
  balance: number;
  position: OpenPosition;
  trade: BacktestTrade | null;
} {
  const price = klines[index].close;
  const ind = buildIndicatorsAtIndex(klines, index);
  const sig = evaluateStrategy(strategy, ind, price);

  if (openPosition) {
    if (price <= openPosition.stopLoss) {
      const pnl = (price - openPosition.entry) * openPosition.qty;
      return {
        balance: balance + price * openPosition.qty,
        position: null,
        trade: {
          time: klines[index].time,
          side: "SELL",
          price,
          pnl,
          reason: "Stop Loss",
        },
      };
    }
    if (price >= openPosition.takeProfit) {
      const pnl = (price - openPosition.entry) * openPosition.qty;
      return {
        balance: balance + price * openPosition.qty,
        position: null,
        trade: {
          time: klines[index].time,
          side: "SELL",
          price,
          pnl,
          reason: "Take Profit",
        },
      };
    }
    if (sig.signal === "SELL") {
      const pnl = (price - openPosition.entry) * openPosition.qty;
      return {
        balance: balance + price * openPosition.qty,
        position: null,
        trade: {
          time: klines[index].time,
          side: "SELL",
          price,
          pnl,
          reason: sig.reason,
        },
      };
    }
    return { balance, position: openPosition, trade: null };
  }

  if (sig.signal === "BUY" && balance >= positionSize) {
    const qty = positionSize / price;
    return {
      balance: balance - positionSize,
      position: {
        entry: price,
        qty,
        stopLoss: price * (1 - risk.stopLossPercent / 100),
        takeProfit: price * (1 + risk.takeProfitPercent / 100),
      },
      trade: {
        time: klines[index].time,
        side: "BUY",
        price,
        pnl: 0,
        reason: sig.reason,
      },
    };
  }

  return { balance, position: openPosition, trade: null };
}

type GridSimState = {
  balance: number;
  levelStatus: ("empty" | "bought")[];
};

function simulateGridBar(
  klines: Kline[],
  index: number,
  grid: GridSettings,
  state: GridSimState,
  positionSize: number
): { state: GridSimState; trade: BacktestTrade | null } {
  const price = klines[index].close;
  if (price < grid.lowerPrice || price > grid.upperPrice) {
    return { state, trade: null };
  }

  const nearest = findNearestGridLevelIndex(price, grid);
  const status = state.levelStatus[nearest] ?? "empty";
  const sig = evaluateGrid(price, grid, nearest, status);

  if (sig.signal === "BUY" && state.balance >= positionSize) {
    const nextStatus = [...state.levelStatus];
    nextStatus[nearest] = "bought";
    return {
      state: {
        balance: state.balance - positionSize,
        levelStatus: nextStatus,
      },
      trade: {
        time: klines[index].time,
        side: "BUY",
        price,
        pnl: 0,
        reason: sig.reason,
      },
    };
  }

  if (sig.signal === "SELL" && status === "bought") {
    const step = (grid.upperPrice - grid.lowerPrice) / grid.gridLevels;
    const levelPrice = grid.lowerPrice + step * nearest;
    const sellPrice = levelPrice + step * 0.9;
    const qty = positionSize / levelPrice;
    const pnl = (sellPrice - levelPrice) * qty;
    const nextStatus = [...state.levelStatus];
    nextStatus[nearest] = "empty";
    return {
      state: {
        balance: state.balance + positionSize + pnl,
        levelStatus: nextStatus,
      },
      trade: {
        time: klines[index].time,
        side: "SELL",
        price: sellPrice,
        pnl,
        reason: sig.reason,
      },
    };
  }

  return { state, trade: null };
}

function runGridBacktest(
  klines: Kline[],
  grid: GridSettings,
  symbol: string,
  timeframe: string,
  period: BacktestPeriod,
  startingBalance: number,
  positionSize: number
): BacktestResult {
  const startIdx = Math.max(50, klines.length - periodToBars(period, timeframe));
  let state: GridSimState = {
    balance: startingBalance,
    levelStatus: Array(grid.gridLevels).fill("empty"),
  };
  const trades: BacktestTrade[] = [];
  let peak = startingBalance;
  let maxDrawdown = 0;

  for (let i = startIdx; i < klines.length; i++) {
    const result = simulateGridBar(
      klines,
      i,
      grid,
      state,
      positionSize
    );
    state = result.state;
    if (result.trade) trades.push(result.trade);

    const equity = state.balance;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const closed = trades.filter((t) => t.side === "SELL");
  const pnls = closed.map((t) => t.pnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossProfit = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));

  return {
    strategy: "grid",
    symbol,
    timeframe,
    period,
    startingBalance,
    finalBalance: state.balance,
    totalReturnPercent:
      ((state.balance - startingBalance) / startingBalance) * 100,
    totalTrades: closed.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    profitFactor:
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
    maxDrawdown,
    averageWin: wins.length ? grossProfit / wins.length : 0,
    averageLoss: losses.length ? grossLoss / losses.length : 0,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    trades,
    runAt: Date.now(),
  };
}

export function runBacktest(
  klines: Kline[],
  strategy: StrategyType,
  symbol: string,
  timeframe: string,
  period: BacktestPeriod,
  startingBalance: number,
  risk: RiskSettings,
  gridSettings?: GridSettings
): BacktestResult {
  const positionSize = calculatePositionSize(startingBalance, risk);

  if (strategy === "grid" && gridSettings) {
    return runGridBacktest(
      klines,
      gridSettings,
      symbol,
      timeframe,
      period,
      startingBalance,
      positionSize
    );
  }

  let balance = startingBalance;
  let openPosition: OpenPosition = null;
  const trades: BacktestTrade[] = [];
  let peak = startingBalance;
  let maxDrawdown = 0;

  const startIdx = Math.max(50, klines.length - periodToBars(period, timeframe));

  for (let i = startIdx; i < klines.length; i++) {
    const result = simulateBar(
      klines,
      i,
      strategy,
      balance,
      positionSize,
      risk,
      openPosition
    );
    balance = result.balance;
    openPosition = result.position;
    if (result.trade) trades.push(result.trade);

    const equity =
      balance + (openPosition ? openPosition.qty * klines[i].close : 0);
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  if (openPosition) {
    const last = klines[klines.length - 1];
    const pnl = (last.close - openPosition.entry) * openPosition.qty;
    balance += last.close * openPosition.qty;
    trades.push({
      time: last.time,
      side: "SELL",
      price: last.close,
      pnl,
      reason: "End of backtest",
    });
  }

  const closed = trades.filter((t) => t.side === "SELL");
  const pnls = closed.map((t) => t.pnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossProfit = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));

  return {
    strategy,
    symbol,
    timeframe,
    period,
    startingBalance,
    finalBalance: balance,
    totalReturnPercent: ((balance - startingBalance) / startingBalance) * 100,
    totalTrades: closed.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
    maxDrawdown,
    averageWin: wins.length ? grossProfit / wins.length : 0,
    averageLoss: losses.length ? grossLoss / losses.length : 0,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    trades,
    runAt: Date.now(),
  };
}

function periodToBars(period: BacktestPeriod, timeframe: string): number {
  const hoursMap: Record<BacktestPeriod, number> = {
    "7d": 7 * 24,
    "30d": 30 * 24,
    "90d": 90 * 24,
    "1y": 365 * 24,
  };
  const hours = hoursMap[period] ?? 7 * 24;
  const tfHours: Record<string, number> = {
    "1m": 1 / 60,
    "5m": 5 / 60,
    "15m": 0.25,
    "1h": 1,
    "4h": 4,
  };
  const barHours = tfHours[timeframe] ?? 1;
  return Math.floor(hours / barHours);
}

export { periodToBars };
