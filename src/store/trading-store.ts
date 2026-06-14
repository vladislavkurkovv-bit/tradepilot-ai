import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AISignal,
  BotPhase,
  BotStatus,
  LogEntry,
  MarketData,
  PaperAccount,
  Position,
  Trade,
} from "@/lib/types";
import type { MarketInsight, YearlyInsight } from "@/lib/market-insight";
import type { Kline } from "@/lib/types";
import { PAPER_KEY } from "@/lib/storage";

const defaultPaperAccount: PaperAccount = {
  balance: 10000,
  positions: [],
  dailyPnl: 0,
  dailyPnlResetAt: Date.now(),
};

interface TradingState {
  botStatus: BotStatus;
  botPhase: BotPhase;
  botStatusMessage: string;
  marketData: MarketData | null;
  marketInsight: MarketInsight | null;
  yearlyKlines: Kline[];
  yearlyInsight: YearlyInsight | null;
  yearlyLoading: boolean;
  aiSignal: AISignal | null;
  trades: Trade[];
  logs: LogEntry[];
  paperAccount: PaperAccount;
  connectionStatus: Record<"binance" | "bybit", boolean | null>;

  setBotStatus: (status: BotStatus) => void;
  setBotPhase: (phase: BotPhase, message?: string) => void;
  setMarketData: (data: MarketData | null) => void;
  setMarketInsight: (insight: MarketInsight | null) => void;
  setYearlyKlines: (klines: Kline[]) => void;
  setYearlyInsight: (insight: YearlyInsight | null) => void;
  setYearlyLoading: (loading: boolean) => void;
  setAiSignal: (signal: AISignal | null) => void;
  addTrade: (trade: Trade) => void;
  addLog: (level: LogEntry["level"], message: string) => void;
  clearLogs: () => void;
  setConnectionStatus: (
    exchange: "binance" | "bybit",
    connected: boolean | null
  ) => void;
  updatePaperAccount: (account: Partial<PaperAccount>) => void;
  addPaperPosition: (position: Position) => void;
  removePaperPosition: (id: string) => void;
  resetPaperAccount: () => void;
}

function createLog(level: LogEntry["level"], message: string): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    message,
    timestamp: Date.now(),
  };
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set) => ({
      botStatus: "stopped",
      botPhase: "idle",
      botStatusMessage: "Бот остановлен. Нажмите Start Bot для начала сканирования рынка.",
      marketData: null,
      marketInsight: null,
      yearlyKlines: [],
      yearlyInsight: null,
      yearlyLoading: false,
      aiSignal: null,
      trades: [],
      logs: [createLog("info", "TradePilot AI initialized")],
      paperAccount: defaultPaperAccount,
      connectionStatus: { binance: null, bybit: null },

      setBotStatus: (botStatus) => set({ botStatus }),
      setBotPhase: (botPhase, message) =>
        set((state) => ({
          botPhase,
          botStatusMessage: message ?? state.botStatusMessage,
        })),
      setMarketData: (marketData) => set({ marketData }),
      setMarketInsight: (marketInsight) => set({ marketInsight }),
      setYearlyKlines: (yearlyKlines) => set({ yearlyKlines }),
      setYearlyInsight: (yearlyInsight) => set({ yearlyInsight }),
      setYearlyLoading: (yearlyLoading) => set({ yearlyLoading }),
      setAiSignal: (aiSignal) => set({ aiSignal }),
      addTrade: (trade) =>
        set((state) => ({ trades: [trade, ...state.trades].slice(0, 100) })),
      addLog: (level, message) =>
        set((state) => ({
          logs: [createLog(level, message), ...state.logs].slice(0, 200),
        })),
      clearLogs: () => set({ logs: [] }),
      setConnectionStatus: (exchange, connected) =>
        set((state) => ({
          connectionStatus: { ...state.connectionStatus, [exchange]: connected },
        })),
      updatePaperAccount: (account) =>
        set((state) => ({
          paperAccount: { ...state.paperAccount, ...account },
        })),
      addPaperPosition: (position) =>
        set((state) => ({
          paperAccount: {
            ...state.paperAccount,
            positions: [...state.paperAccount.positions, position],
          },
        })),
      removePaperPosition: (id) =>
        set((state) => ({
          paperAccount: {
            ...state.paperAccount,
            positions: state.paperAccount.positions.filter((p) => p.id !== id),
          },
        })),
      resetPaperAccount: () => set({ paperAccount: defaultPaperAccount }),
    }),
    {
      name: PAPER_KEY,
      partialize: (state) => ({
        paperAccount: state.paperAccount,
        trades: state.trades,
      }),
    }
  )
);
