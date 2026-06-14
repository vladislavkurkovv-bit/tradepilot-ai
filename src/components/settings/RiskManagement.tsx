"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/settings-store";

export function RiskManagement() {
  const { risk, setRisk } = useSettingsStore();

  return (
    <GlassCard className="p-4 lg:p-6">
      <h3 className="text-sm font-semibold mb-4">Risk Management</h3>

      <div className="space-y-5">
        <div>
          <Label className="text-xs text-zinc-400">Position Size Mode</Label>
          <Select
            value={risk.positionSizeMode}
            onValueChange={(v) =>
              v && setRisk({ positionSizeMode: v as "fixed" | "percent" })
            }
          >
            <SelectTrigger className="mt-1 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Amount (USDT)</SelectItem>
              <SelectItem value="percent">Percent of Balance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {risk.positionSizeMode === "fixed" ? (
          <div>
            <Label className="text-xs text-zinc-400">Fixed Amount</Label>
            <Select
              value={String(risk.fixedAmount)}
              onValueChange={(v) =>
                v && setRisk({ fixedAmount: Number(v) as 50 | 100 | 250 })
              }
            >
              <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 USDT</SelectItem>
                <SelectItem value="100">100 USDT</SelectItem>
                <SelectItem value="250">250 USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <Label className="text-xs text-zinc-400">Balance Percentage</Label>
            <Select
              value={String(risk.percentAmount)}
              onValueChange={(v) =>
                v && setRisk({ percentAmount: Number(v) as 1 | 3 | 5 })
              }
            >
              <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1%</SelectItem>
                <SelectItem value="3">3%</SelectItem>
                <SelectItem value="5">5%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-xs text-zinc-400">Stop Loss %</Label>
            <span className="text-xs tabular-nums">{risk.stopLossPercent}%</span>
          </div>
          <Slider
            value={[risk.stopLossPercent]}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              if (typeof v === "number") setRisk({ stopLossPercent: v });
            }}
            min={0.5}
            max={10}
            step={0.5}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-xs text-zinc-400">Take Profit %</Label>
            <span className="text-xs tabular-nums">
              {risk.takeProfitPercent}%
            </span>
          </div>
          <Slider
            value={[risk.takeProfitPercent]}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              if (typeof v === "number") setRisk({ takeProfitPercent: v });
            }}
            min={1}
            max={20}
            step={0.5}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-xs text-zinc-400">Max Daily Loss %</Label>
            <span className="text-xs tabular-nums">
              {risk.maxDailyLossPercent}%
            </span>
          </div>
          <Slider
            value={[risk.maxDailyLossPercent]}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              if (typeof v === "number") setRisk({ maxDailyLossPercent: v });
            }}
            min={1}
            max={20}
            step={1}
          />
        </div>

        <div>
          <Label className="text-xs text-zinc-400">Max Open Positions</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={risk.maxOpenPositions}
            onChange={(e) =>
              setRisk({ maxOpenPositions: parseInt(e.target.value) || 1 })
            }
            className="mt-1 bg-white/5 border-white/10"
          />
        </div>

        <div>
          <Label className="text-xs text-zinc-400">
            Cooldown between trades (seconds)
          </Label>
          <Input
            type="number"
            min={0}
            value={Math.round(risk.cooldownBetweenTradesMs / 1000)}
            onChange={(e) =>
              setRisk({
                cooldownBetweenTradesMs: (parseInt(e.target.value) || 0) * 1000,
              })
            }
            className="mt-1 bg-white/5 border-white/10"
          />
          <p className="text-[10px] text-zinc-600 mt-1">
            Applies to all strategies. Prevents rapid re-entry after a trade.
          </p>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-xs text-zinc-400">
              Min AI confidence (Hybrid / Live)
            </Label>
            <span className="text-xs tabular-nums">{risk.minAiConfidence}%</span>
          </div>
          <Slider
            value={[risk.minAiConfidence]}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              if (typeof v === "number") setRisk({ minAiConfidence: v });
            }}
            min={50}
            max={95}
            step={5}
          />
        </div>
      </div>
    </GlassCard>
  );
}
