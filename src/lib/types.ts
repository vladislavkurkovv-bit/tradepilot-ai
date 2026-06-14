export type Exchange = "binance" | "bybit";

export type TradingMode = "paper" | "live";

export type BotStatus = "stopped" | "running" | "paused";

export type BotPhase =
  | "idle"
  | "scanning"
  | "analyzing"
  | "waiting_signal"
  | "executing"
  | "paused";

export type Signal = "BUY" | "SELL" | "HOLD";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type StrategyType =
  | "ema_trend"
  | "scalping"
  | "grid"
  | "ai_hybrid";

export type BacktestPeriod = "7d" | "30d" | "90d" | "1y";

export interface AISignal {
  signal: Signal;
  confidence: number;
  reason: string;
  risk: RiskLevel;
  should_trade?: boolean;
}

export interface HybridAISignal extends AISignal {
  should_trade: boolean;
}

export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSnapshot {
  rsi: number | null;
  ema9: number | null;
  ema20: number | null;
  ema21: number | null;
  ema50: number | null;
  atr: number | null;
  volume: number;
  avgVolume20: number | null;
  volumeChange: number | null;
  ema20CrossUp: boolean;
  ema20CrossDown: boolean;
  ema9Above21: boolean;
  ema9Below21: boolean;
}

export interface TradingSignal {
  signal: Signal;
  reason: string;
  strategy: StrategyType;
  timeframe: string;
  risk: RiskLevel;
}

export interface StrategyResult extends TradingSignal {
  indicators: IndicatorSnapshot;
  timestamp: number;
  /** Nearest grid level index when strategy is grid */
  gridLevelIndex?: number;
}

export interface StrategyMeta {
  id: StrategyType;
  name: string;
  description: string;
  timeframes: string[];
  tradeFrequency: string;
  risk: RiskLevel;
  disclaimer: string;
  paperOnly?: boolean;
}

export interface GridSettings {
  lowerPrice: number;
  upperPrice: number;
  gridLevels: number;
  investmentAmount: number;
  takeProfitPerGrid: number;
  liveEnabled: boolean;
}

export interface GridLevel {
  id: string;
  price: number;
  status: "empty" | "bought" | "filled";
  quantity: number;
}

export interface BacktestTrade {
  time: number;
  side: "BUY" | "SELL";
  price: number;
  pnl: number;
  reason: string;
}

export interface BacktestResult {
  strategy: StrategyType;
  symbol: string;
  timeframe: string;
  period: BacktestPeriod;
  startingBalance: number;
  finalBalance: number;
  totalReturnPercent: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  trades: BacktestTrade[];
  runAt: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  rsi: number | null;
  ma20: number | null;
  ma50: number | null;
  preliminarySignal: Signal;
  klines: Kline[];
  indicators?: IndicatorSnapshot;
  timeframe?: string;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export type PositionSide = "LONG" | "SHORT";

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  openedAt: number;
  mode: TradingMode;
  strategy?: StrategyType;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  amount: number;
  pnl?: number;
  mode: TradingMode;
  exchange: Exchange;
  timestamp: number;
  reason?: string;
  strategy?: StrategyType;
}

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  timestamp: number;
}

export type PositionSizeMode = "fixed" | "percent";

export interface RiskSettings {
  positionSizeMode: PositionSizeMode;
  fixedAmount: 50 | 100 | 250;
  percentAmount: 1 | 3 | 5;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxDailyLossPercent: number;
  maxOpenPositions: number;
  cooldownBetweenTradesMs: number;
  minAiConfidence: number;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface AppSettings {
  exchange: Exchange;
  binance: ExchangeCredentials;
  bybit: ExchangeCredentials;
  openaiApiKey: string;
  tradingMode: TradingMode;
  symbol: string;
  risk: RiskSettings;
}

export interface PaperAccount {
  balance: number;
  positions: Position[];
  dailyPnl: number;
  dailyPnlResetAt: number;
}
