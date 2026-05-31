import { useState, useMemo, useCallback } from "react";

const GROUPS = {
  "科技龙头": ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMZN"],
  "价值蓝筹": ["BRK-B", "JPM", "JNJ", "PG", "KO", "WMT", "BAC"],
  "高股息":   ["T", "VZ", "MO", "PFE", "XOM", "CVX", "IBM"],
  "成长股":   ["TSLA", "CRWD", "SNOW", "DDOG", "NET", "SHOP"],
  "金融股":   ["JPM", "BAC", "GS", "V", "MA", "AXP"],
  "消费股":   ["MCD", "SBUX", "NKE", "DIS", "COST", "TGT"],
};

const FILTER_DEFAULTS = { pe_max:"", pb_max:"", div_min:"", roe_min:"", de_max:"", pm_min:"" };

const COLS = [
  { key:"value_score",    label:"评分",    w:140, nosort:false },
  { key:"symbol",         label:"代码/名称", w:150, nosort:true  },
  { key:"price",          label:"股价",    w:80,  nosort:false },
  { key:"change_pct",     label:"涨跌",    w:75,  nosort:false },
  { key:"pe_ratio",       label:"P/E",    w:70,  nosort:false },
  { key:"pb_ratio",       label:"P/B",    w:70,  nosort:false },
  { key:"dividend_yield", label:"股息率",  w:75,  nosort:false },
  { key:"roe",            label:"ROE",    w:70,  nosort:false },
  { key:"profit_margin",  label:"净利率",  w:70,  nosort:false },
  { key:"debt_equity",    label:"负债率",  w:70,  nosort:false },
];

function scoreStyle(s) {
  if (s >= 70) return { color:"#34d399", bg:"rgba(52,211,153,0.12)",  border:"rgba(52,211,153,0.3)",  label:"优选" };
  if (s >= 50) return { color:"#63b3ed", bg:"rgba(99,179,237,0.12)",  border:"rgba(99,179,237,0.3)",  label:"关注" };
  if (s >= 30) return { color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.3)",  label:"一般" };
  return              { color:"#f87171", bg:"rgba(248,113,113,0.1)",  border:"rgba(248,113,113,0.25)", label:"谨慎" };
}

function ScoreBadge({ score }) {
  const s = scoreStyle(score);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
      <div style={{ width:"56px", height:"5px", background:"rgba(255,255,255,0.05)", borderRadius:"3px", overflow:"hidden" }}>
        <div style={{ width:`${score}%`, height:"100%", background:s.color, borderRadius:"3px" }} />
      </div>
      <span style={{ fontSize:"11px", fontWeight:700, color:s.color, background:s.bg, border:`1px solid ${s.border}`, padding:"1px 7px", borderRadius:"4px", whiteSpace:"nowrap" }}>
        {score} {s.label}
      </span>
    </div>
  );
}

function Cell({ value, suffix="", digits=1, lowerBetter=false, good, bad }) {
  if (value == null) return <span style={{ color:"#2a2a3a" }}>—</span>;
  const n = parseFloat(value);
  let color = "#9ca3af";
  if (!lowerBetter) {
    if (good !== undefined && n >= good) color = "#34d399";
    else if (bad !== undefined && n <= bad) color = "#f87171";
  } else {
    if (good !== undefined && n <= good) color = "#34d399";
    else if (bad !== undefined && n >= bad) color = "#f87171";
  }
  return <span style={{ color, fontVariantNumeric:"tabular-nums" }}>{n.toFixed(digits)}{suffix}</span>;
}

export default function App() {
  const [input, setInput] = useState("AAPL,MSFT,GOOGL,NVDA,TSLA,JPM,JNJ,KO,XOM,V");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("value_score");
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetch_ = useCallback(async (symbols) => {
    if (!symbols.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/screen?symbols=${encodeURIComponent(symbols)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  function pickGroup(name) {
    const s = GROUPS[name].join(",");
    setActiveGroup(name); setInput(s); fetch_(s);
  }

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  const rows = useMemo(() => {
    const f = filters;
    return results
      .filter(r => {
        if (r.error) return true;
        if (f.pe_max  && r.pe_ratio      > +f.pe_max)                   return false;
        if (f.pb_max  && r.pb_ratio      > +f.pb_max)                   return false;
        if (f.div_min && (r.dividend_yield || 0) * 100 < +f.div_min)    return false;
        if (f.roe_min && (r.roe || 0) * 100             < +f.roe_min)   return false;
        if (f.de_max  && r.debt_equity   > +f.de_max)                   return false;
        if (f.pm_min  && (r.profit_margin || 0) * 100   < +f.pm_min)    return false;
        return true;
      })
      .sort((a, b) => {
        let av = a[sortBy] ?? (sortDir === "asc" ? Infinity : -Infinity);
        let bv = b[sortBy] ?? (sortDir === "asc" ? Infinity : -Infinity);
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [results, filters, sortBy, sortDir]);

  const topCount = rows.filter(r => !r.error && r.value_score >= 60).length;

  const SortIco = ({ col }) =>
    <span style={{ marginLeft:"3px", color: sortBy === col ? "#63b3ed" : "#2a2a3a" }}>
      {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>;

  return (
    <div style={{ minHeight:"100vh", background:"#0b0b12", color:"#e0e0e0", fontFamily:"'Noto Sans SC','PingFang SC','Apple SD Gothic Neo',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.01)", padding:"0 20px", position:"sticky", top:0, zIndex:10, backdropFilter:"blur(8px)" }}>
        <div style={{ maxWidth:"1120px", margin:"0 auto", padding:"14px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"36px", height:"36px", background:"linear-gradient(135deg,#34d399,#059669)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", fontWeight:800, color:"#fff" }}>$</div>
            <div>
              <div style={{ fontSize:"16px", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>投资助手</div>
              <div style={{ fontSize:"10px", color:"#444", letterSpacing:"0.04em" }}>美股价值筛选 · Yahoo Finance</div>
            </div>
          </div>
          {results.length > 0 && (
            <div style={{ display:"flex", gap:"18px", fontSize:"12px" }}>
              <span style={{ color:"#555" }}>筛选结果 <span style={{ color:"#fff", fontWeight:700 }}>{rows.length}</span> 只</span>
              <span style={{ color:"#34d399" }}>评分≥60 <span style={{ fontWeight:700 }}>{topCount}</span> 只</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:"1120px", margin:"0 auto", padding:"20px" }}>

        {/* ── Group Presets ── */}
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:"#444", marginBottom:"7px", letterSpacing:"0.06em" }}>选择板块快速导入</div>
          <div style={{ display:"flex", gap:"7px", flexWrap:"wrap" }}>
            {Object.keys(GROUPS).map(name => (
              <button key={name} onClick={() => pickGroup(name)} style={{
                padding:"5px 14px", borderRadius:"8px", fontSize:"12px", fontWeight:600,
                cursor:"pointer", border:"1px solid", transition:"all 0.15s",
                borderColor: activeGroup === name ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.09)",
                background:   activeGroup === name ? "rgba(52,211,153,0.12)"  : "rgba(255,255,255,0.03)",
                color:        activeGroup === name ? "#34d399"                 : "#777",
              }}>{name}</button>
            ))}
          </div>
        </div>

        {/* ── Input Row ── */}
        <div style={{ display:"flex", gap:"10px", marginBottom:"14px" }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setActiveGroup(null); }}
            onKeyDown={e => e.key === "Enter" && fetch_(input)}
            placeholder="输入股票代码，逗号分隔：AAPL,MSFT,TSLA..."
            style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"10px 14px", color:"#e0e0e0", fontSize:"13px", outline:"none" }}
          />
          <button onClick={() => fetch_(input)} disabled={loading} style={{
            padding:"10px 22px", borderRadius:"10px", border:"1px solid rgba(52,211,153,0.3)",
            background:"rgba(52,211,153,0.12)", color:"#34d399", fontSize:"13px", fontWeight:700,
            cursor: loading ? "wait" : "pointer", whiteSpace:"nowrap", opacity: loading ? 0.7 : 1,
          }}>{loading ? "获取中…" : "开始筛选"}</button>
          <button onClick={() => setShowFilters(v => !v)} style={{
            padding:"10px 14px", borderRadius:"10px", fontSize:"12px", fontWeight:600,
            border:"1px solid", cursor:"pointer",
            borderColor: showFilters ? "rgba(99,179,237,0.4)"   : "rgba(255,255,255,0.08)",
            background:   showFilters ? "rgba(99,179,237,0.1)"   : "rgba(255,255,255,0.02)",
            color:        showFilters ? "#63b3ed"                 : "#555",
          }}>筛选条件 {showFilters ? "▲" : "▼"}</button>
        </div>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"16px", marginBottom:"14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <span style={{ fontSize:"11px", color:"#666", fontWeight:600 }}>自定义筛选（留空不限）</span>
              <button onClick={() => setFilters(FILTER_DEFAULTS)} style={{ background:"none", border:"1px solid rgba(255,255,255,0.09)", color:"#555", borderRadius:"6px", padding:"3px 10px", fontSize:"11px", cursor:"pointer" }}>重置</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"10px" }}>
              {[
                { key:"pe_max",  label:"P/E 最大值",  ph:"如: 20" },
                { key:"pb_max",  label:"P/B 最大值",  ph:"如: 3"  },
                { key:"div_min", label:"股息率 最低%", ph:"如: 2"  },
                { key:"roe_min", label:"ROE 最低%",    ph:"如: 15" },
                { key:"de_max",  label:"负债率 最大值",ph:"如: 1"  },
                { key:"pm_min",  label:"净利率 最低%", ph:"如: 10" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:"10px", color:"#555", marginBottom:"4px" }}>{f.label}</label>
                  <input type="number" value={filters[f.key]} placeholder={f.ph}
                    onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"7px", padding:"7px 10px", color:"#e0e0e0", fontSize:"12px", outline:"none", boxSizing:"border-box" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:"12px", padding:"16px 20px", marginBottom:"14px", color:"#f87171", fontSize:"13px", lineHeight:1.8 }}>
            <div style={{ fontWeight:700, marginBottom:"4px" }}>无法获取数据</div>
            <div style={{ fontSize:"11px", color:"#c87171" }}>
              请先启动后端服务：<br/>
              <code style={{ background:"rgba(255,255,255,0.06)", padding:"2px 8px", borderRadius:"4px", fontFamily:"monospace" }}>
                cd backend &amp;&amp; pip install -r requirements.txt &amp;&amp; python main.py
              </code>
            </div>
            <div style={{ fontSize:"10px", color:"#744", marginTop:"6px" }}>错误详情：{error}</div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign:"center", padding:"50px", color:"#444" }}>
            <div style={{ width:"32px", height:"32px", border:"2px solid rgba(52,211,153,0.2)", borderTop:"2px solid #34d399", borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }} />
            <div style={{ fontSize:"14px" }}>正在获取股票数据…</div>
            <div style={{ fontSize:"11px", marginTop:"6px", color:"#333" }}>每只股票约 1-2 秒</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Results Table ── */}
        {!loading && rows.length > 0 && (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:"900px" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                    {COLS.map(c => (
                      <th key={c.key}
                        onClick={() => !c.nosort && handleSort(c.key)}
                        style={{
                          padding:"11px 14px", fontSize:"10px", fontWeight:700, letterSpacing:"0.06em",
                          color: sortBy === c.key ? "#63b3ed" : "#444",
                          textAlign: c.key === "value_score" || c.key === "symbol" ? "left" : "right",
                          cursor: c.nosort ? "default" : "pointer", userSelect:"none",
                          whiteSpace:"nowrap", width: c.w,
                        }}>
                        {c.label}{!c.nosort && <SortIco col={c.key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.symbol}
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.035)", background: i % 2 ? "rgba(255,255,255,0.01)" : "transparent", transition:"background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 ? "rgba(255,255,255,0.01)" : "transparent"}
                    >
                      {r.error ? (
                        <td colSpan={COLS.length} style={{ padding:"10px 14px", color:"#555", fontSize:"12px" }}>
                          {r.symbol} — 获取失败
                        </td>
                      ) : <>
                        <td style={{ padding:"11px 14px" }}><ScoreBadge score={r.value_score} /></td>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ fontWeight:700, color:"#fbbf24", fontSize:"13px" }}>{r.symbol}</div>
                          <div style={{ fontSize:"10px", color:"#444", marginTop:"2px", maxWidth:"140px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                        </td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}>
                          <span style={{ color:"#fff", fontWeight:600 }}>{r.price ? `$${r.price.toFixed(2)}` : "—"}</span>
                        </td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}>
                          {r.change_pct != null
                            ? <span style={{ color: r.change_pct >= 0 ? "#34d399" : "#f87171", fontWeight:600, fontSize:"12px" }}>{r.change_pct >= 0 ? "+" : ""}{r.change_pct.toFixed(2)}%</span>
                            : <span style={{ color:"#2a2a3a" }}>—</span>}
                        </td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}><Cell value={r.pe_ratio}                          lowerBetter good={15}  bad={25}  /></td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}><Cell value={r.pb_ratio}         digits={2}       lowerBetter good={1.5} bad={3}   /></td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}><Cell value={r.dividend_yield != null ? r.dividend_yield * 100 : null} suffix="%" digits={2} good={3} bad={0.5} /></td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}><Cell value={r.roe            != null ? r.roe            * 100 : null} suffix="%" good={15}  bad={5}  /></td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}><Cell value={r.profit_margin  != null ? r.profit_margin  * 100 : null} suffix="%" good={15}  bad={5}  /></td>
                        <td style={{ padding:"11px 14px", textAlign:"right" }}><Cell value={r.debt_equity}    digits={2}       lowerBetter good={0.5} bad={1.5} /></td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div style={{ padding:"10px 16px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:"14px", flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:"10px", color:"#444" }}>评分说明：</span>
              {[["#34d399","70+ 优选"],["#63b3ed","50-69 关注"],["#fbbf24","30-49 一般"],["#f87171","<30 谨慎"]].map(([c,l]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"10px", color:"#555" }}>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:c, flexShrink:0 }} />{l}
                </div>
              ))}
              <span style={{ fontSize:"10px", color:"#333", marginLeft:"auto" }}>绿色=好 红色=需注意 — 评分综合 P/E、P/B、股息率、ROE、负债率、净利率</span>
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && results.length === 0 && !error && (
          <div style={{ textAlign:"center", padding:"70px 20px", color:"#333" }}>
            <div style={{ fontSize:"52px", marginBottom:"16px", filter:"grayscale(0.3)" }}>📊</div>
            <div style={{ fontSize:"15px", color:"#555", marginBottom:"8px" }}>选择板块或输入股票代码开始筛选</div>
            <div style={{ fontSize:"12px", color:"#333", lineHeight:1.7 }}>
              系统将从 Yahoo Finance 获取数据，自动计算价值评分<br/>帮你快速找出值得关注的投资标的
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
