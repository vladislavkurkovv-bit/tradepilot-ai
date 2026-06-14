import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  Exchange,
  ExchangeCredentials,
  RiskSettings,
  TradingMode,
} from "@/lib/types";
import { STORAGE_KEY } from "@/lib/storage";

const defaultRisk: RiskSettings = {
  positionSizeMode: "fixed",
  fixedAmount: 100,
  percentAmount: 3,
  stopLossPercent: 2,
  takeProfitPercent: 4,
  maxDailyLossPercent: 5,
  maxOpenPositions: 3,
  cooldownBetweenTradesMs: 60000,
  minAiConfidence: 70,
};

const emptyCredentials: ExchangeCredentials = {
  apiKey: "",
  apiSecret: "",
};

export const defaultSettings: AppSettings = {
  exchange: "binance",
  binance: { ...emptyCredentials },
  bybit: { ...emptyCredentials },
  openaiApiKey: "",
  tradingMode: "paper",
  symbol: "BTCUSDT",
  risk: defaultRisk,
};

interface SettingsState extends AppSettings {
  setExchange: (exchange: Exchange) => void;
  setCredentials: (
    exchange: Exchange,
    credentials: Partial<ExchangeCredentials>
  ) => void;
  setOpenaiApiKey: (key: string) => void;
  setTradingMode: (mode: TradingMode) => void;
  setSymbol: (symbol: string) => void;
  setRisk: (risk: Partial<RiskSettings>) => void;
  getActiveCredentials: () => ExchangeCredentials;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      setExchange: (exchange) => set({ exchange }),
      setCredentials: (exchange, credentials) =>
        set((state) => ({
          [exchange]: { ...state[exchange], ...credentials },
        })),
      setOpenaiApiKey: (openaiApiKey) =>
        set({ openaiApiKey: openaiApiKey.trim().replace(/\s+/g, "") }),
      setTradingMode: (tradingMode) => set({ tradingMode }),
      setSymbol: (symbol) => set({ symbol }),
      setRisk: (risk) =>
        set((state) => ({ risk: { ...state.risk, ...risk } })),
      getActiveCredentials: () => {
        const state = get();
        return state[state.exchange];
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        exchange: state.exchange,
        binance: state.binance,
        bybit: state.bybit,
        openaiApiKey: state.openaiApiKey,
        tradingMode: state.tradingMode,
        symbol: state.symbol,
        risk: state.risk,
      }),
    }
  )
);
