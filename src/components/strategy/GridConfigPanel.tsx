"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useStrategyStore } from "@/store/strategy-store";
import { useTradingStore } from "@/store/trading-store";
import { buildGridLevels } from "@/services/strategy-engine";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GridConfigPanel() {
  const gridSettings = useStrategyStore((s) => s.gridSettings);
  const setGridSettings = useStrategyStore((s) => s.setGridSettings);
  const setGridLevels = useStrategyStore((s) => s.setGridLevels);
  const gridLevels = useStrategyStore((s) => s.gridLevels);
  const price = useTradingStore((s) => s.marketData?.price ?? 100000);

  const update = (patch: Partial<typeof gridSettings>) => {
    const next = { ...gridSettings, ...patch };
    setGridSettings(next);
    setGridLevels(buildGridLevels(next, price));
  };

  return (
    <GlassCard className="p-4 lg:p-6">
      <h3 className="text-sm font-semibold mb-2">Grid Bot configuration</h3>
      <Alert className="mb-4 border-blue-500/30 bg-blue-500/10">
        <AlertDescription className="text-xs text-zinc-400">
          Set price range and levels. Paper grid is active when strategy is Grid.
          Live grid: prepared but off by default (toggle in settings below).
        </AlertDescription>
      </Alert>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { key: "lowerPrice", label: "Lower price", type: "number" },
          { key: "upperPrice", label: "Upper price", type: "number" },
          { key: "gridLevels", label: "Grid levels", type: "number" },
          { key: "investmentAmount", label: "Investment USDT", type: "number" },
          { key: "takeProfitPerGrid", label: "TP per grid %", type: "number" },
        ].map((f) => (
          <div key={f.key}>
            <Label className="text-xs text-zinc-400">{f.label}</Label>
            <Input
              type="number"
              className="mt-1 bg-white/5 border-white/10"
              value={gridSettings[f.key as keyof typeof gridSettings] as number}
              onChange={(e) =>
                update({
                  [f.key]: parseFloat(e.target.value) || 0,
                } as Partial<typeof gridSettings>)
              }
            />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 mt-4 text-xs text-zinc-400">
        <input
          type="checkbox"
          checked={gridSettings.liveEnabled}
          onChange={(e) => update({ liveEnabled: e.target.checked })}
          className="rounded"
        />
        Enable Live Grid (advanced — use at your own risk)
      </label>
      {gridLevels.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-zinc-500 mb-2">Active grid levels</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto text-[10px]">
            {gridLevels.map((level, i) => (
              <div
                key={level.id}
                className={`p-2 rounded-lg border ${
                  level.status === "bought"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/5 text-zinc-400"
                }`}
              >
                <span className="font-medium">L{i + 1}</span>
                <span className="block tabular-nums">${level.price.toFixed(0)}</span>
                <span className="block uppercase">{level.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
