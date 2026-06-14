"use client";

import { format } from "date-fns";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTradingStore } from "@/store/trading-store";

export function TradeHistory() {
  const trades = useTradingStore((s) => s.trades);

  return (
    <GlassCard className="p-4 lg:p-6">
      <h3 className="text-sm font-semibold mb-4">Trade History</h3>
      <ScrollArea className="h-[240px]">
        {trades.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            No trades yet
          </p>
        ) : (
          <div className="space-y-2">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        trade.side === "BUY"
                          ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                          : "border-red-500/30 text-red-400 text-[10px]"
                      }
                    >
                      {trade.side}
                    </Badge>
                    <span className="text-sm font-medium">{trade.symbol}</span>
                    <Badge variant="outline" className="text-[10px] border-white/10">
                      {trade.mode}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {format(new Date(trade.timestamp), "PP pp")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">
                    ${trade.price.toFixed(2)}
                  </p>
                  {trade.pnl !== undefined && (
                    <p
                      className={`text-xs tabular-nums ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </GlassCard>
  );
}
