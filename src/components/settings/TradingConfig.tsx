"use client";

import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettingsStore } from "@/store/settings-store";
import type { TradingMode } from "@/lib/types";

const PAIRS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

/**
 * Trading pair and Paper/Live mode. Live orders use the active Strategy Center strategy.
 */
export function TradingConfig() {
  const { symbol, tradingMode, setSymbol, setTradingMode } = useSettingsStore();

  return (
    <GlassCard className="p-4 lg:p-6">
      <h3 className="text-sm font-semibold mb-1">Trading configuration</h3>
      <p className="text-xs text-zinc-500 mb-4">
        Paper mode is default. Live sends real orders when the bot signal and risk rules
        pass — test strategies in Strategy Center first.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-zinc-400">Trading pair</Label>
          <Select value={symbol} onValueChange={(v) => v && setSymbol(v)}>
            <SelectTrigger className="mt-1 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAIRS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Trading mode</Label>
          <Select
            value={tradingMode}
            onValueChange={(v) => v && setTradingMode(v as TradingMode)}
          >
            <SelectTrigger className="mt-1 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paper">Paper Trading (simulated)</SelectItem>
              <SelectItem value="live">Live Trading (real orders)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tradingMode === "live" && (
        <Alert className="mt-4 border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-xs text-zinc-400">
            Live mode uses real funds on your exchange. Grid Live is off by default.
            Who who does not trade, works at the factory — use Paper first.
          </AlertDescription>
        </Alert>
      )}
    </GlassCard>
  );
}
