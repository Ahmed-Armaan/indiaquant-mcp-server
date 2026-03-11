# IndiaQuant MCP

A Model Context Protocol (MCP) server that gives Claude real-time Indian stock market intelligence — live prices, options chains, trade signals, portfolio tracking, and virtual trading. Built entirely on free APIs.

---

## Architecture

Claude Desktop talks to the MCP server over stdio. Each tool call hits a service module which checks an in-memory cache before making an API request. The virtual portfolio is persisted in SQLite.


```
├── mcp/          # tool registration
├── services/     # market data, signals, greeks, scanner
├── portfolio/    # virtual trading, P&L, SQLite
├── types/        # shared interfaces
└── utils/        # cache
```

### Data flow

```
Claude Desktop (or any LLM of choice)
     │  MCP (stdio)
     ▼
 server.ts  ──► services/*  ──► yfinance / NewsAPI / Alpha Vantage
                    │
                 cache.ts  (TTL per data type)
                    │
              portfolio/db.ts  (SQLite)
```

---

## Free API Stack

| Purpose | API | Limit |
|---|---|---|
| Live prices + OHLC + Option Chain | yfinance (Yahoo Finance) | Unlimited |
| News & sentiment | NewsAPI.org | 100 req/day |

No paid APIs. No broker account required.

---

## Run

### Prerequisites

- [Node.js](https://nodejs.org)
- [Claude Desktop](https://claude.ai/download)
- [NewsAPI key](https://newsapi.org)

### 1. Clone & install

```bash
git clone https://github.com/your-username/indiaquant-mcp
cd indiaquant-mcp
npm install
```

### 2. Build

```bash
npx tsc
```

Output goes to `dist/`.

### 3. Connect to Claude Desktop

Find your Claude Desktop config file:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Add the following (replace the path with your actual project path):

```json
{
  "mcpServers": {
    "indiaquant": {
      "command": "node",
      "args": ["/absolute/path/to/indiaquant-mcp/dist/main.js"],
      "env": {
        "NEWS_API_KEY": "your_newsapi_key",
      }
    }
  }
}
```

### 4. Launch Claude Desktop

Fully launch Claude Desktop. You should see **indiaquant** listed under the MCP tools icon in the chat interface.

### Verify it's working

Ask Claude:
```
What's the live price of RELIANCE.NS?
```

If you get a live price back, the server is connected and working.

---

## MCP Tools

### `get_live_price`
Fetches live price, day change %, and volume for any NSE/BSE ticker.
```
symbol: "RELIANCE.NS"
→ { price, changePercentage, volume }
```

### `get_options_chain`
Returns all strikes with call/put open interest for a given expiry.
```
symbol: "NIFTY", expiry: "2025-06-26" (optional)
→ { calls: [{ strike, oi }], puts: [{ strike, oi }] }
```

### `analyze_sentiment`
Fetches the latest 10 news headlines for a symbol via NewsAPI and scores them using a positive/negative word lexicon.
```
symbol: "INFY"
→ { score: 0.45, signal: "BUY" }
```

### `generate_signal`
Combines 6 weighted indicators into a single BUY/SELL/HOLD signal with a confidence score (0–100).

| Indicator | Weight |
|---|---|
| EMA 20/50 crossover | 20% |
| RSI (14) | 20% |
| MACD | 20% |
| Bollinger Bands | 15% |
| Volume vs average | 10% |
| News sentiment | 15% |

```
symbol: "TCS.NS", frame: "1d"
→ { signal: "BUY", confidence: 72 }
```

### `get_portfolio_pnl`
Reads all open positions from SQLite and calculates unrealised P&L using live prices.
```
→ { positions: [...], totalPnL, totalValue, cashBalance, netWorth }
```

### `place_virtual_trade`
Executes a paper trade. BUY deducts from cash; SELL adds to cash. Rejects if insufficient funds or no position to sell.
```
symbol: "HDFCBANK.NS", qty: 10, side: "BUY"
→ order confirmation with execution price and remaining cash
```

### `calculate_greeks`
Pure Black-Scholes implementation — no external math libraries. Auto-fetches live spot price. Reads implied volatility from the options chain if not supplied.

Greeks returned:
- **Delta** — price sensitivity to spot move
- **Gamma** — rate of change of delta
- **Theta** — time decay per calendar day (₹)
- **Vega** — sensitivity to 1% IV move

```
symbol: "NIFTY", strike: 24000, expiry: "2025-06-26", type: "CE"
→ { delta, gamma, theta, vega, intrinsic, timeValue, spot }
```

### `detect_unusual_activity`
Scans the options chain and equity volume for anomalies:
- OI spike: single strike OI > 2× average
- Vol/OI ratio > 3× (aggressive positioning)
- Put/Call ratio > 1.5 (bearish) or < 0.5 (bullish)
- Max pain strike calculation
- Equity volume > 2× 3-month average

```
symbol: "RELIANCE"
→ { alerts: [...], summary }
```

### `scan_market`
Screens ~30 NSE stocks across 6 sectors with AND-logic filters. Runs in batches of 4 to respect rate limits.

```
sector: "IT", rsi_below: 30
→ oversold IT stocks sorted by RSI ascending
```

Supported filters: `sector`, `rsi_below`, `rsi_above`, `change_above`, `change_below`, `signal`, `min_volume`

### `get_sector_heatmap`
Returns average day change % per sector: IT, BANKING, ENERGY, FMCG.

---

## Design Decisions

**Why stdio transport?**
Claude Desktop connects to MCP servers via stdin/stdout. No HTTP server or port management needed — simpler and more reliable for local use.

**Why SQLite for portfolio?**
Lightweight, zero-config, file-based persistence. Survives server restarts without needing a separate database process.

**Why implement Black-Scholes from scratch?**
The assignment required it, and it keeps the dependency footprint small. The `normCdf` uses the Abramowitz & Stegun rational approximation (max error < 1.5×10⁻⁷), which is accurate enough for retail options analysis.

**Caching strategy**

An in-memory cache built on Map is used across all data types. Each cache entry stores the value alongside an expiry timestamp (Date.now() + ttl). On read, if the entry is expired it is deleted and null is returned, triggering a fresh fetch.

| Data | TTL |
|---|---|
| Market price | 20s |
| Options chain | 1 min |
| Sentiment | 5 min |
| Greeks | 5 min |

Keeps the app within free API rate limits under concurrent requests.

## Limitations

- NewsAPI free tier: 100 requests/day. Sentiment calls are cached aggressively to stay within limits.
- yfinance options data is delayed ~15 min for NSE. Not suitable for live scalping.
- Virtual portfolio resets if the SQLite file is deleted.
- `scan_market` with `signal` filter is slow (~10–15s) because it runs `generate_signal` per stock.
