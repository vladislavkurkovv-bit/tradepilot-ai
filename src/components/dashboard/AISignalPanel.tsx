"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTradingStore } from "@/store/trading-store";
import { useSettingsStore } from "@/store/settings-store";
import { analyzeWithOpenAI } from "@/services/openai";
import { useState } from "react";

const signalColors = {
  BUY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SELL: "bg-red-500/20 text-red-400 border-red-500/30",
  HOLD: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const riskColors = {
  LOW: "text-emerald-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-red-400",
};

export function AISignalPanel() {
  const aiSignal = useTradingStore((s) => s.aiSignal);
  const marketData = useTradingStore((s) => s.marketData);
  const setAiSignal = useTradingStore((s) => s.setAiSignal);
  const addLog = useTradingStore((s) => s.addLog);
  const { exchange, symbol, openaiApiKey } = useSettingsStore();
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!marketData) return;
    if (!openaiApiKey) {
      addLog("warn", "OpenAI API Key required for AI analysis");
      return;
    }
    setAnalyzing(true);
    try {
      const signal = await analyzeWithOpenAI({
        exchange,
        symbol,
        price: marketData.price,
        rsi: marketData.rsi,
        ma20: marketData.ma20,
        ma50: marketData.ma50,
        volume: marketData.volume,
        preliminarySignal: marketData.preliminarySignal,
        openaiApiKey,
      });
      setAiSignal(signal);
      addLog("success", `AI analysis: ${signal.signal} (${signal.confidence}%)`);
    } catch (err) {
      addLog("error", err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <GlassCard className="p-4 lg:p-6" glow>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Signal Panel</h3>
            <p className="text-xs text-zinc-500">OpenAI-powered analysis</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAnalyze}
          disabled={analyzing || !marketData}
          className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white border-0"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {analyzing ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      {aiSignal ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-lg px-4 py-1 font-bold ${signalColors[aiSignal.signal]}`}
            >
              {aiSignal.signal}
            </Badge>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">
                {aiSignal.confidence}%
              </p>
              <p className="text-[10px] text-zinc-500">Confidence</p>
            </div>
          </div>

          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${aiSignal.confidence}%` }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            />
          </div>

          <p className="text-sm text-zinc-300">{aiSignal.reason}</p>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Risk Level</span>
            <span className={`font-semibold ${riskColors[aiSignal.risk]}`}>
              {aiSignal.risk}
            </span>
          </div>

          {marketData && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-zinc-500">Strategy Signal</span>
                <p className="font-medium">{marketData.preliminarySignal}</p>
              </div>
              <div>
                <span className="text-zinc-500">Volume</span>
                <p className="font-medium tabular-nums">
                  {marketData.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="text-center py-8 text-zinc-500 text-sm">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Run AI analysis to get trading signals
        </div>
      )}
    </GlassCard>
  );
}
