#!/usr/bin/env python3
"""
股票实时监控 - 美股
功能：终端实时显示 + 价格预警
数据源：Yahoo Finance（免费）
"""

import time
import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import yfinance as yf
    from rich.console import Console
    from rich.table import Table
    from rich.live import Live
    from rich.panel import Panel
    from rich.text import Text
    from rich import box
    from plyer import notification
except ImportError as e:
    print(f"缺少依赖: {e}")
    print("请运行: pip install yfinance rich plyer")
    sys.exit(1)

console = Console()

CONFIG_FILE = Path(__file__).parent / "stock_config.json"

DEFAULT_CONFIG = {
    "stocks": [
        {"symbol": "AAPL", "name": "苹果", "alert_up": 5.0, "alert_down": -5.0},
        {"symbol": "TSLA", "name": "特斯拉", "alert_up": 5.0, "alert_down": -5.0},
        {"symbol": "NVDA", "name": "英伟达", "alert_up": 5.0, "alert_down": -5.0},
        {"symbol": "MSFT", "name": "微软", "alert_up": 3.0, "alert_down": -3.0},
        {"symbol": "GOOGL", "name": "谷歌", "alert_up": 3.0, "alert_down": -3.0},
    ],
    "refresh_seconds": 30,
}


def load_config() -> dict:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    save_config(DEFAULT_CONFIG)
    return DEFAULT_CONFIG


def save_config(config: dict):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    console.print(f"[green]配置已保存到 {CONFIG_FILE}[/green]")


def fetch_stock_data(symbols: list[str]) -> dict:
    result = {}
    try:
        tickers = yf.Tickers(" ".join(symbols))
        for symbol in symbols:
            try:
                ticker = tickers.tickers[symbol]
                info = ticker.fast_info
                result[symbol] = {
                    "price": getattr(info, "last_price", None),
                    "prev_close": getattr(info, "previous_close", None),
                    "open": getattr(info, "open", None),
                    "day_high": getattr(info, "day_high", None),
                    "day_low": getattr(info, "day_low", None),
                    "volume": getattr(info, "three_month_average_volume", None),
                    "market_cap": getattr(info, "market_cap", None),
                }
            except Exception:
                result[symbol] = {"price": None, "prev_close": None}
    except Exception as e:
        console.print(f"[red]数据获取失败: {e}[/red]")
    return result


def format_change(price, prev_close) -> tuple[str, str]:
    """Returns (change_str, color)"""
    if price is None or prev_close is None or prev_close == 0:
        return "N/A", "white"
    change = price - prev_close
    pct = (change / prev_close) * 100
    sign = "+" if change >= 0 else ""
    color = "green" if change >= 0 else "red"
    return f"{sign}{change:.2f} ({sign}{pct:.2f}%)", color


def format_market_cap(mc) -> str:
    if mc is None:
        return "N/A"
    if mc >= 1e12:
        return f"${mc/1e12:.2f}T"
    if mc >= 1e9:
        return f"${mc/1e9:.2f}B"
    return f"${mc/1e6:.2f}M"


triggered_alerts: set = set()


def check_alerts(symbol: str, name: str, price, prev_close, alert_up: float, alert_down: float):
    if price is None or prev_close is None or prev_close == 0:
        return
    pct = (price - prev_close) / prev_close * 100
    key_up = f"{symbol}_up"
    key_down = f"{symbol}_down"

    if pct >= alert_up and key_up not in triggered_alerts:
        triggered_alerts.add(key_up)
        msg = f"{name}({symbol}) 涨幅 {pct:.2f}% 已超过预警线 +{alert_up}%"
        console.print(f"\n[bold green]🚀 涨幅预警: {msg}[/bold green]")
        try:
            notification.notify(title="股票涨幅预警", message=msg, timeout=5)
        except Exception:
            pass
    elif pct < alert_up and key_up in triggered_alerts:
        triggered_alerts.discard(key_up)

    if pct <= alert_down and key_down not in triggered_alerts:
        triggered_alerts.add(key_down)
        msg = f"{name}({symbol}) 跌幅 {pct:.2f}% 已超过预警线 {alert_down}%"
        console.print(f"\n[bold red]📉 跌幅预警: {msg}[/bold red]")
        try:
            notification.notify(title="股票跌幅预警", message=msg, timeout=5)
        except Exception:
            pass
    elif pct > alert_down and key_down in triggered_alerts:
        triggered_alerts.discard(key_down)


def build_table(config: dict, data: dict) -> Table:
    table = Table(
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
        border_style="blue",
        title=f"[bold]美股实时监控[/bold]  [dim]{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/dim]",
        title_justify="center",
    )
    table.add_column("代码", style="bold yellow", width=8)
    table.add_column("名称", width=10)
    table.add_column("最新价", justify="right", width=10)
    table.add_column("涨跌额/幅", justify="right", width=18)
    table.add_column("今开", justify="right", width=10)
    table.add_column("最高", justify="right", width=10)
    table.add_column("最低", justify="right", width=10)
    table.add_column("市值", justify="right", width=10)
    table.add_column("预警 ↑/↓", justify="center", width=12)

    for stock in config["stocks"]:
        symbol = stock["symbol"]
        name = stock.get("name", symbol)
        d = data.get(symbol, {})
        price = d.get("price")
        prev_close = d.get("prev_close")

        change_str, color = format_change(price, prev_close)
        price_str = f"${price:.2f}" if price else "N/A"
        open_str = f"${d['open']:.2f}" if d.get("open") else "N/A"
        high_str = f"${d['day_high']:.2f}" if d.get("day_high") else "N/A"
        low_str = f"${d['day_low']:.2f}" if d.get("day_low") else "N/A"
        alert_str = f"+{stock['alert_up']}% / {stock['alert_down']}%"

        table.add_row(
            symbol,
            name,
            price_str,
            Text(change_str, style=color),
            open_str,
            high_str,
            low_str,
            format_market_cap(d.get("market_cap")),
            Text(alert_str, style="dim"),
        )

        check_alerts(symbol, name, price, prev_close, stock["alert_up"], stock["alert_down"])

    return table


def add_stock_interactive(config: dict):
    console.print("\n[bold cyan]添加新股票[/bold cyan]")
    symbol = console.input("股票代码 (如 AMZN): ").strip().upper()
    if not symbol:
        return
    name = console.input(f"股票名称 (留空则用代码): ").strip() or symbol
    try:
        alert_up = float(console.input("涨幅预警 % (如 5): ").strip() or "5")
        alert_down = float(console.input("跌幅预警 % (如 -5, 输入负数): ").strip() or "-5")
    except ValueError:
        console.print("[red]输入无效，使用默认值 ±5%[/red]")
        alert_up, alert_down = 5.0, -5.0

    if alert_down > 0:
        alert_down = -alert_down

    for s in config["stocks"]:
        if s["symbol"] == symbol:
            console.print(f"[yellow]{symbol} 已在监控列表中[/yellow]")
            return

    config["stocks"].append({
        "symbol": symbol,
        "name": name,
        "alert_up": alert_up,
        "alert_down": alert_down,
    })
    save_config(config)
    console.print(f"[green]已添加 {name}({symbol})[/green]")


def remove_stock_interactive(config: dict):
    console.print("\n[bold cyan]当前监控列表:[/bold cyan]")
    for i, s in enumerate(config["stocks"]):
        console.print(f"  {i+1}. {s['name']}({s['symbol']})")
    idx = console.input("输入编号删除 (留空取消): ").strip()
    if not idx:
        return
    try:
        i = int(idx) - 1
        removed = config["stocks"].pop(i)
        save_config(config)
        console.print(f"[green]已删除 {removed['name']}({removed['symbol']})[/green]")
    except (ValueError, IndexError):
        console.print("[red]无效编号[/red]")


def show_menu():
    console.print(
        Panel(
            "[bold]操作菜单[/bold]\n"
            "  [cyan]m[/cyan] - 开始监控\n"
            "  [cyan]a[/cyan] - 添加股票\n"
            "  [cyan]r[/cyan] - 删除股票\n"
            "  [cyan]l[/cyan] - 查看列表\n"
            "  [cyan]q[/cyan] - 退出",
            border_style="blue",
        )
    )


def monitor_loop(config: dict):
    symbols = [s["symbol"] for s in config["stocks"]]
    refresh = config.get("refresh_seconds", 30)

    console.print(f"[dim]每 {refresh} 秒刷新一次，按 Ctrl+C 停止[/dim]\n")

    with Live(console=console, refresh_per_second=1, screen=False) as live:
        while True:
            data = fetch_stock_data(symbols)
            table = build_table(config, data)
            live.update(table)
            time.sleep(refresh)


def main():
    config = load_config()

    console.print(Panel(
        "[bold yellow]美股实时监控工具[/bold yellow]\n"
        "[dim]数据源: Yahoo Finance (免费)[/dim]",
        border_style="yellow",
        expand=False,
    ))

    if len(sys.argv) > 1 and sys.argv[1] == "--monitor":
        monitor_loop(config)
        return

    while True:
        show_menu()
        choice = console.input("\n请选择操作: ").strip().lower()

        if choice == "m":
            try:
                monitor_loop(config)
            except KeyboardInterrupt:
                console.print("\n[yellow]已停止监控[/yellow]")
        elif choice == "a":
            add_stock_interactive(config)
        elif choice == "r":
            remove_stock_interactive(config)
        elif choice == "l":
            console.print("\n[bold]当前监控列表:[/bold]")
            for s in config["stocks"]:
                console.print(f"  {s['name']}({s['symbol']})  预警: +{s['alert_up']}% / {s['alert_down']}%")
        elif choice == "q":
            console.print("[dim]再见！[/dim]")
            break
        else:
            console.print("[red]无效选项[/red]")


if __name__ == "__main__":
    main()
