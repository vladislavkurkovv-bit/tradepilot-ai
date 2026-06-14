"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettingsStore } from "@/store/settings-store";
import { useTradingStore } from "@/store/trading-store";
import { validateOpenAIKey } from "@/lib/openai-errors";

export function OpenAIKeySettings() {
  const { openaiApiKey, setOpenaiApiKey } = useSettingsStore();
  const addLog = useTradingStore((s) => s.addLog);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    const validation = validateOpenAIKey(openaiApiKey);
    if (validation) {
      setTestResult({ ok: false, message: validation });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/openai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ ok: true, message: data.message });
        addLog("success", "OpenAI ключ проверен — OK");
      } else {
        setTestResult({ ok: false, message: data.error });
        addLog("error", data.error);
      }
    } catch {
      setTestResult({ ok: false, message: "Сеть или сервер недоступны" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <GlassCard className="p-4 lg:p-6">
      <h3 className="text-sm font-semibold mb-4">OpenAI Configuration</h3>

      <Alert className="mb-4 border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-400 text-sm">
          ChatGPT ≠ OpenAI API
        </AlertTitle>
        <AlertDescription className="text-xs text-zinc-400 leading-relaxed">
          Подписка ChatGPT (чат) — не оплата API. Ключ берите на
          platform.openai.com → API keys и пополните Billing. Сообщение «quota /
          limit exceeded» об означает нет баланса на API или слишком много
          запросов в минуту, а не что ChatGPT «закончился».
        </AlertDescription>
      </Alert>

      <div>
        <Label className="text-xs text-zinc-400">OpenAI API Key</Label>
        <Input
          type="password"
          value={openaiApiKey}
          onChange={(e) => {
            setOpenaiApiKey(e.target.value);
            setTestResult(null);
          }}
          onBlur={(e) => setOpenaiApiKey(e.target.value)}
          placeholder="sk-proj-... или sk-..."
          className="mt-1 bg-white/5 border-white/10"
        />
      </div>

      <Button
        type="button"
        size="sm"
        onClick={handleTest}
        disabled={testing || !openaiApiKey}
        className="mt-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white border-0"
      >
        {testing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        ) : testResult?.ok ? (
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        ) : null}
        Test OpenAI Key
      </Button>

      {testResult && (
        <p
          className={`text-xs mt-2 leading-relaxed ${testResult.ok ? "text-emerald-400" : "text-red-400"}`}
        >
          {testResult.message}
        </p>
      )}
    </GlassCard>
  );
}
