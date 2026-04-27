import { useState, useMemo } from "react";

const STATUS_CONFIG = {
  new:      { label: "신규 / 新客户",   labelShort: "新客户", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)" },
  following:{ label: "팔로업 / 跟进中", labelShort: "跟进中", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)" },
  quoted:   { label: "견적완료 / 已报价",labelShort: "已报价", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  closed:   { label: "성사 / 已成交",   labelShort: "已成交", color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.25)" },
  lost:     { label: "실패 / 已流失",   labelShort: "已流失", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
};

const STONE_TYPES = ["大理石 / 대리석", "花岗岩 / 화강암", "石英石 / 쿼츠", "板岩 / 슬레이트", "石灰石 / 석회암", "砂岩 / 사암"];

const INITIAL_CUSTOMERS = [
  { id: 1, name: "김민준", company: "서울스톤", phone: "010-1234-5678", email: "kim@seoulstone.kr", status: "following", note: "大理石 100㎡ 报价中，预算充足", lastContact: "2026-04-25", kakao: "minj_kim" },
  { id: 2, name: "이서연", company: "부산건설", phone: "010-9876-5432", email: "lee@busancon.kr", status: "quoted", note: "花岗岩地板，等待决策", lastContact: "2026-04-22", kakao: "seoyeon_lee" },
  { id: 3, name: "박도현", company: "강남인테리어", phone: "010-5555-7777", email: "park@gni.kr", status: "new", note: "朋友介绍，需要跟进", lastContact: "2026-04-27", kakao: "" },
  { id: 4, name: "최지우", company: "현대리모델링", company2: "현대리모델링", phone: "010-3333-8888", email: "choi@hdremodel.kr", status: "closed", note: "已成交，石英石厨房台面 50㎡", lastContact: "2026-04-20", kakao: "jiwoo_c" },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: "Carrara White 大理石", origin: "이탈리아", thickness: "20mm", price: 85000, unit: "㎡" },
  { id: 2, name: "Black Galaxy 화강암", origin: "인도", thickness: "30mm", price: 65000, unit: "㎡" },
  { id: 3, name: "Calacatta Gold 대리석", origin: "이탈리아", thickness: "20mm", price: 120000, unit: "㎡" },
  { id: 4, name: "Absolute Black 화강암", origin: "남아프리카", thickness: "30mm", price: 55000, unit: "㎡" },
];

function StatusBadge({ status, small }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{
      fontSize: small ? "10px" : "11px",
      fontWeight: 700,
      padding: small ? "2px 7px" : "3px 10px",
      borderRadius: "5px",
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>{c.labelShort}</span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#13131a",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"16px",width:"100%",maxWidth:"520px",maxHeight:"90vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ margin:0,fontSize:"16px",fontWeight:700,color:"#fff" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#666",fontSize:"20px",cursor:"pointer",lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:"20px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      {label && <label style={{ display:"block",fontSize:"11px",color:"#888",marginBottom:"5px",letterSpacing:"0.05em" }}>{label}</label>}
      <input {...props} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 12px",color:"#e0e0e0",fontSize:"13px",outline:"none",boxSizing:"border-box",...props.style }} />
    </div>
  );
}

function Btn({ children, variant="primary", small, ...props }) {
  const styles = {
    primary:  { background:"rgba(99,179,237,0.15)",border:"1px solid rgba(99,179,237,0.35)",color:"#63b3ed" },
    success:  { background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399" },
    danger:   { background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171" },
    ghost:    { background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa" },
    gold:     { background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24" },
  };
  return (
    <button {...props} style={{ ...styles[variant],borderRadius:"8px",padding:small?"5px 12px":"8px 16px",fontSize:small?"11px":"13px",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",...props.style }}>
      {children}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("customers");
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "add" | "edit" | "quote" | "broadcast" | "detail"
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [form, setForm] = useState({});
  const [quoteItems, setQuoteItems] = useState([{ productId: "", qty: "", note: "" }]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTargets, setBroadcastTargets] = useState([]);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchStatus = filter === "all" || c.status === filter;
      const matchSearch = !search || c.name.includes(search) || c.company.includes(search) || c.phone.includes(search);
      return matchStatus && matchSearch;
    });
  }, [customers, filter, search]);

  const stats = useMemo(() => {
    const total = customers.length;
    const byStatus = Object.fromEntries(Object.keys(STATUS_CONFIG).map(k => [k, customers.filter(c => c.status === k).length]));
    return { total, ...byStatus };
  }, [customers]);

  function openAdd() {
    setForm({ name:"",company:"",phone:"",email:"",kakao:"",status:"new",note:"" });
    setModal("add");
  }

  function openEdit(c) {
    setSelected(c);
    setForm({ ...c });
    setModal("edit");
  }

  function openDetail(c) {
    setSelected(c);
    setModal("detail");
  }

  function saveCustomer() {
    if (!form.name || !form.company) return;
    if (modal === "add") {
      setCustomers(prev => [...prev, { ...form, id: Date.now(), lastContact: new Date().toISOString().slice(0,10) }]);
    } else {
      setCustomers(prev => prev.map(c => c.id === selected.id ? { ...c, ...form } : c));
    }
    setModal(null);
  }

  function deleteCustomer(id) {
    if (window.confirm("确认删除？")) setCustomers(prev => prev.filter(c => c.id !== id));
    setModal(null);
  }

  function updateStatus(id, status) {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status, lastContact: new Date().toISOString().slice(0,10) } : c));
  }

  function openQuote(c) {
    setSelected(c);
    setQuoteItems([{ productId: products[0]?.id || "", qty: "", note: "" }]);
    setModal("quote");
  }

  function generateQuoteText() {
    const lines = quoteItems.filter(i => i.productId && i.qty).map(i => {
      const p = products.find(p => p.id == i.productId);
      if (!p) return "";
      const total = (p.price * parseFloat(i.qty)).toLocaleString();
      return `  • ${p.name} (${p.thickness}) × ${i.qty}${p.unit} = ₩${total}`;
    });
    const subtotal = quoteItems.reduce((sum, i) => {
      const p = products.find(p => p.id == i.productId);
      return sum + (p ? p.price * (parseFloat(i.qty) || 0) : 0);
    }, 0);
    return `[석재 견적서 / 石材报价单]
고객 / 客户: ${selected?.company} ${selected?.name}
날짜 / 日期: ${new Date().toLocaleDateString("ko-KR")}

${lines.join("\n")}

합계 / 合计: ₩${subtotal.toLocaleString()}
(VAT 별도 / 不含税)

문의: 감사합니다 🙏`;
  }

  function openBroadcast() {
    setBroadcastTargets(customers.filter(c => c.status !== "lost").map(c => c.id));
    setBroadcastMsg(`[석재 가격표 업데이트 / 石材价格更新]
안녕하세요! / 您好！

${products.map(p => `• ${p.name} (${p.origin}, ${p.thickness})\n  ₩${p.price.toLocaleString()}/${p.unit}`).join("\n")}

관심 있으시면 연락 주세요 😊
感兴趣请联系我！`);
    setModal("broadcast");
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tabs = [
    { id:"customers", label:"👥 客户" },
    { id:"products",  label:"🪨 产品" },
    { id:"broadcast", label:"📨 群发" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d14", color:"#e0e0e0", fontFamily:"'Pretendard','Noto Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 20px", background:"rgba(255,255,255,0.01)", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"32px", height:"32px", background:"linear-gradient(135deg,#63b3ed,#4299e1)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🪨</div>
            <div>
              <div style={{ fontSize:"15px", fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>StoneCRM</div>
              <div style={{ fontSize:"10px", color:"#555", letterSpacing:"0.05em" }}>석재 영업 관리 시스템</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {Object.entries(STATUS_CONFIG).map(([k,v]) => (
              <span key={k} style={{ fontSize:"10px", color:v.color, background:v.bg, border:`1px solid ${v.border}`, borderRadius:"4px", padding:"2px 7px", fontWeight:700 }}>
                {stats[k] || 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"20px" }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:"4px", marginBottom:"20px", background:"rgba(255,255,255,0.03)", padding:"4px", borderRadius:"10px", width:"fit-content" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"7px 18px", borderRadius:"7px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:600, background:tab===t.id?"rgba(99,179,237,0.15)":"transparent", color:tab===t.id?"#63b3ed":"#666", transition:"all 0.2s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* CUSTOMERS TAB */}
        {tab === "customers" && (
          <div>
            {/* Toolbar */}
            <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索客户名/公司..." style={{ flex:1, minWidth:"160px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"8px 12px", color:"#e0e0e0", fontSize:"13px", outline:"none" }} />
              <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                {[["all","全部"], ...Object.entries(STATUS_CONFIG).map(([k,v])=>[k,v.labelShort])].map(([k,l]) => (
                  <button key={k} onClick={()=>setFilter(k)} style={{ padding:"7px 12px", borderRadius:"7px", border:"1px solid", fontSize:"11px", fontWeight:600, cursor:"pointer", transition:"all 0.2s", borderColor: filter===k?"rgba(99,179,237,0.4)":"rgba(255,255,255,0.08)", background: filter===k?"rgba(99,179,237,0.12)":"transparent", color: filter===k?"#63b3ed":"#666" }}>
                    {l}
                  </button>
                ))}
              </div>
              <Btn variant="gold" onClick={openAdd}>+ 新增客户</Btn>
            </div>

            {/* Customer List */}
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {filtered.length === 0 && <div style={{ textAlign:"center", color:"#444", padding:"40px", fontSize:"13px" }}>没有符合条件的客户</div>}
              {filtered.map(c => (
                <div key={c.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"16px", display:"flex", gap:"14px", alignItems:"flex-start", cursor:"pointer", transition:"border-color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(99,179,237,0.25)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}
                  onClick={()=>openDetail(c)}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"rgba(99,179,237,0.12)", border:"1px solid rgba(99,179,237,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, color:"#fff", fontSize:"14px" }}>{c.name}</span>
                      <span style={{ fontSize:"12px", color:"#888" }}>{c.company}</span>
                      <StatusBadge status={c.status} small />
                    </div>
                    <div style={{ fontSize:"12px", color:"#666", marginBottom:"4px" }}>
                      📞 {c.phone} {c.kakao && <span style={{ marginLeft:"8px" }}>💬 {c.kakao}</span>}
                    </div>
                    {c.note && <div style={{ fontSize:"11px", color:"#555", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📝 {c.note}</div>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px", alignItems:"flex-end", flexShrink:0 }}>
                    <span style={{ fontSize:"10px", color:"#444" }}>{c.lastContact}</span>
                    <div style={{ display:"flex", gap:"6px" }} onClick={e=>e.stopPropagation()}>
                      <Btn small variant="ghost" onClick={()=>openEdit(c)}>편집</Btn>
                      <Btn small variant="primary" onClick={()=>openQuote(c)}>견적</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <h2 style={{ margin:0, fontSize:"16px", fontWeight:700, color:"#fff" }}>🪨 产品价格表 / 제품 가격표</h2>
              <Btn variant="gold" onClick={()=>{ setForm({ name:"", origin:"", thickness:"20mm", price:"", unit:"㎡" }); setModal("addProduct"); }}>+ 新增产品</Btn>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:"12px" }}>
              {products.map(p => (
                <div key={p.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"18px" }}>
                  <div style={{ fontSize:"14px", fontWeight:700, color:"#fff", marginBottom:"6px" }}>{p.name}</div>
                  <div style={{ fontSize:"12px", color:"#888", marginBottom:"12px" }}>원산지: {p.origin} · {p.thickness}</div>
                  <div style={{ fontSize:"22px", fontWeight:800, color:"#63b3ed", letterSpacing:"-0.02em" }}>
                    ₩{p.price.toLocaleString()}
                    <span style={{ fontSize:"12px", color:"#555", fontWeight:400 }}>/{p.unit}</span>
                  </div>
                  <div style={{ display:"flex", gap:"6px", marginTop:"12px" }}>
                    <Btn small variant="ghost" onClick={()=>{ setSelected(p); setForm({...p}); setModal("editProduct"); }}>편집</Btn>
                    <Btn small variant="danger" onClick={()=>{ if(window.confirm("删除？")) setProducts(prev=>prev.filter(x=>x.id!==p.id)); }}>삭제</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BROADCAST TAB */}
        {tab === "broadcast" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <h2 style={{ margin:0, fontSize:"16px", fontWeight:700, color:"#fff" }}>📨 群发消息 / 단체 메시지</h2>
              <Btn variant="gold" onClick={openBroadcast}>🔄 重新生成价格表</Btn>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
              {/* Target selector */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"16px" }}>
                <div style={{ fontSize:"12px", color:"#888", marginBottom:"10px", fontWeight:600 }}>发送对象 ({broadcastTargets.length}人)</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"6px", maxHeight:"300px", overflowY:"auto" }}>
                  {customers.map(c => (
                    <label key={c.id} style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", padding:"6px 8px", borderRadius:"6px", background: broadcastTargets.includes(c.id)?"rgba(99,179,237,0.06)":"transparent" }}>
                      <input type="checkbox" checked={broadcastTargets.includes(c.id)} onChange={e=>{
                        setBroadcastTargets(prev => e.target.checked ? [...prev,c.id] : prev.filter(x=>x!==c.id));
                      }} style={{ accentColor:"#63b3ed" }} />
                      <span style={{ fontSize:"12px", color:"#ccc" }}>{c.name}</span>
                      <span style={{ fontSize:"11px", color:"#666" }}>{c.company}</span>
                      <StatusBadge status={c.status} small />
                    </label>
                  ))}
                </div>
              </div>
              {/* Message editor */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"16px" }}>
                <div style={{ fontSize:"12px", color:"#888", marginBottom:"10px", fontWeight:600 }}>消息内容</div>
                <textarea value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} style={{ width:"100%", height:"220px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"10px", color:"#e0e0e0", fontSize:"12px", resize:"none", outline:"none", boxSizing:"border-box", lineHeight:1.6 }} />
                <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                  <Btn variant="success" style={{ flex:1 }} onClick={()=>copyText(broadcastMsg)}>
                    {copied ? "✅ 已复制！" : "📋 复制消息"}
                  </Btn>
                </div>
                <div style={{ fontSize:"10px", color:"#444", marginTop:"8px", lineHeight:1.5 }}>
                  💡 复制后粘贴到 KakaoTalk 或邮件中逐一发送
                </div>
              </div>
            </div>
            {/* Quick copy per customer */}
            <div style={{ marginTop:"16px" }}>
              <div style={{ fontSize:"12px", color:"#888", marginBottom:"10px", fontWeight:600 }}>快速单独发送（含客户姓名）</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {customers.filter(c=>broadcastTargets.includes(c.id)).map(c=>(
                  <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", padding:"10px 14px" }}>
                    <span style={{ fontSize:"13px", color:"#ccc" }}>{c.name} · {c.company}</span>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <Btn small variant="ghost" onClick={()=>copyText(`${c.name} 님, 안녕하세요!\n\n`+broadcastMsg)}>
                        💬 KakaoTalk
                      </Btn>
                      <Btn small variant="ghost" onClick={()=>copyText(`Dear ${c.name},\n\n`+broadcastMsg)}>
                        ✉️ Email
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add/Edit Customer */}
      {(modal==="add"||modal==="edit") && (
        <Modal title={modal==="add"?"新增客户 / 고객 추가":"编辑客户 / 고객 수정"} onClose={()=>setModal(null)}>
          <Input label="姓名 / 이름 *" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="김민준" />
          <Input label="公司 / 회사명 *" value={form.company||""} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="서울스톤" />
          <Input label="电话 / 전화번호" value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="010-0000-0000" />
          <Input label="邮箱 / 이메일" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@company.kr" />
          <Input label="KakaoTalk ID" value={form.kakao||""} onChange={e=>setForm(f=>({...f,kakao:e.target.value}))} placeholder="kakao_id" />
          <div style={{ marginBottom:"14px" }}>
            <label style={{ display:"block",fontSize:"11px",color:"#888",marginBottom:"5px" }}>跟进状态</label>
            <select value={form.status||"new"} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{ width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 12px",color:"#e0e0e0",fontSize:"13px",outline:"none" }}>
              {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k} style={{ background:"#1a1a2e" }}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:"14px" }}>
            <label style={{ display:"block",fontSize:"11px",color:"#888",marginBottom:"5px" }}>备注 / 메모</label>
            <textarea value={form.note||""} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="客户需求、预算等..." style={{ width:"100%",height:"80px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 12px",color:"#e0e0e0",fontSize:"13px",outline:"none",resize:"none",boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex",gap:"8px",justifyContent:"flex-end" }}>
            {modal==="edit" && <Btn variant="danger" onClick={()=>deleteCustomer(selected.id)}>删除</Btn>}
            <Btn variant="ghost" onClick={()=>setModal(null)}>取消</Btn>
            <Btn variant="success" onClick={saveCustomer}>保存 저장</Btn>
          </div>
        </Modal>
      )}

      {/* MODAL: Customer Detail */}
      {modal==="detail" && selected && (
        <Modal title={`${selected.name} · ${selected.company}`} onClose={()=>setModal(null)}>
          <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
            <StatusBadge status={selected.status} />
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
              {[["📞 전화",selected.phone],["✉️ 이메일",selected.email],["💬 Kakao",selected.kakao||"-"],["📅 최근연락",selected.lastContact]].map(([l,v])=>(
                <div key={l} style={{ background:"rgba(255,255,255,0.03)",borderRadius:"8px",padding:"10px" }}>
                  <div style={{ fontSize:"10px",color:"#666",marginBottom:"4px" }}>{l}</div>
                  <div style={{ fontSize:"13px",color:"#ccc" }}>{v}</div>
                </div>
              ))}
            </div>
            {selected.note && <div style={{ background:"rgba(255,255,255,0.03)",borderRadius:"8px",padding:"12px",fontSize:"13px",color:"#aaa",lineHeight:1.6 }}>📝 {selected.note}</div>}
            <div>
              <div style={{ fontSize:"11px",color:"#666",marginBottom:"8px" }}>빠른 상태 변경 / 快速更新状态</div>
              <div style={{ display:"flex",gap:"6px",flexWrap:"wrap" }}>
                {Object.entries(STATUS_CONFIG).map(([k,v])=>(
                  <button key={k} onClick={()=>{updateStatus(selected.id,k);setModal(null);}} style={{ padding:"5px 12px",borderRadius:"6px",border:`1px solid ${v.border}`,background:selected.status===k?v.bg:"transparent",color:v.color,fontSize:"11px",fontWeight:600,cursor:"pointer" }}>
                    {v.labelShort}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex",gap:"8px",marginTop:"4px" }}>
              <Btn variant="ghost" onClick={()=>openEdit(selected)} style={{flex:1}}>편집 / 编辑</Btn>
              <Btn variant="primary" onClick={()=>openQuote(selected)} style={{flex:1}}>견적서 / 报价</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Quote */}
      {modal==="quote" && selected && (
        <Modal title={`견적서 / 报价单 — ${selected.name}`} onClose={()=>setModal(null)}>
          <div style={{ display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px" }}>
            {quoteItems.map((item,i)=>(
              <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 80px 28px",gap:"8px",alignItems:"center" }}>
                <select value={item.productId} onChange={e=>{const n=[...quoteItems];n[i].productId=e.target.value;setQuoteItems(n);}} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"8px",color:"#e0e0e0",fontSize:"12px",outline:"none" }}>
                  <option value="" style={{background:"#1a1a2e"}}>선택...</option>
                  {products.map(p=><option key={p.id} value={p.id} style={{background:"#1a1a2e"}}>{p.name}</option>)}
                </select>
                <input value={item.qty} onChange={e=>{const n=[...quoteItems];n[i].qty=e.target.value;setQuoteItems(n);}} placeholder="수량" style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"8px",color:"#e0e0e0",fontSize:"12px",outline:"none",textAlign:"right" }} />
                <button onClick={()=>setQuoteItems(prev=>prev.filter((_,j)=>j!==i))} style={{ background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",borderRadius:"6px",cursor:"pointer",fontSize:"14px",width:"28px",height:"28px" }}>×</button>
              </div>
            ))}
            <Btn variant="ghost" small onClick={()=>setQuoteItems(prev=>[...prev,{productId:products[0]?.id||"",qty:"",note:""}])}>+ 항목 추가</Btn>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)",borderRadius:"10px",padding:"14px",marginBottom:"14px",fontFamily:"monospace",fontSize:"12px",color:"#aaa",whiteSpace:"pre-wrap",lineHeight:1.7 }}>
            {generateQuoteText()}
          </div>
          <div style={{ display:"flex",gap:"8px" }}>
            <Btn variant="success" style={{flex:1}} onClick={()=>{copyText(generateQuoteText());updateStatus(selected.id,"quoted");}}>
              {copied?"✅ 已复制！":"📋 복사하기 / 复制报价"}
            </Btn>
            <Btn variant="ghost" onClick={()=>setModal(null)}>닫기</Btn>
          </div>
          <div style={{ fontSize:"10px",color:"#444",marginTop:"8px" }}>복사 후 KakaoTalk이나 이메일에 붙여넣기 하세요</div>
        </Modal>
      )}

      {/* MODAL: Add/Edit Product */}
      {(modal==="addProduct"||modal==="editProduct") && (
        <Modal title={modal==="addProduct"?"新增产品":"编辑产品"} onClose={()=>setModal(null)}>
          <Input label="产品名称 / 제품명" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Carrara White 대리석" />
          <Input label="产地 / 원산지" value={form.origin||""} onChange={e=>setForm(f=>({...f,origin:e.target.value}))} placeholder="이탈리아" />
          <Input label="厚度 / 두께" value={form.thickness||""} onChange={e=>setForm(f=>({...f,thickness:e.target.value}))} placeholder="20mm" />
          <Input label="单价 (₩) / 단가" type="number" value={form.price||""} onChange={e=>setForm(f=>({...f,price:parseInt(e.target.value)||0}))} placeholder="85000" />
          <div style={{ display:"flex",gap:"8px",justifyContent:"flex-end" }}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>取消</Btn>
            <Btn variant="success" onClick={()=>{
              if(modal==="addProduct") setProducts(prev=>[...prev,{...form,id:Date.now()}]);
              else setProducts(prev=>prev.map(p=>p.id===selected.id?{...p,...form}:p));
              setModal(null);
            }}>保存</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
