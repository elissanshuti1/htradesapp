"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";

type Methodology = "smc" | "ict";

interface KeyLevel {
  label: string;
  price: string;
  type: string;
}

interface PositionSize {
  supported: boolean;
  instrument: string;
  lots: number;
  riskAmount: number;
  riskPercent: number;
  actualLoss: number;
  actualPercent: number;
  pipLabel: string;
  note: string;
}

interface ChartAnalysis {
  instrument: string;
  timeframe: string;
  methodology: string;
  direction: "BUY" | "SELL";
  sniperEntry: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number;
  invalidation: string;
  summary: string;
  reasoning: string[];
  keyLevels: KeyLevel[];
  positionSize?: PositionSize;
  riskCapApplied?: boolean;
  demo?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  liquidity: "#FF9500",
  orderblock: "#A855F7",
  fvg: "#3B82F6",
  breaker: "#EC4899",
  support: "#22C55E",
  resistance: "#FF5252",
  supply: "#FF5252",
  demand: "#22C55E",
  ote: "#7C6AFF",
  premium: "#FF5252",
  discount: "#22C55E",
  bpr: "#14B8A6",
  level: "#E2DDD6",
};

const ArrowUp = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ArrowDown = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M8 13L4 9M8 13L12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const UploadIcon = () => (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 15V4M11 4L7 8M11 4L15 8M4 15V17C4 17.6 4.4 18 5 18H17C17.6 18 18 17.6 18 17V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const TrashIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4H13M6.5 4V3C6.5 2.5 6.8 2 7.3 2H8.7C9.2 2 9.5 2.5 9.5 3V4M4.5 4L5 13C5 13.6 5.4 14 6 14H10C10.6 14 11 13.6 11 13L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ScanIcon = () => (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 8V5C3 4 4 3 5 3H8M14 3H17C18 3 19 4 19 5V8M19 14V17C19 18 18 19 17 19H14M8 19H5C4 19 3 18 3 17V14M7 11H15M7 8H15M7 14H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>);
const ShieldIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5L3 4V8.5C3 12 5.7 15.2 9 16C12.3 15.2 15 12 15 8.5V4L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 9L8.2 10.7L11.5 7.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ZapIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.5 2L4.5 10H8L7 16L14 8H10L10.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>);
const TargetIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4"/><path d="M9 1V3M9 15V17M1 9H3M15 9H17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);
const CandlesIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 2V4M4 14V16M4 5V13M2.5 4H5.5M2.5 14H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><rect x="3.2" y="5" width="1.6" height="8" rx="0.4" fill="currentColor"/><path d="M12 1V3M12 15V17M12 4V14M10.5 3H13.5M10.5 15H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><rect x="11.2" y="4" width="1.6" height="10" rx="0.4" fill="currentColor"/></svg>);
const CrosshairIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 0.5V5M9 13V17.5M0.5 9H5M13 9H17.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/></svg>);
const RefreshIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8C13 10.8 10.8 13 8 13C6.5 13 5.2 12.3 4.4 11.2M3 8C3 5.2 5.2 3 8 3C9.4 3 10.6 3.6 11.5 4.6M3 11V8H6M13 5V8H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const LockIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 7V5C5.5 3.3 6.6 2 8 2C9.4 2 10.5 3.3 10.5 5V7" stroke="currentColor" strokeWidth="1.4"/></svg>);
const CloseIcon = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>);
const ClockIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4V7L9 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);

function decimalsFor(instrument: string): number {
  const i = (instrument || "").toUpperCase().replace(/[\s/\\-]/g, "");
  if (i === "XAUUSD" || i === "GOLD") return 2;
  if (i.includes("JPY")) return 3;
  return 5;
}

function fmt(n: number, instrument: string): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimalsFor(instrument), maximumFractionDigits: decimalsFor(instrument) });
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = value >= 75 ? "#22C55E" : value >= 55 ? "#FF9500" : "#FF5252";
  return (
    <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1A1929" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 32 32)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <span className="f-display" style={{ fontSize: "1.05rem", color, lineHeight: 1.1 }}>{value}%</span>
        <span className="f-mono" style={{ fontSize: "0.42rem", color: "#3D3B52", letterSpacing: "0.08em", textTransform: "uppercase" }}>confidence</span>
      </div>
    </div>
  );
}

function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1280;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas unsupported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

interface RecentItem {
  instrument: string;
  methodology: string;
  direction: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  time: number;
}

export default function Dashboard() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [methodology, setMethodology] = useState<Methodology | null>(null);
  const [balanceInput, setBalanceInput] = useState("1000");
  const balance = isFinite(parseFloat(balanceInput)) ? Math.max(0, parseFloat(balanceInput)) : 0;
  const [riskPercent, setRiskPercent] = useState(2);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ChartAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("htrades-recent") || "[]");
      if (Array.isArray(items)) setRecent(items.slice(0, 5));
    } catch {}
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG).");
      return;
    }
    setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setImageDataUrl(dataUrl);
      setImageName(file.name);
      setResult(null);
    } catch {
      setError("Could not read that image. Try another screenshot.");
    }
  }, []);

  const saveRecent = useCallback((a: ChartAnalysis) => {
    try {
      const items: RecentItem[] = JSON.parse(localStorage.getItem("htrades-recent") || "[]");
      const entry: RecentItem = {
        instrument: a.instrument,
        methodology: a.methodology,
        direction: a.direction,
        entry: a.entry,
        stopLoss: a.stopLoss,
        takeProfit: a.takeProfit,
        confidence: a.confidence,
        time: Date.now(),
      };
      const next = [entry, ...items.filter((x) => x.instrument !== entry.instrument || x.entry !== entry.entry)].slice(0, 5);
      localStorage.setItem("htrades-recent", JSON.stringify(next));
      setRecent(next);
    } catch {}
  }, []);

  const analyze = useCallback(async () => {
    if (!imageDataUrl || !methodology || analyzing) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl,
          methodology,
          accountBalance: balance,
          riskPercent: Math.min(20, riskPercent),
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.analysis) {
        setError(data.error || "Analysis failed. Please try again.");
      } else {
        setResult(data.analysis);
        saveRecent(data.analysis);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [imageDataUrl, methodology, analyzing, balance, riskPercent, saveRecent]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const effectiveRisk = Math.min(20, riskPercent);
  const maxLoss = balance > 0 ? (balance * effectiveRisk) / 100 : 0;
  const canAnalyze = Boolean(imageDataUrl && methodology && !analyzing);

  const dec = result ? decimalsFor(result.instrument) : 5;
  const buy = result?.direction === "BUY";
  const confidenceColor = result ? (result.confidence >= 75 ? "#22C55E" : result.confidence >= 55 ? "#FF9500" : "#FF5252") : "#7C6AFF";

  const riskDistance = result ? Math.abs(result.entry - result.stopLoss) : 0;
  const rewardDistance = result ? Math.abs(result.takeProfit - result.entry) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#E2DDD6]" style={{ position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .f-sans { font-family: 'Inter', -apple-system, sans-serif; }
        .f-display { font-family: 'Syne', sans-serif; }
        .f-mono { font-family: 'JetBrains Mono', monospace; }
        .card { background: #0F0E18; border: 1px solid #1A1929; border-radius: 16px; position: relative; }
        .card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, #7C6AFF22, transparent); }
        .card > * { position: relative; z-index: 1; }
        .glow { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        .fade-up { animation: fadeUp 0.4s ease-out; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.75)} }
        .pulse { animation: pulse 1.6s ease-in-out infinite; }
        @keyframes scanLine { 0%{top:0} 50%{top:calc(100% - 3px)} 100%{top:0} }
        .scan-line { position:absolute; left:0; right:0; height:3px; background: linear-gradient(90deg, transparent, #7C6AFF, transparent); box-shadow: 0 0 18px rgba(124,106,255,0.8); animation: scanLine 2.2s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }
        .btn-primary { background:#7C6AFF; color:#fff; border:none; border-radius:12px; font-family:'Syne',sans-serif; font-weight:600; font-size:0.95rem; padding:15px 20px; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; justify-content:center; gap:10px; }
        .btn-primary:hover:not(:disabled) { background:#6A58EE; transform:translateY(-1px); box-shadow:0 10px 30px rgba(124,106,255,0.35); }
        .btn-primary:disabled { opacity:0.35; cursor:not-allowed; }
        .btn-ghost { background:transparent; color:#6A6480; border:1px solid #1F1E2A; border-radius:12px; font-family:'Syne',sans-serif; font-weight:600; font-size:0.85rem; padding:12px 18px; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:8px; }
        .btn-ghost:hover { color:#E2DDD6; border-color:#3A3850; }
        .nav-pill { font-family:'JetBrains Mono',monospace; font-size:0.6rem; letter-spacing:0.08em; text-transform:uppercase; padding:5px 11px; border-radius:6px; display:inline-flex; align-items:center; gap:5px; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
        input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:4px; border-radius:4px; background:#1A1929; outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:18px; height:18px; border-radius:50%; background:#7C6AFF; border:3px solid #0F0E18; box-shadow:0 0 0 1px #7C6AFF, 0 0 14px rgba(124,106,255,0.5); cursor:pointer; }
        input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:#7C6AFF; border:3px solid #0F0E18; cursor:pointer; }
      `}</style>

      <div className="glow" style={{ top: -120, left: "20%", width: 500, height: 300, background: "rgba(100,80,255,0.10)" }} />
      <div className="glow" style={{ top: 200, right: "-10%", width: 400, height: 300, background: "rgba(60,120,255,0.06)" }} />

      <header className="f-sans sticky top-0 z-40" style={{ background: "rgba(10,10,15,0.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid #13121C" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "#7C6AFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>H</div>
            <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#E2DDD6", letterSpacing: "-0.01em" }}>HT<span style={{ color: "#7C6AFF" }}>RADES</span></span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="nav-pill" style={{ color: "#22C55E", background: "#22C55E10", border: "1px solid #22C55E22" }}>
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              Sniper Entry AI
            </span>
            <AuthButton />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "44px 24px 80px", position: "relative", zIndex: 1 }}>
        <section style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 className="f-display fade-up" style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
            Upload a chart. <em style={{ color: "#7C6AFF", fontStyle: "italic" }}>Get your sniper entry.</em>
          </h1>
          <p className="f-sans" style={{ fontSize: "1rem", color: "#6A6480", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            Drop a TradingView screenshot, pick <b style={{ color: "#E2DDD6" }}>SMC</b> or <b style={{ color: "#E2DDD6" }}>ICT</b>, and the AI reads the structure to give you the entry, stop loss and take profit — with a hard guard so you never risk more than 20% of your account.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card" style={{ padding: 20 }}>
              <div className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <UploadIcon /> 1 · Upload Chart
              </div>

              {!imageDataUrl ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                  onClick={() => fileInputRef.current?.click()}
                  className="f-sans"
                  style={{
                    border: `2px dashed ${dragging ? "#7C6AFF" : "#1F1E2A"}`,
                    borderRadius: 14,
                    padding: "38px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                    background: dragging ? "#7C6AFF0D" : "transparent",
                  }}
                >
                  <div style={{ color: dragging ? "#7C6AFF" : "#3D3B52", marginBottom: 12, display: "flex", justifyContent: "center" }}><UploadIcon /></div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#A09A92", marginBottom: 6 }}>Drop your chart screenshot here</div>
                  <div className="f-mono" style={{ fontSize: "0.65rem", color: "#3D3B52" }}>or click to browse — PNG / JPG / WEBP</div>
                </div>
              ) : (
                <div>
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #1A1929", marginBottom: 12 }}>
                    <img src={imageDataUrl} alt="Uploaded chart" style={{ width: "100%", display: "block" }} />
                    <div style={{ position: "absolute", inset: "auto 10px 10px auto", display: "flex", gap: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="btn-ghost"
                        style={{ padding: "6px 10px", fontSize: "0.62rem", background: "rgba(10,10,15,0.8)", backdropFilter: "blur(6px)" }}
                      >Replace</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setImageDataUrl(null); setImageName(""); setResult(null); }}
                        className="btn-ghost"
                        style={{ padding: "6px 10px", fontSize: "0.62rem", background: "rgba(10,10,15,0.8)", backdropFilter: "blur(6px)", color: "#FF5252", borderColor: "#FF525233" }}
                      ><TrashIcon /></button>
                    </div>
                  </div>
                  <div className="f-mono" style={{ fontSize: "0.6rem", color: "#3D3B52", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imageName}</div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <CrosshairIcon /> 2 · Choose Strategy
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setMethodology("smc")}
                  className="f-sans"
                  style={{
                    textAlign: "left",
                    borderRadius: 12,
                    padding: "16px 16px",
                    cursor: "pointer",
                    background: methodology === "smc" ? "#7C6AFF12" : "transparent",
                    border: `1.5px solid ${methodology === "smc" ? "#7C6AFF" : "#1A1929"}`,
                    transition: "all 0.2s",
                    color: "#E2DDD6",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: methodology === "smc" ? "#7C6AFF22" : "#13121E", color: methodology === "smc" ? "#7C6AFF" : "#3D3B52", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${methodology === "smc" ? "#7C6AFF44" : "#1F1E2A"}` }}><CandlesIcon /></div>
                    <span className="f-display" style={{ fontSize: "0.95rem", fontWeight: 600 }}>SMC</span>
                  </div>
                  <div className="f-sans" style={{ fontSize: "0.72rem", color: "#6A6480", lineHeight: 1.55 }}>Smart Money Concepts — order blocks, FVGs, liquidity sweeps & market structure.</div>
                </button>
                <button
                  onClick={() => setMethodology("ict")}
                  className="f-sans"
                  style={{
                    textAlign: "left",
                    borderRadius: 12,
                    padding: "16px 16px",
                    cursor: "pointer",
                    background: methodology === "ict" ? "#7C6AFF12" : "transparent",
                    border: `1.5px solid ${methodology === "ict" ? "#7C6AFF" : "#1A1929"}`,
                    transition: "all 0.2s",
                    color: "#E2DDD6",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: methodology === "ict" ? "#7C6AFF22" : "#13121E", color: methodology === "ict" ? "#7C6AFF" : "#3D3B52", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${methodology === "ict" ? "#7C6AFF44" : "#1F1E2A"}` }}><TargetIcon /></div>
                    <span className="f-display" style={{ fontSize: "0.95rem", fontWeight: 600 }}>ICT</span>
                  </div>
                  <div className="f-sans" style={{ fontSize: "0.72rem", color: "#6A6480", lineHeight: 1.55 }}>Inner Circle Trader — liquidity pools, PD arrays, kill zones & OTE.</div>
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldIcon /> 3 · Risk Guard <span className="f-mono" style={{ color: "#22C55E", marginLeft: "auto", fontSize: "0.58rem" }}>Max 20%</span>
              </div>

              <div className="f-sans" style={{ fontSize: "0.72rem", color: "#3D3B52", marginBottom: 8 }}>ACCOUNT BALANCE (USD)</div>
              <div style={{ position: "relative", marginBottom: 18 }}>
                <span className="f-mono" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#5A5470", fontSize: "0.85rem" }}>$</span>
                <input
                  type="number"
                  min="0"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="f-mono"
                  style={{ width: "100%", padding: "11px 14px 11px 30px", borderRadius: 10, border: "1px solid #1F1E2A", background: "#0A0A0F", color: "#E2DDD6", fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#7C6AFF66")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1F1E2A")}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span className="f-sans" style={{ fontSize: "0.72rem", color: "#3D3B52" }}>RISK PER TRADE</span>
                <span className="f-display" style={{ fontSize: "1.3rem", color: riskPercent > 20 ? "#FF5252" : "#7C6AFF", fontWeight: 600 }}>{effectiveRisk}%</span>
              </div>
              <input type="range" min="0.5" max="20" step="0.5" value={Math.min(20, riskPercent)} onChange={(e) => setRiskPercent(Number(e.target.value))} style={{ marginBottom: 6 }} />
              <div className="f-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.55rem", color: "#3D3B52", marginBottom: 14 }}>
                <span>0.5%</span>
                <span style={{ color: "#22C55E" }}>2% safe zone</span>
                <span style={{ color: "#FF5252" }}>20% hard cap</span>
              </div>

              <div style={{ borderRadius: 12, border: "1px solid #22C55E33", background: "#22C55E0D", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div className="f-sans" style={{ fontSize: "0.72rem", color: "#A09A92" }}>Worst case loss<br /><span className="f-mono" style={{ fontSize: "0.55rem", color: "#5A5470" }}>if stop loss is hit</span></div>
                <div className="f-display" style={{ fontSize: "1.35rem", color: "#22C55E", fontWeight: 700 }}>${maxLoss.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
              </div>

              {riskPercent > 20 && (
                <div className="f-mono" style={{ marginTop: 10, padding: "9px 12px", borderRadius: 8, background: "#FF525212", border: "1px solid #FF525233", color: "#FF5252", fontSize: "0.62rem", display: "flex", alignItems: "center", gap: 7 }}>
                  <LockIcon /> Capped at 20% — we will never risk more than a fifth of your account on one trade.
                </div>
              )}
            </div>

            <button className="btn-primary" style={{ width: "100%" }} disabled={!canAnalyze} onClick={analyze}>
              {analyzing ? (
                <>
                  <span className="spin" style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} />
                  Analyzing chart...
                </>
              ) : (
                <>
                  <ZapIcon /> Analyze Chart
                </>
              )}
            </button>

            {error && (
              <div className="f-mono fade-up" style={{ padding: "12px 16px", borderRadius: 12, background: "#FF525212", border: "1px solid #FF525233", color: "#FF5252", fontSize: "0.7rem", lineHeight: 1.6 }}>
                {error}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {!result && !analyzing && (
              <div className="card" style={{ padding: "36px 28px", minHeight: 380, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: "#7C6AFF12", border: "1px solid #7C6AFF33", color: "#7C6AFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><ScanIcon /></div>
                <h2 className="f-display" style={{ fontSize: "1.3rem", textAlign: "center", marginBottom: 8 }}>Ready when you are</h2>
                <p className="f-sans" style={{ fontSize: "0.85rem", color: "#6A6480", textAlign: "center", lineHeight: 1.7, maxWidth: 420, margin: "0 auto 26px" }}>
                  Your AI trade plan will appear here — entry, stop loss, take profit, key levels, and a position size that keeps your loss under the risk cap.
                </p>
                <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
                  {[
                    { n: "1", t: "Upload your TradingView screenshot" },
                    { n: "2", t: "Choose SMC or ICT methodology" },
                    { n: "3", t: "Set your risk budget (max 20%)" },
                    { n: "4", t: "Hit Analyze — levels in seconds" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
                      <div className="f-mono" style={{ width: 26, height: 26, borderRadius: 8, background: "#13121E", border: "1px solid #1F1E2A", color: "#7C6AFF", fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                      <span className="f-sans" style={{ fontSize: "0.82rem", color: "#5A5470" }}>{s.t}</span>
                    </div>
                  ))}
                </div>

                {recent.length > 0 && (
                  <div style={{ marginTop: 28, borderTop: "1px solid #13121C", paddingTop: 20 }}>
                    <div className="f-mono" style={{ fontSize: "0.58rem", color: "#3D3B52", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Recent Analyses</div>
                    <div className="space-y-2">
                      {recent.map((r, i) => (
                        <div key={i} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "#0A0A0F", border: "1px solid #1A1929" }}>
                          <span className="f-mono" style={{ fontSize: "0.7rem", fontWeight: 700, color: r.direction === "BUY" ? "#22C55E" : "#FF5252" }}>{r.direction}</span>
                          <span className="f-mono" style={{ fontSize: "0.72rem", color: "#E2DDD6", fontWeight: 600 }}>{r.instrument}</span>
                          <span className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", textTransform: "uppercase" }}>{r.methodology}</span>
                          <span className="f-mono" style={{ marginLeft: "auto", fontSize: "0.6rem", color: "#3D3B52", display: "flex", alignItems: "center", gap: 4 }}><ClockIcon />{new Date(r.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {analyzing && (
              <div className="card" style={{ padding: 24, minHeight: 380 }}>
                {imageDataUrl && (
                  <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #1A1929", marginBottom: 20 }}>
                    <img src={imageDataUrl} alt="Chart being analyzed" style={{ width: "100%", display: "block", filter: "brightness(0.7)" }} />
                    <div className="scan-line" />
                    <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(10,10,15,0.85)", border: "1px solid #7C6AFF44", borderRadius: 8, padding: "6px 12px" }}>
                      <span className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Scanning — {methodology?.toUpperCase()}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {[
                    "Reading chart structure & price axis",
                    "Identifying order blocks & fair value gaps",
                    "Locating liquidity pools & sweeps",
                    "Mapping market structure (BOS / CHoCH)",
                    "Placing sniper entry, stop loss & take profit",
                    "Calculating position size for your risk guard",
                  ].map((step, i) => (
                    <div key={i} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 10, background: "#0A0A0F", border: "1px solid #1A1929" }}>
                      <span className="pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: i < 3 ? "#7C6AFF" : "#3D3B52", flexShrink: 0 }} />
                      <span className="f-sans" style={{ fontSize: "0.8rem", color: i < 3 ? "#A09A92" : "#3D3B52" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-5 fade-up">
                {result.demo && (
                  <div className="f-mono" style={{ padding: "12px 16px", borderRadius: 12, background: "#FF950012", border: "1px solid #FF950033", color: "#FF9500", fontSize: "0.68rem", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}><ShieldIcon /></span>
                    <span><b>DEMO ANALYSIS</b> — the live AI service was unreachable, so this is a sample plan. Re-run to get a real analysis of your chart.</span>
                  </div>
                )}

                {result.riskCapApplied && (
                  <div className="f-mono" style={{ padding: "12px 16px", borderRadius: 12, background: "#FF525212", border: "1px solid #FF525233", color: "#FF5252", fontSize: "0.68rem", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}><LockIcon /></span>
                    <span><b>RISK CAPPED</b> — you requested more than 20% risk. We clamped it to 20% so a single trade can never wipe out more than a fifth of your account.</span>
                  </div>
                )}

                <div className="card" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: buy ? "#22C55E12" : "#FF525212", border: `1px solid ${buy ? "#22C55E44" : "#FF525244"}`, color: buy ? "#22C55E" : "#FF5252", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {buy ? <ArrowUp /> : <ArrowDown />}
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="f-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: buy ? "#22C55E" : "#FF5252" }}>{result.direction}</span>
                        <span className="f-mono" style={{ fontSize: "1rem", fontWeight: 600, color: "#E2DDD6" }}>{result.instrument}</span>
                        <span className="nav-pill" style={{ color: "#7C6AFF", background: "#7C6AFF12", border: "1px solid #7C6AFF33" }}>{result.timeframe}</span>
                        <span className="nav-pill" style={{ color: "#A855F7", background: "#A855F712", border: "1px solid #A855F733", textTransform: "uppercase" }}>{result.methodology}</span>
                      </div>
                      <div className="f-mono" style={{ fontSize: "0.62rem", color: "#3D3B52", marginTop: 6 }}>SNIPER SETUP · AI {result.demo ? "DEMO" : "ANALYSIS"}</div>
                    </div>
                    <ConfidenceRing value={result.confidence} />
                  </div>

                  {result.summary && (
                    <p className="f-sans" style={{ fontSize: "0.82rem", color: "#6A6480", lineHeight: 1.7, marginTop: 18, borderTop: "1px solid #13121C", paddingTop: 16 }}>{result.summary}</p>
                  )}
                </div>

                {imageDataUrl && (
                  <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                    <img src={imageDataUrl} alt="Analyzed chart" style={{ width: "100%", display: "block" }} />
                    <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid #1A1929", background: "#0A0A0F" }}>
                      <span className="nav-pill" style={{ color: buy ? "#22C55E" : "#FF5252", background: buy ? "#22C55E10" : "#FF525210", border: `1px solid ${buy ? "#22C55E33" : "#FF525233"}` }}>{result.direction}</span>
                      <span className="f-mono" style={{ fontSize: "0.62rem", color: "#3D3B52" }}>{result.instrument} · {result.timeframe} · {imageName}</span>
                    </div>
                  </div>
                )}

                <div className="card" style={{ padding: 22 }}>
                  <div className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Trade Plan</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div style={{ borderRadius: 12, border: "1px solid #1A1929", background: "#0A0A0F", padding: "14px 16px" }}>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#3D3B52", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Sniper Entry</div>
                      <div className="f-display" style={{ fontSize: "1.15rem", color: "#E2DDD6", fontWeight: 600 }}>{fmt(result.sniperEntry, result.instrument)}</div>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#7C6AFF", marginTop: 4 }}>precise limit</div>
                    </div>
                    <div style={{ borderRadius: 12, border: "1px solid #1A1929", background: "#0A0A0F", padding: "14px 16px" }}>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#3D3B52", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Entry</div>
                      <div className="f-display" style={{ fontSize: "1.15rem", color: "#E2DDD6", fontWeight: 600 }}>{fmt(result.entry, result.instrument)}</div>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#3D3B52", marginTop: 4 }}>activation</div>
                    </div>
                    <div style={{ borderRadius: 12, border: "1px solid #FF525233", background: "#FF52520A", padding: "14px 16px" }}>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#FF5252", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Stop Loss</div>
                      <div className="f-display" style={{ fontSize: "1.15rem", color: "#FF5252", fontWeight: 600 }}>{fmt(result.stopLoss, result.instrument)}</div>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#FF525288", marginTop: 4 }}>risk {riskDistance.toFixed(dec)}</div>
                    </div>
                    <div style={{ borderRadius: 12, border: "1px solid #22C55E33", background: "#22C55E0A", padding: "14px 16px" }}>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#22C55E", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Take Profit</div>
                      <div className="f-display" style={{ fontSize: "1.15rem", color: "#22C55E", fontWeight: 600 }}>{fmt(result.takeProfit, result.instrument)}</div>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#22C55E88", marginTop: 4 }}>reward {rewardDistance.toFixed(dec)}</div>
                    </div>
                    <div style={{ borderRadius: 12, border: "1px solid #7C6AFF33", background: "#7C6AFF0A", padding: "14px 16px" }}>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#7C6AFF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Risk : Reward</div>
                      <div className="f-display" style={{ fontSize: "1.15rem", color: "#7C6AFF", fontWeight: 600 }}>1 : {result.riskReward}</div>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#3D3B52", marginTop: 4 }}>for every 1 at risk</div>
                    </div>
                    <div style={{ borderRadius: 12, border: "1px solid #FF950033", background: "#FF95000A", padding: "14px 16px" }}>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#FF9500", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Confidence</div>
                      <div className="f-display" style={{ fontSize: "1.15rem", color: confidenceColor, fontWeight: 600 }}>{result.confidence}%</div>
                      <div className="f-mono" style={{ fontSize: "0.55rem", color: "#3D3B52", marginTop: 4 }}>{result.confidence >= 75 ? "sniper quality" : result.confidence >= 55 ? "decent — be careful" : "weak — consider waiting"}</div>
                    </div>
                  </div>
                </div>

                {result.positionSize && (
                  <div className="card" style={{ padding: 22, borderColor: result.positionSize.supported ? "#22C55E33" : "#FF950033" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: "#22C55E12", border: "1px solid #22C55E44", color: "#22C55E", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldIcon /></div>
                      <div style={{ flex: 1 }}>
                        <div className="f-sans" style={{ fontSize: "0.92rem", fontWeight: 600, color: "#E2DDD6" }}>Risk Guard — you can&apos;t lose more than {result.positionSize.riskPercent}%</div>
                        <div className="f-mono" style={{ fontSize: "0.58rem", color: "#3D3B52", marginTop: 3 }}>POSITION SIZE CALCULATED FROM YOUR RISK BUDGET</div>
                      </div>
                      {result.positionSize.supported && (
                        <span className="nav-pill" style={{ color: "#22C55E", background: "#22C55E10", border: "1px solid #22C55E33" }}>
                          <LockIcon /> Protected
                        </span>
                      )}
                    </div>

                    {result.positionSize.supported ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
                          <div style={{ borderRadius: 12, border: "1px solid #1A1929", background: "#0A0A0F", padding: "12px 14px" }}>
                            <div className="f-mono" style={{ fontSize: "0.52rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 4 }}>Account</div>
                            <div className="f-mono" style={{ fontSize: "0.95rem", color: "#E2DDD6", fontWeight: 600 }}>${balance.toLocaleString("en-US")}</div>
                          </div>
                          <div style={{ borderRadius: 12, border: "1px solid #1A1929", background: "#0A0A0F", padding: "12px 14px" }}>
                            <div className="f-mono" style={{ fontSize: "0.52rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 4 }}>Risk Budget</div>
                            <div className="f-mono" style={{ fontSize: "0.95rem", color: "#7C6AFF", fontWeight: 600 }}>${result.positionSize.riskAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                            <div className="f-mono" style={{ fontSize: "0.52rem", color: "#3D3B52" }}>{result.positionSize.riskPercent}% of account</div>
                          </div>
                          <div style={{ borderRadius: 12, border: "1px solid #22C55E44", background: "#22C55E0D", padding: "12px 14px" }}>
                            <div className="f-mono" style={{ fontSize: "0.52rem", color: "#22C55E", textTransform: "uppercase", marginBottom: 4 }}>Position Size</div>
                            <div className="f-mono" style={{ fontSize: "1.15rem", color: "#22C55E", fontWeight: 700 }}>{result.positionSize.lots.toFixed(2)} lots</div>
                            <div className="f-mono" style={{ fontSize: "0.52rem", color: "#22C55E88" }}>stop distance {result.positionSize.pipLabel}</div>
                          </div>
                          <div style={{ borderRadius: 12, border: "1px solid #1A1929", background: "#0A0A0F", padding: "12px 14px" }}>
                            <div className="f-mono" style={{ fontSize: "0.52rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 4 }}>Worst Case Loss</div>
                            <div className="f-mono" style={{ fontSize: "0.95rem", color: result.positionSize.actualPercent <= 20 ? "#22C55E" : "#FF5252", fontWeight: 600 }}>${result.positionSize.actualLoss.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                            <div className="f-mono" style={{ fontSize: "0.52rem", color: "#3D3B52" }}>{result.positionSize.actualPercent.toFixed(2)}% of account</div>
                          </div>
                        </div>
                        <div className="f-mono" style={{ fontSize: "0.62rem", color: "#5A5470", lineHeight: 1.7 }}>
                          {result.positionSize.note} <span style={{ color: "#22C55E" }}>This size is capped so a stop-loss hit costs at most {result.positionSize.riskPercent}% of your account.</span>
                        </div>
                      </>
                    ) : (
                      <div className="f-mono" style={{ fontSize: "0.68rem", color: "#FF9500", lineHeight: 1.7, padding: "12px 14px", borderRadius: 10, background: "#FF95000D", border: "1px solid #FF950033" }}>
                        Position sizing isn&apos;t auto-available for <b>{result.positionSize.instrument}</b>. Manual rule: the most you risk on this trade is ${result.positionSize.riskAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ({result.positionSize.riskPercent}% of your account) — size your contract so a stop-loss hit never exceeds that.
                      </div>
                    )}
                  </div>
                )}

                {result.keyLevels.length > 0 && (
                  <div className="card" style={{ padding: 22 }}>
                    <div className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Key Levels Identified</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {result.keyLevels.map((lvl, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 9, background: "#0A0A0F", border: "1px solid #1A1929" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: LEVEL_COLORS[lvl.type] || "#E2DDD6", flexShrink: 0 }} />
                          <span className="f-mono" style={{ fontSize: "0.62rem", color: "#5A5470" }}>{lvl.label}:</span>
                          <span className="f-mono" style={{ fontSize: "0.68rem", color: "#E2DDD6", fontWeight: 600 }}>{lvl.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card" style={{ padding: 22 }}>
                  <div className="f-mono" style={{ fontSize: "0.6rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>The Setup, Step by Step</div>
                  {result.reasoning.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", alignItems: "flex-start" }}>
                      <div className="f-mono" style={{ width: 24, height: 24, borderRadius: 8, background: "#13121E", border: "1px solid #1F1E2A", color: "#7C6AFF", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                      <p className="f-sans" style={{ fontSize: "0.8rem", color: "#A09A92", lineHeight: 1.65 }}>{step}</p>
                    </div>
                  ))}
                </div>

                {result.invalidation && (
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "#FF52520D", border: "1px solid #FF525233", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ color: "#FF5252", flexShrink: 0, marginTop: 1 }}><CloseIcon /></span>
                    <div>
                      <div className="f-mono" style={{ fontSize: "0.58rem", color: "#FF5252", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Invalidation</div>
                      <p className="f-sans" style={{ fontSize: "0.8rem", color: "#A09A92", lineHeight: 1.6 }}>{result.invalidation}</p>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn-primary" onClick={reset} style={{ flex: 1, minWidth: 200 }}>
                    <RefreshIcon /> Analyze Another Chart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #13121C", padding: "26px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <p className="f-mono" style={{ fontSize: "0.62rem", color: "#2D2B3C", lineHeight: 1.7, maxWidth: 900 }}>
            Risk Warning: Trading forex and CFDs carries a high level of risk. The AI analysis and position sizing are educational tools, not financial advice. Levels are read from your screenshot and may be approximate — always confirm with live prices before entering. The 20% cap is a hard limit on position sizing, not a guarantee against larger losses from slippage, gaps, or human error. Never trade money you cannot afford to lose.
          </p>
          <div className="f-mono" style={{ fontSize: "0.62rem", color: "#1F1E2A", marginTop: 14 }}>© 2026 HTRADES · Sniper Entry AI</div>
        </div>
      </footer>
    </div>
  );
}
