"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { useTradingStore } from "@/store/trading-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatMomentTime } from "@/lib/market-insight";

const signalColors = {
  BUY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SELL: "bg-red-500/20 text-red-400 border-red-500/30",
  HOLD: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export function MarketStatusPanel() {
  const insight = useTradingStore((s) => s.marketInsight);
  const yearlyInsight = useTradingStore((s) => s.yearlyInsight);
  const yearlyLoading = useTradingStore((s) => s.yearlyLoading);
  const botPhase = useTradingStore((s) => s.botPhase);
  const botStatusMessage = useTradingStore((s) => s.botStatusMessage);
  const botStatus = useTradingStore((s) => s.botStatus);
  const { risk } = useSettingsStore();

  if (!insight) {
    return (
      <GlassCard className="p-4 lg:p-6">
        <p className="text-sm text-zinc-500 text-center py-4">
          Загрузка анализа рынка...
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 lg:p-6" glow>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <Info className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Что происходит на рынке</h3>
          <p className="text-xs text-zinc-500">
            Обновляется при каждом сканировании
          </p>
        </div>
        <Badge
          variant="outline"
          className={`ml-auto text-xs ${signalColors[insight.signal]}`}
        >
          {insight.signal}
        </Badge>
      </div>

      {botStatus === "running" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 capitalize">
              {botPhase === "scanning" && "Сканирование..."}
              {botPhase === "analyzing" && "AI анализ..."}
              {botPhase === "waiting_signal" && "Ожидание сигнала"}
              {botPhase === "executing" && "Исполнение сделки"}
              {botPhase === "idle" && "Активен"}
            </span>
          </div>
          <p className="text-xs text-zinc-300">{botStatusMessage}</p>
        </motion.div>
      )}

      <div className="space-y-4 text-sm">
        <section>
          <p className="text-xs text-zinc-500 uppercase mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Сейчас
          </p>
          <p className="text-zinc-300 leading-relaxed">{insight.currentSummary}</p>
        </section>

        <section className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <p className="text-xs text-violet-400 uppercase mb-1 flex items-center gap-1">
            <Target className="h-3 w-3" /> Чего мы ждём
          </p>
          <p className="text-zinc-300 leading-relaxed text-xs">
            {insight.waitingFor}
          </p>
        </section>

        <section className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400 uppercase mb-1">
            Почему нет сделки прямо сейчас
          </p>
          <p className="text-zinc-300 leading-relaxed text-xs">
            {insight.whyNoTrade}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Clock className="h-3 w-3" /> Последний профитный момент
            </p>
            {insight.lastProfitableMoment ? (
              <>
                <p className="text-sm font-medium mt-1">
                  {formatMomentTime(insight.lastProfitableMoment.time)}
                </p>
                <p className="text-xs text-emerald-400 tabular-nums">
                  +{insight.lastProfitableMoment.profitPercent.toFixed(1)}% (+$
                  {insight.lastProfitableMoment.profitUsdt.toFixed(2)})
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-500 mt-1">
                На часовом графике (7 дней) не найдено
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Вчера (профитные)
            </p>
            <p className="text-2xl font-bold mt-1 tabular-nums">
              {insight.yesterdayProfitableCount}
            </p>
            <p className="text-[10px] text-zinc-500">моментов для BUY+TP</p>
          </div>
        </section>

        <section className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 uppercase mb-2 flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Тетная прибыль (только +)
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-zinc-500">За вчера</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">
                +${insight.yesterdayTheoreticalProfit.toFixed(2)}
              </p>
              <p className="text-[10px] text-zinc-600">
                {insight.yesterdayProfitableCount} сделок × TP{" "}
                {risk.takeProfitPercent}%
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Со вчера 00:00</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">
                +${insight.sinceYesterdayTheoreticalProfit.toFixed(2)}
              </p>
              <p className="text-[10px] text-zinc-600">
                {insight.sinceYesterdayProfitableCount} профитных моментов
              </p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 mt-2 border-t border-white/10 pt-2">
            Расчёт: размер позиции по вашим настройкам риска, вход по
            сигналу BUY (RSI&lt;30 + цена&gt;MA50), вывод по Take Profit{" "}
            {risk.takeProfitPercent}%. Учитываются только сделки, закрытые в
            плюс.
          </p>
        </section>

        <section className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400 uppercase mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Годовой график (1D свечи)
          </p>
          {yearlyLoading ? (
            <p className="text-xs text-zinc-500">Загрузка 366 дней с биржи...</p>
          ) : yearlyInsight ? (
            <div className="space-y-3 text-xs">
              <p className="text-zinc-500">
                Источник:{" "}
                <span className="text-zinc-400">{yearlyInsight.dataSource}</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-zinc-500">Последний профитный сигнал за год</p>
                  {yearlyInsight.lastProfitableMoment ? (
                    <>
                      <p className="text-sm font-bold text-emerald-400 mt-1">
                        {formatMomentTime(
                          yearlyInsight.lastProfitableMoment.time
                        )}
                      </p>
                      <p className="text-zinc-400 tabular-nums">
                        ${yearlyInsight.lastProfitableMoment.price.toFixed(2)} → +
                        {yearlyInsight.lastProfitableMoment.profitPercent}% (+$
                        {yearlyInsight.lastProfitableMoment.profitUsdt.toFixed(2)})
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        RSI {yearlyInsight.lastProfitableMoment.rsi.toFixed(1)},
                        цена выше MA50 — условия BUY выполнены, TP достигнут
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500 mt-1">
                      За последний год не было дневных свечей, где стратегия
                      дала бы профит (BUY + Take Profit без Stop Loss)
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-zinc-500">Всего профитных за год</p>
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums mt-1">
                    {yearlyInsight.yearlyProfitableCount}
                  </p>
                  <p className="text-emerald-400/80 tabular-nums">
                    +${yearlyInsight.yearlyTheoreticalProfit.toFixed(2)} USDT
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {yearlyInsight.candleCount} дневных свечей, анализ на
                    дневном Тфике
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 border-t border-white/10 pt-2">
                Переключите график на «1 год» — зелёные точки покажут все
                исторические профитные входы.
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Не удалось загрузить годовые данные</p>
          )}
        </section>
      </div>
    </GlassCard>
  );
}
