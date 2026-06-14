"use client";

import { motion } from "framer-motion";
import { ExchangeConnection } from "@/components/settings/ExchangeConnection";
import { TradingConfig } from "@/components/settings/TradingConfig";
import { RiskManagement } from "@/components/settings/RiskManagement";
import { OpenAISettings } from "@/components/settings/OpenAISettings";

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-zinc-500">
          Configure exchange, AI, and risk parameters
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExchangeConnection />
        <TradingConfig />
        <OpenAISettings />
        <div className="lg:col-span-2">
          <RiskManagement />
        </div>
      </div>
    </motion.div>
  );
}
