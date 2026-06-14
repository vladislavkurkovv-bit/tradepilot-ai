"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useTradingStore } from "@/store/trading-store";
import { useStrategyStore } from "@/store/strategy-store";
import { analyzeHybridWithOpenAI } from "@/services/openai-hybrid";
import {
  buildGridLevels,
  canExecuteLiveTrade,
  computeStrategySignal,
  getStrategyLabel,
  isCooldownActive,
  updateGridLevelAfterTrade,
} from "@/services/strategy-engine";
import type { HybridAISignal, Signal } from "@/lib/types";
import {
  calculatePositionSize,
  checkDailyLossLimit,
  checkPositionExit,
  closePaperPosition,
  executePaperBuy,
  executePaperSell,
  openPaperPosition,
} from "@/services/paper-trading";

const BOT_INTERVAL_MS = 30000;
/** Min gap between OpenAI calls when bot is running (avoids rate-limit false alarms) */
const OPENAI_MIN_GAP_MS = 180000;

export function useBot(refetchMarket?: () => Promise<unknown>) {
  const {
    exchange,
    symbol,
    tradingMode,
    risk,
    openaiApiKey,
    getActiveCredentials,
  } = useSettingsStore();

  const {
    activeStrategy,
    strategyTimeframe,
    gridSettings,
    gridLevels,
    setGridLevels,
    setLastStrategyResult,
    setLastTradeAt,
    setAiConfirmation,
    lastTradeAt,
  } = useStrategyStore();

  const {
    botStatus,
    paperAccount,
    setBotStatus,
    setBotPhase,
    setAiSignal,
    addTrade,
    addLog,
    updatePaperAccount,
  } = useTradingStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paperRef = useRef(paperAccount);
  const lastOpenAIAtRef = useRef(0);

  useEffect(() => {
    paperRef.current = paperAccount;
  }, [paperAccount]);

  const executeLiveTrade = useCallback(
    async (side: "BUY" | "SELL", quantity: number) => {
      const creds = getActiveCredentials();
      const res = await fetch(`/api/${exchange}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: creds.apiKey,
          apiSecret: creds.apiSecret,
          symbol,
          side,
          quantity,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order failed");
      }
      return res.json();
    },
    [exchange, symbol, getActiveCredentials]
  );

  const runBotCycle = useCallback(async () => {
    setBotPhase("scanning", "Сканируем рынок и обсчитываем индикаторы...");

    if (refetchMarket) {
      await refetchMarket();
    }

    const marketData = useTradingStore.getState().marketData;

    if (!marketData) {
      setBotPhase(
        "waiting_signal",
        "Нет данных рынка. Проверьте интернет и подождите загрузки графика."
      );
      addLog("warn", "Нет данных рынка — ждём загрузки свечей");
      return;
    }

    let levels = gridLevels;
    if (activeStrategy === "grid" && levels.length === 0) {
      levels = buildGridLevels(gridSettings, marketData.price);
      setGridLevels(levels);
    }

    try {
      setBotPhase(
        "analyzing",
        `Стратегия: ${getStrategyLabel(activeStrategy)} (${strategyTimeframe})...`
      );

      const strategyResult = computeStrategySignal(
        marketData.klines,
        activeStrategy,
        strategyTimeframe,
        marketData.price,
        gridSettings,
        levels
      );
      setLastStrategyResult(strategyResult);

      let aiSignal: HybridAISignal | {
        signal: Signal;
        confidence: number;
        reason: string;
        risk: "LOW" | "MEDIUM" | "HIGH";
        should_trade: boolean;
      } = {
        signal: strategyResult.signal,
        confidence: 60,
        reason: strategyResult.reason,
        risk: strategyResult.risk,
        should_trade: strategyResult.signal !== "HOLD",
      };

      if (activeStrategy === "ai_hybrid" && openaiApiKey) {
        const canCallOpenAI =
          Date.now() - lastOpenAIAtRef.current >= OPENAI_MIN_GAP_MS;
        if (canCallOpenAI) {
          try {
            const hybrid = await analyzeHybridWithOpenAI({
              exchange,
              symbol,
              timeframe: strategyTimeframe,
              price: marketData.price,
              indicators: strategyResult.indicators,
              preliminarySignal: strategyResult.signal,
              selectedStrategy: activeStrategy,
              openaiApiKey,
            });
            lastOpenAIAtRef.current = Date.now();
            aiSignal = hybrid;
            setAiSignal(hybrid);
            setAiConfirmation({
              approved: hybrid.should_trade,
              reason: hybrid.reason,
            });
            addLog(
              "info",
              `AI Hybrid: ${hybrid.signal} should_trade=${hybrid.should_trade}`
            );
          } catch (err) {
            addLog(
              "warn",
              err instanceof Error ? err.message : "Hybrid AI error"
            );
            setAiConfirmation({ approved: false, reason: "AI error" });
          }
        }
      } else if (activeStrategy !== "ai_hybrid") {
        setAiSignal(aiSignal);
      }

      const hybridAi: HybridAISignal | null =
        activeStrategy === "ai_hybrid" ? (aiSignal as HybridAISignal) : null;

      const liveCheck = canExecuteLiveTrade(
        activeStrategy,
        tradingMode,
        aiSignal.signal,
        hybridAi,
        risk,
        gridSettings.liveEnabled
      );

      let signal: Signal = aiSignal.signal;
      if (activeStrategy === "ai_hybrid") {
        const h = aiSignal as HybridAISignal;
        if (
          !h.should_trade ||
          (tradingMode === "live" && !liveCheck.allowed)
        ) {
          signal = "HOLD";
        }
      }

      if (tradingMode === "live" && !liveCheck.allowed && signal !== "HOLD") {
        addLog("warn", `Live blocked: ${liveCheck.reason}`);
        signal = "HOLD";
      }

      let account = paperRef.current;
      const activePositions = () =>
        account.positions.filter((position) => position.mode === tradingMode);

      for (const position of activePositions()) {
        const exit = checkPositionExit(position, marketData.price);
        if (exit) {
          const reason = exit === "sl" ? "Stop Loss" : "Take Profit";
          const trade = closePaperPosition(position, marketData.price, reason);
          if (tradingMode === "paper") {
            account = executePaperSell(account, position.id, trade);
            updatePaperAccount(account);
          } else {
            await executeLiveTrade("SELL", position.quantity);
            account = {
              ...account,
              positions: account.positions.filter((p) => p.id !== position.id),
            };
            updatePaperAccount({ positions: account.positions });
          }
          addTrade({ ...trade, exchange, mode: tradingMode });
          addLog(exit === "sl" ? "warn" : "success", `${reason}: ${position.symbol}`);
        }
      }

      if (signal === "SELL" && activePositions().length > 0) {
        setBotPhase("executing", "SELL сигнал — закрываем позиции...");
        for (const position of activePositions()) {
          const trade = closePaperPosition(
            position,
            marketData.price,
            "SELL сигнал"
          );
          if (tradingMode === "paper") {
            account = executePaperSell(account, position.id, trade);
            updatePaperAccount(account);
          } else {
            await executeLiveTrade("SELL", position.quantity);
            account = {
              ...account,
              positions: account.positions.filter((p) => p.id !== position.id),
            };
            updatePaperAccount({ positions: account.positions });
          }
          addTrade({ ...trade, exchange, mode: tradingMode });
          addLog("info", `Закрыто по SELL: ${position.symbol}`);
        }
        if (
          activeStrategy === "grid" &&
          strategyResult.gridLevelIndex != null
        ) {
          setGridLevels(
            updateGridLevelAfterTrade(
              levels,
              strategyResult.gridLevelIndex,
              "SELL"
            )
          );
        }
      }

      if (signal === "BUY") {
        setBotPhase("executing", "BUY сигнал — открываем сделку...");

        if (isCooldownActive(lastTradeAt, risk.cooldownBetweenTradesMs)) {
          setBotPhase("waiting_signal", "Cooldown между сделками — ждём.");
          addLog("warn", "Cooldown active — BUY пропущен");
          return;
        }

        if (
          tradingMode === "paper" &&
          checkDailyLossLimit(account, risk.maxDailyLossPercent)
        ) {
          setBotPhase(
            "waiting_signal",
            "Дневной лимит убытка достигнут. Новые покупки приостановлены."
          );
          addLog("warn", "Лимит дневного убытка — BUY пропущен");
          return;
        }

        if (activePositions().length >= risk.maxOpenPositions) {
          setBotPhase(
            "waiting_signal",
            `Достигнут лимит открытых позиций (${risk.maxOpenPositions}).`
          );
          addLog("warn", "Макс. позиций — BUY пропущен");
          return;
        }

        if (tradingMode === "live" && risk.positionSizeMode === "percent") {
          setBotPhase(
            "waiting_signal",
            "Live процент от баланса отключён: сначала нужно подтянуть реальный баланс биржи."
          );
          addLog("warn", "Live percent position sizing blocked");
          return;
        }

        const amount =
          tradingMode === "paper"
            ? calculatePositionSize(account.balance, risk)
            : risk.fixedAmount;

        if (amount < 10) {
          setBotPhase("waiting_signal", "Недостаточно баланса для сделки.");
          addLog("warn", "Мало баланса для BUY");
          return;
        }

        const position = {
          ...openPaperPosition(symbol, marketData.price, amount, risk),
          mode: tradingMode,
          strategy: activeStrategy,
        };

        if (tradingMode === "paper") {
          account = executePaperBuy(account, position, amount);
          updatePaperAccount(account);
        } else {
          await executeLiveTrade("BUY", amount / marketData.price);
          account = {
            ...account,
            positions: [...account.positions, position],
          };
          updatePaperAccount({ positions: account.positions });
        }

        addTrade({
          id: `trade-${Date.now()}`,
          symbol,
          side: "BUY",
          price: marketData.price,
          quantity: amount / marketData.price,
          amount,
          mode: tradingMode,
          exchange,
          timestamp: Date.now(),
          reason: aiSignal.reason,
        });
        addLog("success", `BUY ${symbol} @ $${marketData.price.toFixed(2)}`);
        setLastTradeAt(Date.now());
        if (
          activeStrategy === "grid" &&
          strategyResult.gridLevelIndex != null
        ) {
          setGridLevels(
            updateGridLevelAfterTrade(
              levels,
              strategyResult.gridLevelIndex,
              "BUY"
            )
          );
        }
        setBotPhase(
          "waiting_signal",
          `Позиция открыта. SL: -${risk.stopLossPercent}%, TP: +${risk.takeProfitPercent}%`
        );
        return;
      }

      setBotPhase(
        "waiting_signal",
        `${strategyResult.signal}: ${strategyResult.reason}. Next scan in 30s.`
      );
      addLog("info", `[${activeStrategy}] ${strategyResult.signal} — ${strategyResult.reason}`);
    } catch (err) {
      setBotPhase(
        "waiting_signal",
        "Ошибка цикла. Повтор через 30 сек."
      );
      addLog(
        "error",
        err instanceof Error ? err.message : "Ошибка бота"
      );
    }
  }, [
    exchange,
    symbol,
    tradingMode,
    risk,
    openaiApiKey,
    activeStrategy,
    strategyTimeframe,
    gridSettings,
    gridLevels,
    lastTradeAt,
    refetchMarket,
    setBotPhase,
    setAiSignal,
    addTrade,
    addLog,
    updatePaperAccount,
    setLastStrategyResult,
    setGridLevels,
    setAiConfirmation,
    setLastTradeAt,
    executeLiveTrade,
  ]);

  useEffect(() => {
    if (botStatus === "running") {
      runBotCycle();
      intervalRef.current = setInterval(runBotCycle, BOT_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (botStatus === "stopped") {
        setBotPhase(
          "idle",
          "Бот остановлен. Нажмите Start Bot — сразу начнётся сканирование."
        );
      }
      if (botStatus === "paused") {
        setBotPhase("paused", "Бот на паузе. Позиции сохранены.");
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [botStatus, runBotCycle, setBotPhase]);

  const startBot = () => {
    setBotStatus("running");
    addLog(
      "success",
      "Бот запущен! Active strategy scans market every 30s. Paper by default."
    );
    setBotPhase(
      "scanning",
      "Запуск... Первое сканирование рынка."
    );
  };

  const pauseBot = () => {
    setBotStatus("paused");
    addLog("info", "Бот на паузе");
  };

  const stopBot = () => {
    setBotStatus("stopped");
    addLog("info", "Бот остановлен");
  };

  const emergencyStop = () => {
    setBotStatus("stopped");
    addLog("error", "АВАРИЙНАЯ ОСТАНОВКА");
  };

  return { startBot, pauseBot, stopBot, emergencyStop, runBotCycle };
}
