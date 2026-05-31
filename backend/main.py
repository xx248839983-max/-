from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import asyncio
from concurrent.futures import ThreadPoolExecutor

app = FastAPI(title="投资助手 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_value_score(d: dict) -> int:
    score = 0

    pe = d.get("pe_ratio")
    if pe and pe > 0:
        if pe < 10:   score += 20
        elif pe < 15: score += 15
        elif pe < 20: score += 10
        elif pe < 25: score += 5

    pb = d.get("pb_ratio")
    if pb and pb > 0:
        if pb < 1:    score += 15
        elif pb < 1.5: score += 12
        elif pb < 2:  score += 8
        elif pb < 3:  score += 4

    div = (d.get("dividend_yield") or 0) * 100
    if div >= 5:   score += 20
    elif div >= 3: score += 15
    elif div >= 2: score += 10
    elif div >= 1: score += 5

    roe = (d.get("roe") or 0) * 100
    if roe >= 25:   score += 20
    elif roe >= 20: score += 15
    elif roe >= 15: score += 10
    elif roe >= 10: score += 5

    de = d.get("debt_equity")
    if de is not None:
        if de < 0.2:   score += 15
        elif de < 0.5: score += 10
        elif de < 1.0: score += 5

    pm = (d.get("profit_margin") or 0) * 100
    if pm >= 25:   score += 10
    elif pm >= 15: score += 7
    elif pm >= 10: score += 4
    elif pm >= 5:  score += 2

    return min(score, 100)


def fetch_single(symbol: str) -> dict:
    try:
        info = yf.Ticker(symbol).info

        price = info.get("currentPrice") or info.get("regularMarketPrice")
        prev = info.get("regularMarketPreviousClose") or info.get("previousClose")
        change_pct = (price - prev) / prev * 100 if price and prev and prev > 0 else None

        de_raw = info.get("debtToEquity")
        de = de_raw / 100 if de_raw is not None else None  # yfinance 返回百分比，转成倍数

        data = {
            "symbol": symbol,
            "name": info.get("longName") or info.get("shortName", symbol),
            "price": price,
            "change_pct": change_pct,
            "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "dividend_yield": info.get("dividendYield"),
            "roe": info.get("returnOnEquity"),
            "profit_margin": info.get("profitMargins"),
            "debt_equity": de,
            "revenue_growth": info.get("revenueGrowth"),
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector", ""),
            "error": None,
        }
        data["value_score"] = calculate_value_score(data)
        return data
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "value_score": 0}


@app.get("/api/screen")
async def screen(symbols: str):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()][:20]
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=10) as ex:
        tasks = [loop.run_in_executor(ex, fetch_single, s) for s in symbol_list]
        results = await asyncio.gather(*tasks)
    return {"results": list(results)}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
