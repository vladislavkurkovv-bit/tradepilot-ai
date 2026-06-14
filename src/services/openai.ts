import type { AISignal, Exchange, Signal } from "@/lib/types";

interface AnalyzeInput {
  exchange: Exchange;
  symbol: string;
  price: number;
  rsi: number | null;
  ma20: number | null;
  ma50: number | null;
  volume: number;
  preliminarySignal: Signal;
  openaiApiKey: string;
}

export async function analyzeWithOpenAI(
  input: AnalyzeInput
): Promise<AISignal> {
  const res = await fetch("/api/openai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "OpenAI analysis failed");
  }

  return res.json();
}
