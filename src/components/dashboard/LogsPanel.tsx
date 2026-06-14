"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTradingStore } from "@/store/trading-store";

const levelColors = {
  info: "text-blue-400",
  warn: "text-amber-400",
  error: "text-red-400",
  success: "text-emerald-400",
};

export function LogsPanel() {
  const logs = useTradingStore((s) => s.logs);
  const clearLogs = useTradingStore((s) => s.clearLogs);

  return (
    <GlassCard className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Logs</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          className="text-zinc-500 hover:text-white h-7"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-1 font-mono text-[11px]">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 py-0.5">
              <span className="text-zinc-600 shrink-0">
                {format(new Date(log.timestamp), "HH:mm:ss")}
              </span>
              <span className={`uppercase shrink-0 w-14 ${levelColors[log.level]}`}>
                [{log.level}]
              </span>
              <span className="text-zinc-400">{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}
