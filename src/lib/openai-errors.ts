/** Maps raw OpenAI API errors to clear user-facing messages (RU). */
export function parseOpenAIError(
  status: number,
  body: {
    error?: {
      message?: string;
      type?: string;
      code?: string;
    };
  }
): string {
  const msg = body.error?.message ?? "";
  const type = body.error?.type ?? "";
  const code = body.error?.code ?? "";
  const lower = msg.toLowerCase();

  if (status === 401 || type === "invalid_request_error" && lower.includes("api key")) {
    return (
      "Неверный API-ключ. Создайте ключ на platform.openai.com → API keys. " +
      "Ключ от ChatGPT (чат) — это не то же самое, что API-ключ."
    );
  }

  if (
    code === "insufficient_quota" ||
    type === "insufficient_quota" ||
    lower.includes("exceeded your current quota") ||
    lower.includes("insufficient_quota")
  ) {
    return (
      "Нет баланса на OpenAI API (quota). Подписка ChatGPT Plus ≠ оплата API. " +
      "Пополните баланс: platform.openai.com → Settings → Billing. " +
      "Без привязанной карты и депозита API не работает, даже если ChatGPT активен."
    );
  }

  if (
    status === 429 ||
    code === "rate_limit_exceeded" ||
    type === "rate_limit_exceeded" ||
    lower.includes("rate limit")
  ) {
    return (
      "Лимит запросов в минуту (rate limit), а не «конец подписки ChatGPT». " +
      "Бот шлёт запрос каждые 30 сек — подождите 1–2 мин или остановите бота. " +
      "На бесплатном/новом API-аккаунте лимиты ниже."
    );
  }

  if (lower.includes("model") && (lower.includes("not exist") || lower.includes("does not exist"))) {
    return `Модель недоступна для вашего аккаунта: ${msg}`;
  }

  if (msg) return msg;

  return `Ошибка OpenAI API (HTTP ${status})`;
}

export function normalizeOpenAIKey(key: string): string {
  return key.trim().replace(/\s+/g, "");
}

export function validateOpenAIKey(key: string): string | null {
  const normalized = normalizeOpenAIKey(key);
  if (!normalized) return "Ключ пустой";
  if (!normalized.startsWith("sk-")) {
    return "Ключ должен начинаться с sk- (с platform.openai.com, не из чата ChatGPT)";
  }
  if (normalized.length < 20) {
    return "Ключ слишком короткий — проверьте, что скопировали полность";
  }
  return null;
}
