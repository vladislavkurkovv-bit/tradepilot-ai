"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Scatter,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { GlassCard } from "@/components/ui/glass-card";
import { useTradingStore } from "@/store/trading-store";
import { useStrategyStore } from "@/store/strategy-store";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChartRange = "1H" | "1Y";

interface ChartPanelProps {
  onRefresh: () => void;
  onRefreshYearly?: () => void;
  loading?: boolean;
}

export function ChartPanel({
  onRefresh,
  onRefreshYearly,
  loading,
}: ChartPanelProps) {
  const [range, setRange] = useState<ChartRange>("1H");
  const marketData = useTradingStore((s) => s.marketData);
  const yearlyKlines = useTradingStore((s) => s.yearlyKlines);
  const insight = useTradingStore((s) => s.marketInsight);
  const yearlyInsight = useTradingStore((s) => s.yearlyInsight);
  const yearlyLoading = useTradingStore((s) => s.yearlyLoading);
  const activeStrategy = useStrategyStore((s) => s.activeStrategy);
  const gridSettings = useStrategyStore((s) => s.gridSettings);

  const isYearly = range === "1Y";
  const showGrid =
    activeStrategy === "grid" && !isYearly && gridSettings.gridLevels > 0;
  const gridStep =
    (gridSettings.upperPrice - gridSettings.lowerPrice) / gridSettings.gridLevels;
  const gridLinePrices = showGrid
    ? Array.from({ length: gridSettings.gridLevels }, (_, i) =>
        gridSettings.lowerPrice + gridStep * i
      )
    : [];

  const chartData = isYearly
    ? yearlyKlines.map((k) => ({
        time: k.time,
        price: k.close,
      }))
    : (marketData?.klines.map((k) => ({
        time: k.time,
        price: k.close,
      })) ?? []);

  const profitMarkers = isYearly
    ? (yearlyInsight?.chartMarkers ?? [])
    : (insight?.chartMarkers ?? []);

  const handleRefresh = () => {
    if (isYearly) onRefreshYearly?.();
    else onRefresh();
  };

  const isLoading = isYearly ? yearlyLoading : loading;

  return (
    <GlassCard className="p-4 lg:p-6" glow>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold">Price Chart</h3>
          <p className="text-xs text-zinc-500">
            {marketData?.symbol || "—"} •{" "}
            {isYearly ? "1D • ~1 год" : "1H • 7 дней"} •{" "}
            {showGrid && (
              <span className="text-blue-400/80 mr-1">grid levels • </span>
            )}
            <span className="text-emerald-400/80">
              ● профитные ({profitMarkers.length})
            </span>
          </p>
          {isYearly && yearlyInsight && (
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Источник: {yearlyInsight.dataSource}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/20">
            {(["1H", "1Y"] as ChartRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1 text-xs rounded-md transition-colors",
                  range === r
                    ? "bg-violet-500/30 text-violet-300"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {r === "1H" ? "7 дней" : "1 год"}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="h-[280px] lg:h-[360px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) =>
                  format(
                    new Date(t),
                    isYearly ? "dd.MM.yy" : "MM/dd HH:mm"
                  )
                }
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                minTickGap={isYearly ? 40 : 20}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                labelFormatter={(t) => format(new Date(t as number), "PP")}
                formatter={(value, name) => {
                  if (name === "profitBuy")
                    return [`$${Number(value).toFixed(2)}`, "Профитный BUY"];
                  return [
                    `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                    "Price",
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={isYearly ? 1.5 : 2}
                fill="url(#priceGradient)"
              />
              {profitMarkers.length > 0 && (
                <Scatter
                  data={profitMarkers}
                  dataKey="price"
                  fill="#34d399"
                  name="profitBuy"
                  shape="circle"
                />
              )}
              {gridLinePrices.map((gp) => (
                <ReferenceLine
                  key={gp}
                  y={gp}
                  stroke="#60a5fa"
                  strokeDasharray="4 4"
                  strokeOpacity={0.45}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
            {isLoading ? "Загрузка годового графика..." : "Нет данных"}
          </div>
        )}
      </div>

      {!isYearly && marketData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10"
        >
          {[
            { label: "RSI", value: marketData.rsi?.toFixed(1) ?? "—" },
            { label: "MA20", value: marketData.ma20?.toFixed(2) ?? "—" },
            { label: "MA50", value: marketData.ma50?.toFixed(2) ?? "—" },
          ].map((ind) => (
            <div key={ind.label} className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase">{ind.label}</p>
              <p className="text-sm font-semibold tabular-nums">{ind.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {isYearly && yearlyInsight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-center"
        >
          <div>
            <p className="text-[10px] text-zinc-500 uppercase">Свечей</p>
            <p className="text-sm font-semibold">{yearlyInsight.candleCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase">Профитных за год</p>
            <p className="text-sm font-semibold text-emerald-400">
              {yearlyInsight.yearlyProfitableCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase">Прибыль за год</p>
            <p className="text-sm font-semibold text-emerald-400 tabular-nums">
              +${yearlyInsight.yearlyTheoreticalProfit.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase">Последний сигнал</p>
            <p className="text-xs font-medium">
              {yearlyInsight.lastProfitableMoment
                ? format(
                    new Date(yearlyInsight.lastProfitableMoment.time),
                    "dd.MM.yyyy"
                  )
                : "—"}
            </p>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}
