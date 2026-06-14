import type { Exchange, HybridAISignal, IndicatorSnapshot, Signal, StrategyType } from "@/lib/types";

interface HybridAnalyzeInput {
  exchange: Exchange;
  symbol: string;
  timeframe: string;
  price: number;
  indicators: IndicatorSnapshot;
  preliminarySignal: Signal;
  selectedStrategy: StrategyType;
  openaiApiKey: string;
}

export async function analyzeHybridWithOpenAI(
  input: HybridAnalyzeInput
): Promise<HybridAISignal> {
  const res = await fetch("/api/openai/hybrid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "OpenAI hybrid analysis failed");
  }

  return res.json();
}
