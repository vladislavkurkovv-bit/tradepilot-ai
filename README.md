# TradePilot AI

AI-powered crypto trading bot with **Binance** and **Bybit** support, **Strategy Center** (4 Real OG strategies), Paper/Live trading, backtesting, and OpenAI hybrid analysis.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)

## Features

- **Strategy Center** (`/strategy-center`): EMA Trend, Scalping, Grid Bot, AI Hybrid
- **Backtest Engine**: 7d / 30d / 90d / 1y performance metrics on historical candles
- **Exchange Support**: Binance Spot API & Bybit V5 API
- **Paper Trading** (default): Simulated $10,000 USDT — all strategies work here first
- **Live Trading**: Uses the **selected** strategy + risk rules (Grid Live off by default)
- **Risk Management**: Position size, SL/TP, daily loss, max positions, cooldown, min AI confidence
- **AI Hybrid**: OpenAI confirms preliminary indicator signals (`should_trade`, confidence, risk)
- **Dashboard**: Active strategy, last signal, AI confirm, backtest summary, chart with grid levels
- **Dark UI**: Glassmorphism fintech design, mobile-first layout

## Strategy Center

| Strategy | Timeframes | Risk | Description |
|----------|-----------|------|-------------|
| **EMA Trend** | 15m, 1h, 4h | MEDIUM | EMA20/50 cross + RSI + volume |
| **Scalping** | 1m, 5m | HIGH | EMA9/21 + RSI + ATR filter (Paper first) |
| **Grid Bot** | 15m, 1h | MEDIUM | Range grid — Paper active, Live prepared but disabled |
| **AI Hybrid** | 15m, 1h, 4h | MEDIUM | Indicators + OpenAI JSON approval for Live |

Each card shows name, description, timeframe, trade frequency, risk, **Select Strategy**, **Run Backtest**, Active/Inactive status.

Legacy RSI + MA50 logic remains in market insight panels for educational “profitable moment” stats.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS v4 + shadcn/ui |
| Charts | Recharts |
| State | Zustand (localStorage persist) |
| Animation | Framer Motion |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── binance/       # test, balance, price, klines, order
│   │   ├── bybit/         # test, balance, price, klines, order
│   │   └── openai/        # analyze, hybrid, test
│   ├── strategy-center/   # Strategy Center page
│   ├── settings/
│   └── page.tsx           # Dashboard
├── components/
│   ├── dashboard/         # Chart, Bot Controls, Strategy Summary, …
│   ├── strategy/          # StrategyPanel, StrategyCard, BacktestPanel, GridConfig
│   ├── settings/          # Exchange, TradingConfig, Risk, OpenAI
│   └── ui/
├── hooks/                 # useBot, useMarketData, useYearlyHistory
├── lib/
│   ├── indicators.ts      # EMA, RSI, ATR, volume
│   ├── strategies.ts      # Strategy catalog + evaluators
│   ├── backtest.ts         # Backtest engine (+ grid simulation)
│   └── types.ts
├── services/
│   ├── strategy-engine.ts # Signal computation, grid helpers, Live guards
│   ├── openai-hybrid.ts
│   └── paper-trading.ts
└── store/
    ├── strategy-store.ts  # Active strategy, grid, backtest results
    ├── settings-store.ts
    └── trading-store.ts
```

## Getting Started

```bash
cd tradepilot-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Configuration

Credentials stay **in your browser** (Zustand persist). API routes proxy exchange/OpenAI calls server-side.

### Exchange & Trading

**Settings → Exchange Connection** — API keys, test, balance.

**Settings → Trading configuration** — pair (BTCUSDT, …) and **Paper / Live** mode.

### Strategy Center workflow

1. Open **Strategies** in sidebar → `/strategy-center`
2. Pick a Real OG strategy and timeframe
3. **Run Backtest** (optional)
4. **Select Strategy** — bot uses this on Dashboard
5. Start bot in **Paper** mode first

### OpenAI

- **Analyze** (Dashboard): classic RSI/MA-style analysis
- **AI Hybrid**: bot calls `/api/openai/hybrid` (max ~1 call / 3 min) with indicator snapshot

Hybrid response:

```json
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reason": "short explanation",
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "should_trade": true | false
}
```

Live Hybrid trades require: `should_trade=true`, confidence ≥ min (Settings → Risk), risk ≠ HIGH, plus risk limits.

### Risk Management

| Parameter | Description |
|-----------|-------------|
| Position Size | Fixed USDT or % of balance |
| Stop Loss / Take Profit % | Auto-close |
| Max Daily Loss % | Blocks new BUY |
| Max Open Positions | Concurrent limit |
| Cooldown | Min seconds between trades |
| Min AI Confidence | For AI Hybrid Live |

## Bot behavior

- Scans every **30 seconds** when running
- **BUY** opens position; **SELL** / SL / TP closes
- Uses **active Strategy Center strategy** (not legacy RSI-only bot logic)
- Grid: updates grid level state on Paper BUY/SELL; grid lines on chart when Grid is active

## API Routes

| Route | Description |
|-------|-------------|
| `/api/{exchange}/klines` | Candles for chart, bot, backtest |
| `/api/openai/hybrid` | AI Hybrid strategy |
| `/api/openai/analyze` | Dashboard AI panel |
| `/api/{exchange}/order` | Live orders |

## Deploy to Cloudflare Pages

This app uses **Next.js API routes** (Binance / Bybit / OpenAI). Use Cloudflare’s **full-stack Next.js** preset, not static export.

### 1. Push to GitHub

```bash
cd tradepilot-ai
git init
git add .
git commit -m "Initial TradePilot AI release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tradepilot-ai.git
git push -u origin main
```

### 2. Cloudflare Pages

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select your `tradepilot-ai` repository
3. **Framework preset:** Next.js
4. **Build command:** `npm run build`
5. **Build output directory:** leave default (Cloudflare detects Next.js)
6. **Environment variables:** none required for basic deploy (API keys are entered in the app UI)

**Node.js version:** 20 (see `.nvmrc`)

After deploy, open your `*.pages.dev` URL. API routes (`/api/binance/*`, `/api/bybit/*`, `/api/openai/*`) run as Cloudflare Workers when using the Next.js preset.

## Disclaimer

**Educational software only.** Cryptocurrency trading involves substantial risk. **No profit is promised.** Past backtests and “profitable moment” markers do not predict future results. Test thoroughly in **Paper Trading** before Live. API keys: no withdrawal permission.

*Who does not trade, works at the factory.*

## License

MIT
