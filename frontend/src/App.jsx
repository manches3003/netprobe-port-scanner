import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = "https://huggingface.co/spaces/manches3003/netprobe-backend";

// ── Design tokens — completely different from PhishGuard ────────
const C = {
  bg:       "#060b14",
  bg2:      "#0a1220",
  bg3:      "#0f1a2e",
  card:     "#111d30",
  border:   "rgba(56,189,248,0.08)",
  border2:  "rgba(56,189,248,0.18)",
  cyan:     "#38bdf8",
  teal:     "#2dd4bf",
  emerald:  "#34d399",
  amber:    "#fbbf24",
  red:      "#f87171",
  muted:    "#4a6080",
  text:     "#e2eaf4",
  text2:    "#7a9bbf",
};

const RISK_C = { HIGH: C.red, MEDIUM: C.amber, LOW: C.emerald, INFO: C.cyan, CRITICAL: "#ff3366" };

// ── Animated background orbs ────────────────────────────────────
function Orbs() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 65%)",
        animation: "orbFloat 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 65%)",
        animation: "orbFloat 16s ease-in-out infinite reverse" }} />
      <div style={{ position: "absolute", top: "40%", left: "50%", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 65%)",
        animation: "orbFloat 20s ease-in-out infinite 4s" }} />
      {/* Dot grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.4,
        backgroundImage: "radial-gradient(circle, rgba(56,189,248,0.15) 1px, transparent 1px)",
        backgroundSize: "32px 32px" }} />
    </div>
  );
}

// ── Circular risk gauge ─────────────────────────────────────────
function CircleGauge({ value, max = 100, color, label, size = 100 }) {
  const r = 36, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;
  return (
    <div style={{ textAlign: "center", width: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(56,189,248,0.06)" strokeWidth="7" />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "center", transform: "rotate(-90deg)", filter: `drop-shadow(0 0 4px ${color})` }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color}
          fontSize="18" fontWeight="700" fontFamily="'Outfit', sans-serif">{value}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={color + "80"}
          fontSize="8" fontFamily="'Outfit', sans-serif" letterSpacing="1">/100</text>
      </svg>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Outfit', sans-serif",
        letterSpacing: "0.12em", textTransform: "uppercase", marginTop: -4 }}>{label}</div>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────
function StatCard({ value, label, color, icon }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${color}20`,
      padding: "20px 24px", flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700,
        color, lineHeight: 1, marginBottom: 4, textShadow: `0 0 20px ${color}40` }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em",
        fontFamily: "'Outfit', sans-serif", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ── Port row ────────────────────────────────────────────────────
function PortRow({ port, index }) {
  const [open, setOpen] = useState(false);
  const color = RISK_C[port.risk_level] || C.cyan;
  const riskBg = { HIGH: "rgba(248,113,113,0.06)", MEDIUM: "rgba(251,191,36,0.06)", LOW: "rgba(52,211,153,0.06)", INFO: "rgba(56,189,248,0.06)" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ background: open ? riskBg[port.risk_level] || riskBg.INFO : "transparent",
        border: `1px solid ${open ? color + "30" : "transparent"}`,
        marginBottom: 4, transition: "all 0.25s", borderRadius: 2 }}>
      <div onClick={() => setOpen(!open)}
        style={{ display: "grid", gridTemplateColumns: "80px 130px 100px 1fr 28px",
          alignItems: "center", gap: 16, padding: "13px 18px", cursor: "pointer" }}
        onMouseEnter={e => e.currentTarget.style.background = riskBg[port.risk_level] || riskBg.INFO}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color }}>
          {port.port}
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 400, display: "block" }}>TCP</span>
        </div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.text, fontWeight: 500 }}>
          {port.service}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color,
            boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11,
            color, letterSpacing: "0.06em", fontWeight: 600 }}>{port.risk_level}</span>
        </div>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.text2, lineHeight: 1.5 }}>
          {port.risk_reason}
        </div>
        <div style={{ color: C.muted, fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
          {open ? "▲" : "▼"}
        </div>
      </div>
      <AnimatePresence>
        {open && port.banner && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 18px 14px 114px" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.muted,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Banner Response</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11,
                color: C.teal, background: "rgba(45,212,191,0.04)",
                border: "1px solid rgba(45,212,191,0.12)",
                padding: "10px 14px", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6 }}>
                {port.banner}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Scan animation ──────────────────────────────────────────────
function ScanAnimation({ target, progress }) {
  const steps = ["Resolving DNS", "Opening socket connections", "Scanning port range", "Detecting services", "Analyzing vulnerabilities", "Building report"];
  const activeStep = Math.floor((progress / 100) * steps.length);
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border2}`, padding: "36px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ width: 32, height: 32, borderRadius: "50%",
              border: `2px solid ${C.border}`, borderTop: `2px solid ${C.cyan}` }} />
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: C.text }}>
              Scanning {target}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted }}>
              {Math.round(progress)}% complete
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 28 }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}
            style={{ height: "100%", background: `linear-gradient(90deg, ${C.cyan}, ${C.teal})`,
              boxShadow: `0 0 12px ${C.cyan}60`, borderRadius: 2 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < activeStep ? `${C.emerald}15` : i === activeStep ? `${C.cyan}15` : "transparent",
                border: `1px solid ${i < activeStep ? C.emerald : i === activeStep ? C.cyan : C.border}`,
                transition: "all 0.4s" }}>
                {i < activeStep
                  ? <span style={{ fontSize: 10, color: C.emerald }}>✓</span>
                  : i === activeStep
                  ? <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan }} />
                  : <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.border }} />}
              </div>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13,
                color: i < activeStep ? C.emerald : i === activeStep ? C.text : C.muted,
                transition: "color 0.4s" }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────
export default function App() {
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState("common");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("ports");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetch(`${API}/health`).catch(() => {}); }, []);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      const iv = setInterval(() => setProgress(p => p < 88 ? p + Math.random() * 5 : p), 400);
      return () => clearInterval(iv);
    } else if (result) setProgress(100);
  }, [loading, result]);

  const scan = async () => {
    if (!target.trim()) return;
    setLoading(true); setError(""); setResult(null); setTab("ports"); setFilter("ALL");
    try {
      const res = await axios.post(`${API}/scan`, { target: target.trim(), scan_type: scanType });
      setResult(res.data);
      setHistory(p => [{ target: target.trim(), ip: res.data.ip, rating: res.data.risk_rating, ports: res.data.open_ports_count, time: new Date().toLocaleTimeString() }, ...p.slice(0, 6)]);
    } catch (e) {
      setError(e.response?.data?.detail || "Cannot connect to backend. Make sure python main.py is running.");
    } finally { setLoading(false); }
  };

  const exportPDF = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const res = await axios.post(`${API}/export-pdf`, result, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(new Blob([res.data]));
      a.download = `scan_${result.ip}.pdf`; a.click();
    } catch { setError("PDF export failed."); }
    finally { setExporting(false); }
  };

  const riskColor = result
    ? result.risk_score >= 70 ? C.red : result.risk_score >= 40 ? C.amber : result.risk_score >= 20 ? C.cyan : C.emerald
    : C.cyan;

  const filteredPorts = result?.open_ports.filter(p => filter === "ALL" || p.risk_level === filter) || [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'Outfit', sans-serif", overflowX: "hidden", position: "relative" }}>

      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <Orbs />

      {/* ── NAVBAR ── */}
      <motion.nav initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: "sticky", top: 0, zIndex: 100,
          background: "rgba(6,11,20,0.92)", backdropFilter: "blur(24px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 52px", display: "flex", alignItems: "center", height: 64, gap: 16 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${C.cyan}20, ${C.teal}20)`,
            border: `1px solid ${C.cyan}30`, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔭</div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 800,
              color: C.text, letterSpacing: "-0.02em" }}>
              Net<span style={{ color: C.cyan }}>Probe</span>
            </div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Port Intelligence
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginLeft: 32 }}>
          {[["common", "Quick Scan"], ["full", "Deep Scan"]].map(([v, l]) => (
            <button key={v} onClick={() => setScanType(v)}
              style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 500,
                padding: "6px 16px", borderRadius: 20,
                background: scanType === v ? `${C.cyan}15` : "transparent",
                border: `1px solid ${scanType === v ? C.cyan + "50" : C.border}`,
                color: scanType === v ? C.cyan : C.muted,
                cursor: "pointer", transition: "all 0.2s" }}>{l}</button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8,
          background: `${C.emerald}10`, border: `1px solid ${C.emerald}25`,
          padding: "6px 14px", borderRadius: 20 }}>
          <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: "50%", background: C.emerald }} />
          <span style={{ fontSize: 11, color: C.emerald, fontWeight: 500, letterSpacing: "0.06em" }}>
            System Online
          </span>
        </div>
      </motion.nav>

      <div style={{ position: "relative", zIndex: 2 }}>

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: "72px 52px 52px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
              background: `${C.cyan}08`, border: `1px solid ${C.cyan}20`,
              padding: "7px 20px", borderRadius: 40 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan,
              boxShadow: `0 0 8px ${C.cyan}` }} />
            <span style={{ fontSize: 11, color: C.cyan, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Network Security Scanner
            </span>
          </motion.div>

          <h1 style={{ fontSize: "clamp(32px,5vw,60px)", fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-0.04em", margin: "0 0 20px", color: C.text }}>
            Discover Open Ports &{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.teal})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Security Risks
            </span>
          </h1>

          <p style={{ fontSize: 16, color: C.text2, maxWidth: 500, margin: "0 auto 44px", lineHeight: 1.8, fontWeight: 300 }}>
            Scan any IP or domain for open ports, identify running services, detect vulnerabilities and export a full security report.
          </p>

          {/* Input */}
          <div style={{ maxWidth: 740, margin: "0 auto",
            background: C.card, border: `1px solid ${C.border2}`,
            display: "flex", borderRadius: 4,
            boxShadow: `0 0 60px ${C.cyan}08` }}>
            <div style={{ padding: "0 18px", display: "flex", alignItems: "center",
              color: C.muted, fontSize: 18, flexShrink: 0 }}>🌐</div>
            <input value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === "Enter" && scan()}
              placeholder="192.168.1.1 or example.com"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none",
                padding: "17px 8px", color: C.text, fontSize: 15, fontFamily: "'Outfit', sans-serif",
                fontWeight: 400, minWidth: 0 }} />
            <motion.button onClick={scan} disabled={loading || !target.trim()}
              whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
              style={{ padding: "17px 40px", flexShrink: 0,
                background: `linear-gradient(135deg, ${C.cyan}, ${C.teal})`,
                border: "none", color: "#000", fontFamily: "'Outfit', sans-serif",
                fontSize: 14, fontWeight: 700, letterSpacing: "0.04em",
                cursor: "pointer", opacity: !target.trim() ? 0.4 : 1,
                borderRadius: "0 2px 2px 0" }}>
              {loading ? "Scanning..." : "Scan →"}
            </motion.button>
          </div>

          {/* Quick targets */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>Try:</span>
            {["scanme.nmap.org", "google.com", "github.com"].map(s => (
              <button key={s} onClick={() => setTarget(s)}
                style={{ fontSize: 12, color: C.text2,
                  background: "transparent", border: `1px solid ${C.border2}`,
                  padding: "5px 14px", cursor: "pointer", borderRadius: 20,
                  fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => { e.target.style.borderColor = C.cyan + "60"; e.target.style.color = C.cyan; }}
                onMouseLeave={e => { e.target.style.borderColor = C.border2; e.target.style.color = C.text2; }}>
                {s}
              </button>
            ))}
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10,
                color: C.red, background: `${C.red}08`, border: `1px solid ${C.red}25`,
                padding: "10px 20px", borderRadius: 4, fontSize: 13 }}>
              ⚠ {error}
            </motion.div>
          )}
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "0 52px 32px" }}>
              <ScanAnimation target={target} progress={progress} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RESULTS ── */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              style={{ padding: "0 52px 72px" }}>

              {/* Summary row */}
              <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 3, minWidth: 280, background: C.card,
                  border: `1px solid ${riskColor}25`, padding: "28px 32px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em",
                      textTransform: "uppercase", marginBottom: 8 }}>Target Analyzed</div>
                    <div style={{ fontSize: "clamp(18px,3vw,28px)", fontWeight: 800,
                      color: C.text, letterSpacing: "-0.02em", marginBottom: 6 }}>{result.target}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted }}>
                      {result.ip} · {result.total_ports_scanned} ports · {result.scan_duration}s
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                    <CircleGauge value={result.risk_score} color={riskColor} label="Risk Score" size={110} />
                    <motion.button onClick={exportPDF} disabled={exporting}
                      whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
                        background: "transparent", border: `1px solid ${C.border2}`,
                        color: C.text2, padding: "10px 22px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                        borderRadius: 4 }}>
                      📄 {exporting ? "Exporting..." : "Export PDF"}
                    </motion.button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, minWidth: 200 }}>
                  <StatCard value={result.open_ports_count} label="Open Ports" color={C.cyan} icon="🔓" />
                  <StatCard value={result.high_risk_count} label="High Risk" color={C.red} icon="🚨" />
                  <StatCard value={result.medium_risk_count} label="Medium Risk" color={C.amber} icon="⚠️" />
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 0,
                borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
                {[["ports", `Open Ports (${result.open_ports_count})`], ["recs", "Recommendations"], ["history", "History"]].map(([t, l]) => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
                      padding: "12px 22px", border: "none",
                      borderBottom: tab === t ? `2px solid ${C.cyan}` : "2px solid transparent",
                      background: "transparent", color: tab === t ? C.cyan : C.muted,
                      cursor: "pointer", transition: "all 0.2s", marginBottom: -1 }}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`,
                borderTop: "none", padding: "28px" }}>

                {tab === "ports" && (
                  <>
                    {/* Filter pills */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>Filter:</span>
                      {["ALL", "HIGH", "MEDIUM", "LOW", "INFO"].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                          style={{ fontSize: 11, fontFamily: "'Outfit', sans-serif",
                            padding: "5px 14px", borderRadius: 20, border: "1px solid",
                            borderColor: filter === f ? (RISK_C[f] || C.cyan) + "60" : C.border,
                            background: filter === f ? (RISK_C[f] || C.cyan) + "10" : "transparent",
                            color: filter === f ? (RISK_C[f] || C.cyan) : C.muted,
                            cursor: "pointer", transition: "all 0.2s" }}>
                          {f}
                        </button>
                      ))}
                    </div>

                    {/* Column headers */}
                    <div style={{ display: "grid", gridTemplateColumns: "80px 130px 100px 1fr 28px",
                      gap: 16, padding: "0 18px 10px", marginBottom: 4,
                      borderBottom: `1px solid ${C.border}` }}>
                      {["Port", "Service", "Risk", "Details", ""].map(h => (
                        <span key={h} style={{ fontSize: 10, color: C.muted,
                          letterSpacing: "0.12em", textTransform: "uppercase",
                          fontFamily: "'Outfit', sans-serif" }}>{h}</span>
                      ))}
                    </div>

                    {filteredPorts.length === 0
                      ? <div style={{ padding: "24px 18px", color: C.muted, fontSize: 14 }}>
                          ✅ No ports match this filter.
                        </div>
                      : filteredPorts.map((p, i) => <PortRow key={p.port} port={p} index={i} />)
                    }
                  </>
                )}

                {tab === "recs" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.recommendations.map((rec, i) => {
                      const isHigh = rec.startsWith("🔴");
                      const isMed = rec.startsWith("🟠");
                      const c = isHigh ? C.red : isMed ? C.amber : C.emerald;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          style={{ display: "flex", gap: 14, padding: "16px 20px",
                            background: `${c}06`, border: `1px solid ${c}20`, borderRadius: 4,
                            alignItems: "flex-start" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%",
                            background: `${c}12`, border: `1px solid ${c}30`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, flexShrink: 0 }}>
                            {isHigh ? "🔴" : isMed ? "🟠" : "✅"}
                          </div>
                          <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
                            {rec.replace("🔴 ", "").replace("🟠 ", "").replace("✅ ", "")}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {tab === "history" && (
                  history.length === 0
                    ? <div style={{ color: C.muted, fontSize: 14, padding: "8px 0" }}>No scan history yet.</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {history.map((h, i) => {
                          const c = h.rating === "LOW" ? C.emerald : h.rating === "MEDIUM" ? C.amber : C.red;
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16,
                              padding: "12px 16px", background: C.bg3, border: `1px solid ${C.border}`,
                              borderRadius: 4 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c,
                                boxShadow: `0 0 6px ${c}`, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: c, fontWeight: 600, minWidth: 70 }}>{h.rating}</span>
                              <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{h.target}</span>
                              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.muted }}>{h.ip}</span>
                              <span style={{ fontSize: 11, color: C.muted }}>{h.ports} ports</span>
                              <span style={{ fontSize: 11, color: C.muted }}>{h.time}</span>
                            </div>
                          );
                        })}
                      </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats section when no result */}
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ padding: "0 52px 72px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {[
                { icon: "🔍", n: "1000+", l: "Ports Scanned", c: C.cyan },
                { icon: "⚡", n: "Multi-thread", l: "Concurrent Scan", c: C.teal },
                { icon: "📄", n: "PDF Export", l: "Full Reports", c: C.emerald },
                { icon: "🛡", n: "20+ Services", l: "Detected", c: C.amber },
              ].map(({ icon, n, l, c }, i) => (
                <motion.div key={l} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  style={{ background: C.card, border: `1px solid ${C.border}`,
                    padding: "28px 24px", textAlign: "center", borderRadius: 4 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700,
                    color: c, marginBottom: 6 }}>{n}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "0 0 36px",
          fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.muted }}>
          Built by{" "}
          <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.teal})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>
            Keshav Kansara
          </span>
          {" "}· MSc Cyber Security · SRH University Leipzig 🇩🇪
        </div>
      </div>

      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono&display=swap');
* { box-sizing: border-box; }
body { margin: 0; background: #060b14; }
input::placeholder { color: #4a6080; font-family: 'Outfit', sans-serif; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #060b14; }
::-webkit-scrollbar-thumb { background: #38bdf840; border-radius: 2px; }
@keyframes orbFloat {
  0%,100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

/* ── TABLET (max 900px) ── */
@media(max-width: 900px) {
  /* Stat cards — stack vertically */
  div[style*="flex: 3"][style*="min-width: 280px"] {
    flex: 1 !important;
  }
  /* Stats row — make horizontal */
  div[style*="flex-direction: column"][style*="gap: 14px"] {
    flex-direction: row !important;
    flex-wrap: wrap !important;
  }
  /* Feature cards */
  div[style*="grid-template-columns: repeat(4"] {
    grid-template-columns: 1fr 1fr !important;
  }
  /* Port table — hide details column */
  div[style*="grid-template-columns: 80px 130px 100px 1fr 28px"] {
    grid-template-columns: 70px 110px 90px 1fr 24px !important;
  }
}

/* ── MOBILE (max 640px) ── */
@media(max-width: 640px) {
  /* Navbar */
  nav { padding: 0 16px !important; height: auto !important; flex-wrap: wrap !important; padding: 12px 16px !important; gap: 8px !important; }
  nav > div:nth-child(2) { display: none !important; }

  /* Hero */
  div[style*="padding: 72px 52px"] { padding: 40px 16px 32px !important; }
  div[style*="padding: 0px 52px 72px"] { padding: 0 16px 48px !important; }
  div[style*="padding: 0px 52px 32px"] { padding: 0 16px 24px !important; }

  /* Title */
  h1 { font-size: 26px !important; }

  /* Input bar — stack button below */
  div[style*="max-width: 740px"] {
    flex-direction: column !important;
    border-radius: 4px !important;
  }
  div[style*="max-width: 740px"] button {
    border-radius: 0 0 4px 4px !important;
    width: 100% !important;
  }

  /* Quick targets — wrap */
  div[style*="display: flex"][style*="gap: 8px"][style*="justify-content: center"] {
    flex-wrap: wrap !important;
  }

  /* Summary row — stack everything */
  div[style*="display: flex"][style*="gap: 14px"][style*="margin-bottom: 16px"] {
    flex-direction: column !important;
  }
  div[style*="flex: 3"][style*="min-width: 280px"] {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 20px !important;
  }

  /* Stat cards row */
  div[style*="flex-direction: column"][style*="gap: 14px"] {
    flex-direction: row !important;
    flex-wrap: wrap !important;
  }
  div[style*="flex: 1"][style*="min-width: 120px"] {
    flex: 1 1 calc(33% - 10px) !important;
    min-width: 90px !important;
  }

  /* Port table — simplified columns */
  div[style*="grid-template-columns: 80px 130px 100px 1fr 28px"] {
    grid-template-columns: 56px 80px 72px 1fr 20px !important;
    gap: 8px !important;
    font-size: 11px !important;
  }

  /* Port row padding */
  div[style*="padding: 13px 18px"] {
    padding: 10px 12px !important;
  }

  /* Feature grid */
  div[style*="grid-template-columns: repeat(4"] {
    grid-template-columns: 1fr 1fr !important;
    gap: 10px !important;
  }

  /* Tabs — scrollable */
  div[style*="display: flex"][style*="border-bottom"] {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  div[style*="display: flex"][style*="border-bottom"] button {
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  /* Filter pills */
  div[style*="display: flex"][style*="gap: 8px"][style*="margin-bottom: 20px"] {
    flex-wrap: wrap !important;
  }

  /* History rows */
  div[style*="padding: 12px 16px"] {
    flex-wrap: wrap !important;
    gap: 6px !important;
  }

  /* Gauge */
  svg[width="110"] { width: 90px !important; height: 90px !important; }

  /* Footer */
  div[style*="text-align: center"][style*="padding: 0px 0px 36px"] {
    padding: 0 16px 28px !important;
    font-size: 11px !important;
  }
}

/* ── SMALL PHONES (max 380px) ── */
@media(max-width: 380px) {
  h1 { font-size: 22px !important; }
  div[style*="grid-template-columns: 56px 80px 72px"] {
    grid-template-columns: 48px 70px 60px 1fr !important;
  }
  div[style*="grid-template-columns: repeat(4"] {
    grid-template-columns: 1fr 1fr !important;
  }
  div[style*="flex: 1 1 calc(33%"] {
    flex: 1 1 calc(50% - 8px) !important;
  }
}
      `}</style>
    </div>
  );
}