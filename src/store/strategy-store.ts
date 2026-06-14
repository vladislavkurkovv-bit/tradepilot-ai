import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BacktestPeriod,
  BacktestResult,
  GridLevel,
  GridSettings,
  StrategyResult,
  StrategyType,
} from "@/lib/types";

const STRATEGY_STORAGE = "tradepilot-ai-strategy";

const defaultGrid: GridSettings = {
  lowerPrice: 90000,
  upperPrice: 110000,
  gridLevels: 10,
  investmentAmount: 1000,
  takeProfitPerGrid: 1.5,
  liveEnabled: false,
};

interface StrategyState {
  activeStrategy: StrategyType;
  strategyTimeframe: string;
  gridSettings: GridSettings;
  gridLevels: GridLevel[];
  lastStrategyResult: StrategyResult | null;
  lastBacktest: BacktestResult | null;
  backtestLoading: boolean;
  lastTradeAt: number;
  aiConfirmation: { approved: boolean; reason: string } | null;

  setActiveStrategy: (s: StrategyType) => void;
  setStrategyTimeframe: (tf: string) => void;
  setGridSettings: (g: Partial<GridSettings>) => void;
  setGridLevels: (levels: GridLevel[]) => void;
  setLastStrategyResult: (r: StrategyResult | null) => void;
  setLastBacktest: (r: BacktestResult | null) => void;
  setBacktestLoading: (v: boolean) => void;
  setLastTradeAt: (t: number) => void;
  setAiConfirmation: (c: StrategyState["aiConfirmation"]) => void;
}

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set) => ({
      activeStrategy: "ema_trend",
      strategyTimeframe: "1h",
      gridSettings: defaultGrid,
      gridLevels: [],
      lastStrategyResult: null,
      lastBacktest: null,
      backtestLoading: false,
      lastTradeAt: 0,
      aiConfirmation: null,

      setActiveStrategy: (activeStrategy) => set({ activeStrategy }),
      setStrategyTimeframe: (strategyTimeframe) => set({ strategyTimeframe }),
      setGridSettings: (gridSettings) =>
        set((s) => ({
          gridSettings: { ...s.gridSettings, ...gridSettings },
        })),
      setGridLevels: (gridLevels) => set({ gridLevels }),
      setLastStrategyResult: (lastStrategyResult) => set({ lastStrategyResult }),
      setLastBacktest: (lastBacktest) => set({ lastBacktest }),
      setBacktestLoading: (backtestLoading) => set({ backtestLoading }),
      setLastTradeAt: (lastTradeAt) => set({ lastTradeAt }),
      setAiConfirmation: (aiConfirmation) => set({ aiConfirmation }),
    }),
    {
      name: STRATEGY_STORAGE,
      partialize: (s) => ({
        activeStrategy: s.activeStrategy,
        strategyTimeframe: s.strategyTimeframe,
        gridSettings: s.gridSettings,
      }),
    }
  )
);

export { defaultGrid };
