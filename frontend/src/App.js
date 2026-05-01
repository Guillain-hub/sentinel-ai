import React, { useState, useEffect, useRef } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const WS_URL = "wss://joyful-adventure-production-fcac.up.railway.app/ws";
const WS_BEHAVIORAL = "wss://joyful-adventure-production-fcac.up.railway.app/ws/behavioral";
const THREAT_WS_URL = "wss://joyful-adventure-production-fcac.up.railway.app/ws/threats";

const riskColor = (level) => ({ HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" }[level] || "#6b7280");

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ total: 0, fraud_detected: 0, legitimate: 0, total_amount_protected: 0 });
  const [chartData, setChartData] = useState([]);
  const [connected, setConnected] = useState(false);
  const [securityScore, setSecurityScore] = useState(100);
  const [alerts, setAlerts] = useState([]);
  const [threats, setThreats] = useState([]);
  const [threatStats, setThreatStats] = useState({ total_threats: 0, critical: 0, high: 0, medium: 0, low: 0, blocked: 0 });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [behavioralStats, setBehavioralStats] = useState({ total: 0, flagged: 0, safe: 0 });
  const [apiEvents, setApiEvents] = useState([]);
  const [apiStats, setApiStats] = useState({ total: 0, blocked: 0, safe: 0, attacks: 0 });
  const wsRef = useRef(null);
  const wsBehavioralRef = useRef(null);
  const wsApiRef = useRef(null);
  const threatWsRef = useRef(null);

  useEffect(() => {
    connect();
    connectBehavioral();
    connectApiProtection();
    connectThreats();
    return () => { wsRef.current?.close(); wsBehavioralRef.current?.close(); wsApiRef.current?.close(); threatWsRef.current?.close(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function connect() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
    ws.onmessage = (e) => {
      const tx = JSON.parse(e.data);
      setTransactions(prev => [tx, ...prev].slice(0, 100));
      if (tx.is_fraud) setAlerts(prev => [{ ...tx, id: Date.now() }, ...prev].slice(0, 5));
      setStats(prev => {
        const n = {
          total: prev.total + 1,
          fraud_detected: prev.fraud_detected + (tx.is_fraud ? 1 : 0),
          legitimate: prev.legitimate + (!tx.is_fraud ? 1 : 0),
          total_amount_protected: prev.total_amount_protected + (tx.is_fraud ? tx.amount : 0)
        };
        setSecurityScore(Math.max(60, Math.round((1 - (n.fraud_detected / n.total) * 3) * 100)));
        return n;
      });
      setChartData(prev => [...prev, { time: tx.timestamp, risk: Math.round(tx.fraud_probability * 100) }].slice(-20));
    };
  }

  function connectBehavioral() {
    const ws = new WebSocket(WS_BEHAVIORAL);
    wsBehavioralRef.current = ws;
    ws.onclose = () => setTimeout(connectBehavioral, 3000);
    ws.onmessage = (e) => {
      const session = JSON.parse(e.data);
      setSessions(prev => [session, ...prev].slice(0, 50));
      setBehavioralStats(prev => ({
        total: prev.total + 1,
        flagged: prev.flagged + (session.is_flagged ? 1 : 0),
        safe: prev.safe + (!session.is_flagged ? 1 : 0),
      }));
    };
  }

  function connectApiProtection() {
    const ws = new WebSocket("wss://joyful-adventure-production-fcac.up.railway.app/ws/api-protection");
    wsApiRef.current = ws;
    ws.onclose = () => setTimeout(connectApiProtection, 3000);
    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      setApiEvents(prev => [event, ...prev].slice(0, 50));
      setApiStats(prev => ({
        total: prev.total + 1,
        blocked: prev.blocked + (event.is_blocked ? 1 : 0),
        safe: prev.safe + (!event.is_blocked ? 1 : 0),
        attacks: prev.attacks + (event.attack_type ? 1 : 0),
      }));
    };
  }

  function connectThreats() {
    const ws = new WebSocket(THREAT_WS_URL);
    threatWsRef.current = ws;
    ws.onopen = () => console.log("Threat feed connected");
    ws.onclose = () => setTimeout(connectThreats, 3000);
    ws.onmessage = (e) => {
      const threat = JSON.parse(e.data);
      setThreats(prev => [threat, ...prev].slice(0, 50));
      setThreatStats(prev => ({
        total_threats: prev.total_threats + 1,
        critical: prev.critical + (threat.severity === "CRITICAL" ? 1 : 0),
        high: prev.high + (threat.severity === "HIGH" ? 1 : 0),
        medium: prev.medium + (threat.severity === "MEDIUM" ? 1 : 0),
        low: prev.low + (threat.severity === "LOW" ? 1 : 0),
        blocked: prev.blocked + (threat.status === "BLOCKED" ? 1 : 0),
      }));
    };
  }

  const fraudRate = stats.total > 0 ? ((stats.fraud_detected / stats.total) * 100).toFixed(1) : "0.0";
  const pieData = [{ name: "Legitimate", value: stats.legitimate }, { name: "Fraud", value: stats.fraud_detected }];
  const scoreColor = securityScore > 80 ? "#22c55e" : securityScore > 60 ? "#f59e0b" : "#ef4444";

  const card = (style) => ({ background: "#0f172a", border: "1px solid #1e2a4a", borderRadius: 12, padding: 20, ...style });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060818", color: "white", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "#0a0f1e", borderRight: "1px solid #1e2a4a", display: "flex", flexDirection: "column", padding: "0 0 24px 0", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #1e2a4a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>S</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>SENTINEL AI</div>
              <div style={{ fontSize: 10, color: "#4b6cb7" }}>Security Platform</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 12px", flex: 1 }}>
          {[
            { id: "dashboard", icon: "⬡", label: "Dashboard" },
            { id: "transactions", icon: "⇄", label: "Transactions" },
            { id: "threats", icon: "◈", label: "Threat Detection" },
            { id: "api", icon: "⬢", label: "API Protection" },
            { id: "behavioral", icon: "◉", label: "Behavioral AI" },
            { id: "reports", icon: "▤", label: "Reports" },
            { id: "settings", icon: "⚙", label: "Settings" },
          ].map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer",
              background: activeTab === item.id ? "linear-gradient(135deg, #1e3a8a22, #7c3aed22)" : "transparent",
              borderLeft: activeTab === item.id ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === item.id ? "#60a5fa" : "#64748b", transition: "all 0.2s"
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: activeTab === item.id ? 600 : 400 }}>{item.label}</span>
              {item.id === "threats" && alerts.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{alerts.length}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e2a4a" }}>
          <div style={{ fontSize: 10, color: "#4b6cb7", letterSpacing: 1, marginBottom: 12, fontWeight: 600 }}>MODULE STATUS</div>
          {[
            { name: "Fraud Detection", active: true },
            { name: "Behavioral AI", active: true },
            { name: "API Protection", active: true },
            { name: "Threat Intel", active: true },
          ].map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.active ? "#22c55e" : "#374151", boxShadow: m.active ? "0 0 6px #22c55e" : "none" }} />
              <span style={{ fontSize: 11, color: m.active ? "#d1fae5" : "#4b5563" }}>{m.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 9, color: m.active ? "#22c55e" : "#4b5563", fontWeight: 600 }}>{m.active ? "LIVE" : "SOON"}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 20px", background: connected ? "#052e16" : "#1c0505", margin: "0 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444" }} />
          <span style={{ fontSize: 11, color: connected ? "#86efac" : "#fca5a5", fontWeight: 600 }}>{connected ? "CONNECTED" : "RECONNECTING"}</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #1e2a4a", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0a0f1e" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {{ dashboard: "Live Security Dashboard", transactions: "All Transactions", threats: "Threat Detection", api: "API Protection", behavioral: "Behavioral AI Monitor", reports: "Reports", settings: "Settings" }[activeTab]}
            </h1>
            <p style={{ fontSize: 12, color: "#4b6cb7", margin: "2px 0 0 0" }}>Real-time AI fraud detection — East Africa Banking Network</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#4b6cb7" }}>Security Score</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor }}>{securityScore}<span style={{ fontSize: 12, color: "#4b6cb7" }}>/100</span></div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: `conic-gradient(${scoreColor} ${securityScore * 3.6}deg, #1e2a4a 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡</div>
            </div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div style={{ background: "linear-gradient(90deg, #1c0505, #1f0a0a)", borderBottom: "1px solid #7f1d1d", padding: "10px 28px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ background: "#ef4444", color: "white", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>🚨 ALERT</span>
            <span style={{ fontSize: 13, color: "#fca5a5" }}>Latest fraud blocked: <strong>{alerts[0].merchant}</strong> — ${alerts[0].amount} — {alerts[0].location}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{alerts[0].timestamp}</span>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Transactions", value: stats.total.toLocaleString(), color: "#60a5fa", icon: "⇄", sub: "processed today" },
                { label: "Fraud Blocked", value: stats.fraud_detected.toLocaleString(), color: "#ef4444", icon: "🛡", sub: `${fraudRate}% fraud rate` },
                { label: "Legitimate", value: stats.legitimate.toLocaleString(), color: "#22c55e", icon: "✓", sub: "clean transactions" },
                { label: "Amount Protected", value: `$${stats.total_amount_protected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#a78bfa", icon: "⬡", sub: "saved from fraud" },
              ].map((c, i) => (
                <div key={i} style={{ background: "linear-gradient(135deg, #0f172a, #1e2a4a22)", border: "1px solid #1e2a4a", borderRadius: 12, padding: "20px 20px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 16, right: 16, fontSize: 20, opacity: 0.2 }}>{c.icon}</div>
                  <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>{c.label.toUpperCase()}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>{c.sub}</div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c.color}44, ${c.color})` }} />
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={card()}>
                <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, letterSpacing: 1, marginBottom: 16 }}>SECURITY SCORE</div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ position: "relative", width: 120, height: 120 }}>
                    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#1e2a4a" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="10" strokeDasharray={`${securityScore * 2.51} 251`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${scoreColor})`, transition: "stroke-dasharray 0.5s" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: scoreColor }}>{securityScore}</div>
                      <div style={{ fontSize: 10, color: "#4b6cb7" }}>/ 100</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: scoreColor, fontWeight: 600 }}>
                    {securityScore > 80 ? "✅ System Secure" : securityScore > 60 ? "⚠️ Elevated Risk" : "🚨 Under Attack"}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, color: "#334155" }}>AI confidence: 96.8% ROC-AUC</div>
                </div>
              </div>

              <div style={card()}>
                <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>TRANSACTION BREAKDOWN</div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                      <Cell fill="#22c55e" /><Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e2a4a", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} /><span style={{ fontSize: 11, color: "#86efac" }}>Legitimate ({stats.legitimate})</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} /><span style={{ fontSize: 11, color: "#fca5a5" }}>Fraud ({stats.fraud_detected})</span></div>
                </div>
              </div>

              <div style={card()}>
                <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>RISK SCORE — LIVE</div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide /><YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e2a4a", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v}%`, "Risk"]} />
                    <Area type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2} fill="url(#riskGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10, color: "#334155", textAlign: "center", marginTop: 4 }}>Real-time fraud probability per transaction</div>
              </div>
            </div>

            {activeTab === "dashboard" && (
              <TxTable transactions={transactions} />
            )}

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, color: "#1e3a5f" }}>Sentinel AI v1.0 — Built for East African Banking Security</div>
              <div style={{ fontSize: 11, color: "#1e3a5f" }}>Powered by XGBoost + SHAP Explainability — 96.8% ROC-AUC</div>
            </div>
          </>}

          {/* ── TRANSACTIONS TAB ── */}
          {activeTab === "transactions" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Processed", value: stats.total.toLocaleString(), color: "#60a5fa" },
                { label: "Fraud Rate", value: `${fraudRate}%`, color: "#ef4444" },
                { label: "Amount Protected", value: `$${stats.total_amount_protected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#a78bfa" },
              ].map((c, i) => (
                <div key={i} style={card()}>
                  <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, marginBottom: 8 }}>{c.label.toUpperCase()}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            <TxTable transactions={transactions} showAll />
          </>}

          {/* ── THREATS TAB ── */}
          {activeTab === "threats" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Active Alerts", value: alerts.length, color: "#ef4444" },
                { label: "Fraud Blocked Today", value: stats.fraud_detected, color: "#f59e0b" },
                { label: "High Risk Transactions", value: transactions.filter(t => t.risk_level === "HIGH").length, color: "#a78bfa" },
              ].map((c, i) => (
                <div key={i} style={card()}>
                  <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, marginBottom: 8 }}>{c.label.toUpperCase()}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            {/* Threat Intelligence Panel */}
            <div style={{ background: "#0f172a", border: "1px solid #1e2a4a", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Threat Intelligence Feed</div>
                  <div style={{ fontSize: 11, color: "#4b6cb7", marginTop: 2 }}>Real-time cyber threat detection</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { label: "CRITICAL", value: threatStats.critical, color: "#ef4444" },
                    { label: "HIGH", value: threatStats.high, color: "#f59e0b" },
                    { label: "BLOCKED", value: threatStats.blocked, color: "#22c55e" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center", background: s.color + "22", padding: "6px 12px", borderRadius: 8, border: `1px solid ${s.color}44` }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: s.color }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {threats.map((threat) => (
                  <div key={threat.id} style={{
                    padding: "12px 16px", borderRadius: 8, marginBottom: 8,
                    background: threat.color + "11", border: `1px solid ${threat.color}33`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: threat.color + "33", color: threat.color }}>
                            {threat.severity}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{threat.type}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{threat.description}</div>
                        <div style={{ fontSize: 10, color: "#4b6cb7" }}>
                          Source: {threat.source_ip} → Target: {threat.target}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: threat.status === "BLOCKED" ? "#22c55e" : "#f59e0b",
                          background: threat.status === "BLOCKED" ? "#052e16" : "#1c0a00", padding: "3px 8px", borderRadius: 4 }}>
                          {threat.status === "BLOCKED" ? "🛡 BLOCKED" : "🔍 INVESTIGATING"}
                        </div>
                        <div style={{ fontSize: 10, color: "#4b6cb7", marginTop: 4 }}>{threat.timestamp}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {threats.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>Connecting to threat feed...</div>
                )}
              </div>
            </div>
          </>}

          {/* ── BEHAVIORAL TAB ── */}
          {activeTab === "behavioral" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Sessions Monitored", value: behavioralStats.total, color: "#60a5fa" },
                { label: "Anomalies Flagged", value: behavioralStats.flagged, color: "#ef4444" },
                { label: "Safe Sessions", value: behavioralStats.safe, color: "#22c55e" },
              ].map((c, i) => (
                <div key={i} style={card()}>
                  <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, marginBottom: 8 }}>{c.label.toUpperCase()}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            <div style={card()}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Live Session Monitor <span style={{ marginLeft: 8, fontSize: 10, color: "#22c55e", background: "#052e16", padding: "2px 8px", borderRadius: 10 }}>● LIVE</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 120px 1fr 160px 100px 100px", gap: 8, padding: "8px 12px", borderBottom: "1px solid #1e2a4a", marginBottom: 8 }}>
                {["STATUS", "USER", "LOCATION / DEVICE", "ANOMALY", "RISK", "TIME"].map(h => (
                  <div key={h} style={{ fontSize: 10, color: "#4b6cb7", fontWeight: 600 }}>{h}</div>
                ))}
              </div>
              <div style={{ maxHeight: 450, overflowY: "auto" }}>
                {sessions.map((s, i) => (
                  <div key={s.id + i} style={{
                    display: "grid", gridTemplateColumns: "100px 120px 1fr 160px 100px 100px", gap: 8,
                    padding: "10px 12px", borderRadius: 8, marginBottom: 4,
                    background: s.is_flagged ? "linear-gradient(90deg, #1c050522, #1f0a0a)" : i % 2 === 0 ? "#ffffff05" : "transparent",
                    border: s.is_flagged ? "1px solid #7f1d1d44" : "1px solid transparent",
                  }}>
                    <div>{s.is_flagged
                      ? <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#1c0505", padding: "3px 8px", borderRadius: 4 }}>🚨 FLAGGED</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", background: "#052e16", padding: "3px 8px", borderRadius: 4 }}>✓ SAFE</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, alignSelf: "center" }}>{s.user}</div>
                    <div><div style={{ fontSize: 12 }}>{s.location}</div><div style={{ fontSize: 11, color: "#4b6cb7" }}>{s.device}</div></div>
                    <div style={{ fontSize: 11, color: s.anomaly_type ? "#f59e0b" : "#4b6cb7", alignSelf: "center" }}>{s.anomaly_type ? s.anomaly_type.replace(/_/g, " ").toUpperCase() : "—"}</div>
                    <div style={{ alignSelf: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.risk_score > 0.6 ? "#ef4444" : s.risk_score > 0.3 ? "#f59e0b" : "#22c55e" }}>{(s.risk_score * 100).toFixed(0)}%</div>
                      <div style={{ height: 3, background: "#1e2a4a", borderRadius: 2, marginTop: 3 }}>
                        <div style={{ height: "100%", width: `${s.risk_score * 100}%`, background: s.risk_score > 0.6 ? "#ef4444" : s.risk_score > 0.3 ? "#f59e0b" : "#22c55e", borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>{s.timestamp}</div>
                  </div>
                ))}
                {sessions.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>Connecting to Behavioral AI...</div>}
              </div>
            </div>
          </>}

          {/* ── REPORTS TAB ── */}
          {activeTab === "api" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "API Calls Monitored", value: apiStats.total.toLocaleString(), color: "#60a5fa" },
                { label: "Attacks Detected", value: apiStats.attacks.toLocaleString(), color: "#ef4444" },
                { label: "Requests Blocked", value: apiStats.blocked.toLocaleString(), color: "#f59e0b" },
                { label: "Safe Requests", value: apiStats.safe.toLocaleString(), color: "#22c55e" },
              ].map((c, i) => (
                <div key={i} style={card()}>
                  <div style={{ fontSize: 11, color: "#4b6cb7", fontWeight: 600, marginBottom: 8 }}>{c.label.toUpperCase()}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={card()}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                🔐 Live API Event Monitor
                <span style={{ marginLeft: 8, fontSize: 10, color: "#22c55e", background: "#052e16", padding: "2px 8px", borderRadius: 10 }}>● LIVE</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "90px 80px 1fr 160px 90px 90px 100px", gap: 8, padding: "8px 12px", borderBottom: "1px solid #1e2a4a", marginBottom: 8 }}>
                {["STATUS", "METHOD", "ENDPOINT", "ATTACK TYPE", "STATUS CODE", "RISK", "IP"].map(h => (
                  <div key={h} style={{ fontSize: 10, color: "#4b6cb7", fontWeight: 600 }}>{h}</div>
                ))}
              </div>

              <div style={{ maxHeight: 450, overflowY: "auto" }}>
                {apiEvents.map((e, i) => (
                  <div key={e.id + i} style={{
                    display: "grid", gridTemplateColumns: "90px 80px 1fr 160px 90px 90px 100px", gap: 8,
                    padding: "10px 12px", borderRadius: 8, marginBottom: 4,
                    background: e.is_blocked ? "linear-gradient(90deg, #1c050522, #1f0a0a)" : i % 2 === 0 ? "#ffffff05" : "transparent",
                    border: e.is_blocked ? "1px solid #7f1d1d44" : "1px solid transparent",
                  }}>
                    <div>
                      {e.is_blocked
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#1c0505", padding: "3px 8px", borderRadius: 4 }}>🚫 BLOCKED</span>
                        : <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", background: "#052e16", padding: "3px 8px", borderRadius: 4 }}>✓ ALLOWED</span>
                      }
                    </div>
                    <div style={{ alignSelf: "center" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: e.method === "DELETE" ? "#ef444422" : e.method === "POST" ? "#3b82f622" : "#ffffff11",
                        color: e.method === "DELETE" ? "#ef4444" : e.method === "POST" ? "#60a5fa" : "#94a3b8"
                      }}>{e.method}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "white", alignSelf: "center", fontFamily: "monospace" }}>{e.endpoint}</div>
                    <div style={{ fontSize: 11, color: e.attack_type ? "#f59e0b" : "#4b6cb7", alignSelf: "center" }}>
                      {e.attack_type ? e.attack_type.replace(/_/g, " ").toUpperCase() : "—"}
                    </div>
                    <div style={{ alignSelf: "center" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: e.status_code >= 500 ? "#ef4444" : e.status_code >= 400 ? "#f59e0b" : "#22c55e"
                      }}>{e.status_code}</span>
                    </div>
                    <div style={{ alignSelf: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: e.risk_score > 0.6 ? "#ef4444" : e.risk_score > 0.3 ? "#f59e0b" : "#22c55e" }}>
                        {(e.risk_score * 100).toFixed(0)}%
                      </div>
                      <div style={{ height: 3, background: "#1e2a4a", borderRadius: 2, marginTop: 3 }}>
                        <div style={{ height: "100%", width: `${e.risk_score * 100}%`, background: e.risk_score > 0.6 ? "#ef4444" : e.risk_score > 0.3 ? "#f59e0b" : "#22c55e", borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", alignSelf: "center", fontFamily: "monospace" }}>{e.ip}</div>
                  </div>
                ))}
                {apiEvents.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>Connecting to API Protection...</div>
                )}
              </div>
            </div>
          </>}

          {activeTab === "reports" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={card()}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>📊 Session Summary</div>
                {[
                  { label: "Total Transactions Processed", value: stats.total },
                  { label: "Fraud Cases Detected", value: stats.fraud_detected },
                  { label: "Legitimate Transactions", value: stats.legitimate },
                  { label: "Overall Fraud Rate", value: `${fraudRate}%` },
                  { label: "Amount Protected", value: `$${stats.total_amount_protected.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  { label: "Current Security Score", value: `${securityScore}/100` },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e2a4a11" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={card()}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>🧠 Behavioral Summary</div>
                {[
                  { label: "User Sessions Monitored", value: behavioralStats.total },
                  { label: "Anomalies Detected", value: behavioralStats.flagged },
                  { label: "Safe Sessions", value: behavioralStats.safe },
                  { label: "Anomaly Rate", value: behavioralStats.total > 0 ? `${((behavioralStats.flagged / behavioralStats.total) * 100).toFixed(1)}%` : "0.0%" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e2a4a11" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: 16, background: "#052e16", borderRadius: 8, border: "1px solid #166534" }}>
                  <div style={{ fontSize: 11, color: "#86efac", fontWeight: 600 }}>✅ Model Performance</div>
                  <div style={{ fontSize: 12, color: "#4b6cb7", marginTop: 8 }}>XGBoost ROC-AUC: <span style={{ color: "#22c55e", fontWeight: 700 }}>96.8%</span></div>
                  <div style={{ fontSize: 12, color: "#4b6cb7", marginTop: 4 }}>Trained on: <span style={{ color: "white" }}>284,807 transactions</span></div>
                </div>
              </div>
            </div>
          </>}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={card()}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>⚙️ System Configuration</div>
                {[
                  { label: "Backend API", value: "Railway (Live)", status: "green" },
                  { label: "Frontend", value: "Vercel (Live)", status: "green" },
                  { label: "WebSocket Stream", value: connected ? "Connected" : "Reconnecting", status: connected ? "green" : "red" },
                  { label: "AI Model", value: "XGBoost v1.0", status: "green" },
                  { label: "Behavioral AI", value: "Active", status: "green" },
                  { label: "SHAP Explainability", value: "Enabled", status: "green" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1e2a4a22" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.status === "green" ? "#22c55e" : "#ef4444" }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div style={card()}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>🗺️ Roadmap</div>
                {[
                  { name: "✅ Module 1: Fraud Detection", done: true },
                  { name: "✅ Module 2: Behavioral AI", done: true },
                  { name: "✅ Module 3: API Protection", done: true },
                  { name: "🔜 Module 4: Threat Intelligence", done: false },
                  { name: "🔜 Module 5: Bank Integration API", done: false },
                  { name: "🔜 Mobile App Dashboard", done: false },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1e2a4a22" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.done ? "#22c55e" : "#374151", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: r.done ? "white" : "#4b5563" }}>{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>}

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: #1e2a4a #0a0f1e; }
        body { background: #060818; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

function TxTable({ transactions }) {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e2a4a", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Live Transaction Feed</div>
          <div style={{ fontSize: 11, color: "#4b6cb7", marginTop: 2 }}>AI analyzing every transaction in real-time</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#052e16", padding: "4px 12px", borderRadius: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 11, color: "#86efac", fontWeight: 600 }}>STREAMING</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 100px 100px 80px", gap: 8, padding: "8px 12px", borderBottom: "1px solid #1e2a4a", marginBottom: 8 }}>
        {["RISK", "MERCHANT / LOCATION", "TIME", "AMOUNT", "AI SCORE", "STATUS"].map(h => (
          <div key={h} style={{ fontSize: 10, color: "#4b6cb7", fontWeight: 600 }}>{h}</div>
        ))}
      </div>
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {transactions.map((tx, i) => (
          <div key={tx.id + i} style={{
            display: "grid", gridTemplateColumns: "80px 1fr 140px 100px 100px 80px", gap: 8,
            padding: "10px 12px", borderRadius: 8, marginBottom: 4,
            background: tx.is_fraud ? "linear-gradient(90deg, #1c050522, #1f0a0a)" : i % 2 === 0 ? "#ffffff05" : "transparent",
            border: tx.is_fraud ? "1px solid #7f1d1d44" : "1px solid transparent",
          }}>
            <div><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: riskColor(tx.risk_level) + "22", color: riskColor(tx.risk_level), border: `1px solid ${riskColor(tx.risk_level)}44` }}>{tx.risk_level}</span></div>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{tx.merchant}</div><div style={{ fontSize: 11, color: "#4b6cb7" }}>{tx.location}</div></div>
            <div style={{ fontSize: 12, color: "#64748b", alignSelf: "center" }}>{tx.timestamp}</div>
            <div style={{ fontSize: 13, fontWeight: 700, alignSelf: "center" }}>${tx.amount}</div>
            <div style={{ alignSelf: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: riskColor(tx.risk_level) }}>{(tx.fraud_probability * 100).toFixed(1)}%</div>
              <div style={{ height: 3, background: "#1e2a4a", borderRadius: 2, marginTop: 3 }}>
                <div style={{ height: "100%", width: `${tx.fraud_probability * 100}%`, background: riskColor(tx.risk_level), borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ alignSelf: "center" }}>
              {tx.is_fraud
                ? <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#1c0505", padding: "3px 8px", borderRadius: 4 }}>🚫 BLOCKED</span>
                : <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", background: "#052e16", padding: "3px 8px", borderRadius: 4 }}>✓ CLEAR</span>}
            </div>
          </div>
        ))}
        {transactions.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>Connecting to AI engine...</div>}
      </div>
    </div>
  );
}