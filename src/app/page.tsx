"use client";

import { motion } from "framer-motion";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { StrategySummaryPanel } from "@/components/dashboard/StrategySummaryPanel";
import { ChartPanel } from "@/components/dashboard/ChartPanel";
import { MarketStatusPanel } from "@/components/dashboard/MarketStatusPanel";
import { AISignalPanel } from "@/components/dashboard/AISignalPanel";
import { TradingBotControls } from "@/components/dashboard/TradingBotControls";
import { TradeHistory } from "@/components/dashboard/TradeHistory";
import { LogsPanel } from "@/components/dashboard/LogsPanel";
import { useSettingsStore } from "@/store/settings-store";
import { useMarketData } from "@/hooks/useMarketData";
import { useMarketInsight } from "@/hooks/useMarketInsight";
import { useYearlyHistory } from "@/hooks/useYearlyHistory";
import { useBot } from "@/hooks/useBot";

export default function DashboardPage() {
  const { exchange, symbol } = useSettingsStore();
  const { loading, refetch } = useMarketData(exchange, symbol);
  const { fetchYearly } = useYearlyHistory(exchange, symbol);
  useMarketInsight();
  const { startBot, pauseBot, stopBot, emergencyStop } = useBot(refetch);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 lg:space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-sm text-zinc-500">
          AI trading bot — бот не торгует сразу, а ждёт профитный момент
        </p>
      </div>

      <StatsCards />

      <StrategySummaryPanel />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <ChartPanel
            onRefresh={refetch}
            onRefreshYearly={fetchYearly}
            loading={loading}
          />
        </div>
        <div className="space-y-4 lg:space-y-6">
          <AISignalPanel />
          <TradingBotControls
            onStart={startBot}
            onPause={pauseBot}
            onStop={stopBot}
            onEmergencyStop={emergencyStop}
          />
        </div>
      </div>

      <MarketStatusPanel />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <TradeHistory />
        <LogsPanel />
      </div>
    </motion.div>
  );
}
