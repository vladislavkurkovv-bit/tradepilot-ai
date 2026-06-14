"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Wifi } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/settings-store";
import { useTradingStore } from "@/store/trading-store";
import type { Exchange } from "@/lib/types";

export function ExchangeConnection() {
  const {
    exchange,
    binance,
    bybit,
    setExchange,
    setCredentials,
    getActiveCredentials,
  } = useSettingsStore();
  const setConnectionStatus = useTradingStore((s) => s.setConnectionStatus);
  const addLog = useTradingStore((s) => s.addLog);
  const connectionStatus = useTradingStore((s) => s.connectionStatus);

  const [testing, setTesting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balances, setBalances] = useState<
    Array<{ asset: string; total: number }>
  >([]);

  const creds = getActiveCredentials();

  const handleTest = async (ex: Exchange) => {
    setTesting(true);
    const c = ex === "binance" ? binance : bybit;
    try {
      const res = await fetch(`/api/${ex}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: c.apiKey, apiSecret: c.apiSecret }),
      });
      const data = await res.json();
      setConnectionStatus(ex, data.success);
      addLog(data.success ? "success" : "error", `${ex}: ${data.message}`);
    } catch {
      setConnectionStatus(ex, false);
      addLog("error", `${ex} test failed`);
    } finally {
      setTesting(false);
    }
  };

  const handleFetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/${exchange}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: creds.apiKey,
          apiSecret: creds.apiSecret,
        }),
      });
      const data = await res.json();
      if (data.balances) {
        setBalances(data.balances.slice(0, 5));
        addLog("success", "Balance fetched successfully");
      } else {
        addLog("error", data.error || "Failed to fetch balance");
      }
    } catch {
      addLog("error", "Balance fetch failed");
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <GlassCard className="p-4 lg:p-6" glow>
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold">Exchange Connection</h3>
      </div>

      <Alert className="mb-4 border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-400 text-sm">
          API Key Security Warning
        </AlertTitle>
        <AlertDescription className="text-xs text-zinc-400">
          For Live Trading, your API key must have <strong>Read</strong> and{" "}
          <strong>Trade</strong> permissions only.{" "}
          <strong>Never enable Withdrawal</strong> permissions. Keys are stored
          locally in your browser only — never in frontend code or server
          storage.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-zinc-400">Select Exchange</Label>
          <Select
            value={exchange}
            onValueChange={(v) => v && setExchange(v as Exchange)}
          >
            <SelectTrigger className="mt-1 bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binance">Binance</SelectItem>
              <SelectItem value="bybit">Bybit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-zinc-400">API Key</Label>
          <Input
            type="password"
            value={creds.apiKey}
            onChange={(e) =>
              setCredentials(exchange, { apiKey: e.target.value })
            }
            placeholder="Enter API Key"
            className="mt-1 bg-white/5 border-white/10"
          />
        </div>

        <div>
          <Label className="text-xs text-zinc-400">API Secret</Label>
          <Input
            type="password"
            value={creds.apiSecret}
            onChange={(e) =>
              setCredentials(exchange, { apiSecret: e.target.value })
            }
            placeholder="Enter API Secret"
            className="mt-1 bg-white/5 border-white/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleTest("binance")}
            disabled={testing}
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            {testing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : connectionStatus.binance ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
            ) : null}
            Test Binance
          </Button>
          <Button
            onClick={() => handleTest("bybit")}
            disabled={testing}
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            {testing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : connectionStatus.bybit ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
            ) : null}
            Test Bybit
          </Button>
          <Button
            onClick={handleFetchBalance}
            disabled={balanceLoading}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0"
          >
            {balanceLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            )}
            Get Balance
          </Button>
        </div>

        {balances.length > 0 && (
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <p className="text-xs text-zinc-500 mb-2">Top Balances</p>
            {balances.map((b) => (
              <div
                key={b.asset}
                className="flex justify-between text-sm"
              >
                <span>{b.asset}</span>
                <span className="tabular-nums">{b.total.toFixed(4)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
