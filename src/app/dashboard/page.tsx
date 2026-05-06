"use client";
import { useState, useEffect, useCallback, useRef } from "react";

type Direction = "BUY" | "SELL";
type Status = "active" | "expired" | "hit_tp" | "hit_sl";
type Source = "tradingview" | "forexfactory" | "youtube" | "telegram" | "ai_fallback";
type Outcome = "pending" | "hit_tp" | "hit_sl" | "expired" | "manual_close";

interface Signal {
  _id: string;
  source: Source;
  pair: string;
  direction: Direction;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  slPips: number;
  tpPips: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
  sourceUrl: string;
  sourceAuthor: string;
  status: Status;
  outcome: Outcome;
  resultPips: number;
  createdAt: string;
  trustScore: number;
}

interface NewsItem {
  _id: string;
  pair: string;
  news: string;
  impact: string;
  direction: Direction | "WAIT";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  slPips: number;
  tpPips: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

interface MarketAnalysis {
  pair: string;
  structure: string;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  keyLevels: { label: string; price: string; type: string }[];
  reasoning: string;
  setup: { direction: Direction | null; entry: string; sl: string; tp: string; rr: string } | null;
}

const MONITORED_PAIRS = ["XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"];

const sourceColors: Record<Source, string> = {
  tradingview: "#7C6AFF",
  forexfactory: "#FF9500",
  youtube: "#FF0000",
  telegram: "#229ED9",
  ai_fallback: "#7C6AFF",
};

const sourceLabels: Record<Source, string> = {
  tradingview: "TradingView",
  forexfactory: "Forex Factory",
  youtube: "YouTube",
  telegram: "Telegram",
  ai_fallback: "AI Analysis",
};

function formatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function calcPips(pair: string, priceDiff: number): number {
  if (pair === "XAU/USD") return priceDiff * 10;
  if (pair.includes("JPY")) return priceDiff * 100;
  return priceDiff * 10000;
}

function formatPips(pips: number, pair: string): string {
  if (pair === "XAU/USD") return `$${Math.abs(pips).toFixed(1)}`;
  return `${Math.abs(pips).toFixed(1)} pips`;
}

function getTVSymbol(pair: string): string {
  const map: Record<string, string> = {
    "XAU/USD": "OANDA:XAUUSD",
    "EUR/USD": "FX:EURUSD",
    "GBP/USD": "FX:GBPUSD",
    "USD/JPY": "FX:USDJPY",
    "AUD/USD": "FX:AUDUSD",
    "USD/CAD": "FX:USDCAD",
    "USD/CHF": "FX:USDCHF",
    "NZD/USD": "FX:NZDUSD",
  };
  return map[pair] || "FX:EURUSD";
}

const ArrowUp = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ArrowDown = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V12M7 12L3 8M7 12L11 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ExternalLinkIcon = () => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 2H3C2.448 2 2 2.448 2 3V9C2 9.552 2.448 10 3 10H9C9.552 10 10 9.552 10 9V7M7 2H10M10 2V5M10 2L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ChartIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3V15H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11L10 8L13 10L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const SignalIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 2L6 9H10L8 16L15 9H11L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const NewsIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 6H12M6 9H12M6 12H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>);
const SetupsIcon = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 2L4 9H8L6 16L15 9H11L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 16H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);
const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>);
const MenuIcon = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>);
const ShieldIcon = () => (<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1L2 3.5V7C2 10 4.5 12.5 7 13C9.5 12.5 12 10 12 7V3.5L7 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const XMarkIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>);
const ClockIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4V7L9 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);
const TargetIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 1V3M7 11V13M1 7H3M11 7H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>);

function SignalCard({ sig }: { sig: Signal }) {
  const slPips = sig.slPips || calcPips(sig.pair, Math.abs(sig.entry - sig.stopLoss));
  const tpPips = sig.tpPips || calcPips(sig.pair, Math.abs(sig.takeProfit - sig.entry));
  const dec = sig.pair === "XAU/USD" ? 2 : sig.pair.includes("JPY") ? 3 : 5;

  return (
    <div className="signal-card fade-in" data-trust={sig.trustScore >= 70 ? "high" : sig.trustScore >= 50 ? "mid" : "low"}>
      <div className="signal-header">
        <div className="signal-pair-section">
          <span className="signal-pair" style={{ color: sig.pair === "XAU/USD" ? "#FFD700" : "#E2DDD6" }}>{sig.pair}</span>
          <span className={`signal-direction ${sig.direction === "BUY" ? "dir-buy" : "dir-sell"}`}>
            {sig.direction === "BUY" ? <ArrowUp /> : <ArrowDown />}{sig.direction}
          </span>
        </div>
        <div className="signal-meta">
          <span className="signal-trust">
            <ShieldIcon />
            {sig.trustScore}%
          </span>
          <span className="signal-time">{formatTime(sig.createdAt)}</span>
        </div>
      </div>

      <div className="signal-prices">
        <div className="price-block">
          <span className="price-label">Entry</span>
          <span className="price-value">{sig.entry.toFixed(dec)}</span>
        </div>
        <div className="price-block price-sl">
          <span className="price-label">Stop Loss</span>
          <span className="price-value">{sig.stopLoss.toFixed(dec)}</span>
          <span className="price-pips">{formatPips(slPips, sig.pair)}</span>
        </div>
        <div className="price-block price-tp">
          <span className="price-label">Take Profit</span>
          <span className="price-value">{sig.takeProfit.toFixed(dec)}</span>
          <span className="price-pips">{formatPips(tpPips, sig.pair)}</span>
        </div>
        <div className="price-block">
          <span className="price-label">R:R</span>
          <span className="price-value price-rr">1 : {sig.riskReward}</span>
        </div>
      </div>

      <div className="signal-reasoning">
        {sig.reasoning}
      </div>

      <div className="signal-footer">
        <span className="signal-source" style={{ borderColor: `${sourceColors[sig.source]}44`, color: sourceColors[sig.source], background: `${sourceColors[sig.source]}11` }}>{sourceLabels[sig.source]}</span>
        {sig.sourceAuthor && <span className="signal-author">by {sig.sourceAuthor}</span>}
        {sig.sourceUrl && (
          <a href={sig.sourceUrl} target="_blank" rel="noopener noreferrer" className="signal-link"><ExternalLinkIcon /></a>
        )}
      </div>
    </div>
  );
}

function SetupCard({ setup }: { setup: Signal }) {
  const isWon = setup.outcome === "hit_tp";
  const isLost = setup.outcome === "hit_sl";
  const isExpired = setup.outcome === "expired" || setup.status === "expired";
  const isRunning = setup.outcome === "pending";
  const dec = setup.pair === "XAU/USD" ? 2 : setup.pair.includes("JPY") ? 3 : 5;

  const resultPips = setup.resultPips || 0;
  const hasResult = resultPips !== 0 && !isNaN(resultPips);

  return (
    <div className="setup-card fade-in" data-outcome={isWon ? "won" : isLost ? "lost" : isExpired ? "expired" : "running"}>
      <div className="setup-header">
        <div className="setup-pair-section">
          <span className="setup-pair">{setup.pair}</span>
          <span className={`setup-direction ${setup.direction === "BUY" ? "dir-buy" : "dir-sell"}`}>{setup.direction}</span>
        </div>
        <div className="setup-outcome">
          {isWon && <span className="outcome-badge won"><CheckIcon /> Won</span>}
          {isLost && <span className="outcome-badge lost"><XMarkIcon /> Lost</span>}
          {isExpired && <span className="outcome-badge expired"><ClockIcon /> Expired</span>}
          {!isWon && !isLost && !isExpired && <span className="outcome-badge running"><ClockIcon /> Running</span>}
        </div>
      </div>

      <div className="setup-prices">
        <span>Entry: <b>{setup.entry.toFixed(dec)}</b></span>
        <span>SL: <b style={{ color: "#FF5252" }}>{setup.stopLoss.toFixed(dec)}</b></span>
        <span>TP: <b style={{ color: "#22C55E" }}>{setup.takeProfit.toFixed(dec)}</b></span>
        <span style={{ color: "#7C6AFF" }}>R:R 1:{setup.riskReward}</span>
      </div>

      {hasResult && (
        <div className="setup-result" style={{ color: resultPips > 0 ? "#22C55E" : "#FF5252" }}>
          {resultPips > 0 ? "+" : ""}{formatPips(resultPips, setup.pair)}
        </div>
      )}

      <div className="setup-footer">
        <span className="setup-source" style={{ color: sourceColors[setup.source] }}>{sourceLabels[setup.source]}</span>
        <span className="setup-time">{formatTime(setup.createdAt)}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [setups, setSetups] = useState<Signal[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("signals");
  const [selectedMarket, setSelectedMarket] = useState("XAU/USD");
  const [chartLoading, setChartLoading] = useState(true);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const tvScriptLoadedRef = useRef(false);
  const scrapingRef = useRef(false);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/signals?limit=100");
      const data = await res.json();
      if (data.signals) {
        setSignals(data.signals);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error("[HTRADES] fetchSignals error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSetups = useCallback(async () => {
    try {
      const res = await fetch("/api/setups?limit=200");
      const data = await res.json();
      if (data.setups) setSetups(data.setups);
    } catch (e) {
      console.error("[HTRADES] fetchSetups error:", e);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data.analyses || []);
    } catch (e) {
      console.error("[HTRADES] fetchNews error:", e);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const triggerScrape = useCallback(async () => {
    if (scrapingRef.current) return;
    scrapingRef.current = true;
    try {
      const res = await fetch("/api/trigger-scrape", { method: "POST" });
      if (!res.ok) {
        console.error("[HTRADES] triggerScrape failed:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log("[HTRADES] Scrape complete:", data.totalFound, "signals found,", data.saved, "saved, fallback:", data.fallbackUsed);
      if (data.errors?.length > 0) {
        console.warn("[HTRADES] Scrape errors:", data.errors);
      }
      await fetchSignals();
    } catch (e) {
      console.error("[HTRADES] triggerScrape error:", e);
    } finally {
      scrapingRef.current = false;
    }
  }, [fetchSignals]);

  const fetchMarketAnalysis = useCallback(async (pair: string) => {
    setAnalysisLoading(true);
    setMarketAnalysis(null);
    try {
      const res = await fetch(`/api/market-analysis?pair=${encodeURIComponent(pair)}`);
      const data = await res.json();
      if (data.analysis) setMarketAnalysis(data.analysis);
    } catch (e) {
      console.error("[HTRADES] fetchMarketAnalysis error:", e);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    fetchSetups();
    fetchNews();
    triggerScrape();
    const signalInterval = setInterval(fetchSignals, 5000);
    const setupsInterval = setInterval(fetchSetups, 30000);
    const newsInterval = setInterval(fetchNews, 60000);
    const scrapeInterval = setInterval(() => triggerScrape(), 120000);
    const priceInterval = setInterval(async () => {
      try { await fetch("/api/check-prices"); } catch (e) { console.error("[HTRADES] check-prices error:", e); }
    }, 30000);
    return () => {
      clearInterval(signalInterval);
      clearInterval(setupsInterval);
      clearInterval(newsInterval);
      clearInterval(scrapeInterval);
      clearInterval(priceInterval);
    };
  }, [fetchSignals, fetchSetups, fetchNews, triggerScrape]);

  useEffect(() => {
    if (activePage === "markets") {
      setChartLoading(true);
      loadTradingViewChart(selectedMarket);
      fetchMarketAnalysis(selectedMarket);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, selectedMarket]);

  const loadTradingViewChart = (pair: string) => {
    const container = document.getElementById("tv-chart-container");
    if (!container) return;
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><div class="pulse" style="width:40px;height:40px;border:3px solid #7C6AFF;border-radius:50%;border-top-color:transparent;"></div></div>';
    setChartLoading(true);
    const loadWidget = () => {
      if ((window as any).TradingView) {
        container.innerHTML = "";
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: getTVSymbol(pair),
          interval: "60",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0A0A0F",
          enable_publishing: false,
          allow_symbol_change: true,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: "tv-chart-container",
          backgroundColor: "#0A0A0F",
          gridColor: "#1A1929",
        });
        setChartLoading(false);
      } else {
        setTimeout(loadWidget, 500);
      }
    };
    if (!tvScriptLoadedRef.current) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = loadWidget;
      script.onerror = () => {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:gap:8px;"><span class="f-mono" style="color:#3D3B52;">Chart failed to load. Refresh page.</span></div>';
        setChartLoading(false);
      };
      document.head.appendChild(script);
      tvScriptLoadedRef.current = true;
    } else {
      loadWidget();
    }
  };

  const buyCount = signals.filter(s => s.direction === "BUY").length;
  const sellCount = signals.filter(s => s.direction === "SELL").length;
  const avgTrust = signals.length > 0 ? Math.round(signals.reduce((a, b) => a + b.trustScore, 0) / signals.length) : 0;
  const highTrust = signals.filter(s => s.trustScore >= 70).length;
  const runningSetups = setups.filter(s => s.outcome === "pending");
  const endedSetups = setups.filter(s => s.outcome === "hit_tp" || s.outcome === "hit_sl");
  const succeededCount = endedSetups.filter(s => s.outcome === "hit_tp").length;
  const failedCount = endedSetups.filter(s => s.outcome === "hit_sl").length;
  const runningCount = runningSetups.length;
  const winRate = (succeededCount + failedCount) > 0 ? Math.round((succeededCount / (succeededCount + failedCount)) * 100) : 0;

  const navItems = [
    { id: "signals", label: "Trending Signals", icon: <SignalIcon /> },
    { id: "markets", label: "Market Analysis", icon: <ChartIcon /> },
    { id: "setups", label: "Setups", icon: <SetupsIcon /> },
    { id: "ended", label: "Ended Setups", icon: <ClockIcon /> },
    { id: "news", label: "News Impact", icon: <NewsIcon /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#0A0A0F] text-[#E2DDD6]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .f-sans { font-family: 'Inter', -apple-system, sans-serif; }
        .f-mono { font-family: 'JetBrains Mono', monospace; }
        .card { background: #0F0E18; border: 1px solid #1A1929; border-radius: 12px; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .nav-item { transition: all 0.15s; cursor: pointer; border-radius: 8px; display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
        .nav-item:hover { background: #1A1929; }
        .nav-item.active { background: #7C6AFF18; color: #7C6AFF; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #1A1929; border-radius: 4px; }

        .signal-card { background: #0F0E18; border: 1px solid #1A1929; border-radius: 12px; overflow: hidden; transition: border-color 0.15s; }
        .signal-card:hover { border-color: #7C6AFF33; }
        .signal-card[data-trust="high"] { border-left: 3px solid #22C55E; }
        .signal-card[data-trust="mid"] { border-left: 3px solid #FF9500; }
        .signal-card[data-trust="low"] { border-left: 3px solid #FF5252; }
        .signal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 12px; }
        .signal-pair-section { display: flex; align-items: center; gap: 10px; }
        .signal-pair { font-family: 'Inter', sans-serif; font-size: 1.15rem; font-weight: 700; }
        .signal-direction { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; }
        .dir-buy { background: #22C55E18; color: #22C55E; }
        .dir-sell { background: #FF525218; color: #FF5252; }
        .signal-meta { display: flex; align-items: center; gap: 12px; }
        .signal-trust { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 600; color: #E2DDD6; display: flex; align-items: center; gap: 4px; }
        .signal-time { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: #3D3B52; }
        .signal-prices { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0; margin: 0 20px; border-top: 1px solid #1A1929; border-bottom: 1px solid #1A1929; }
        .price-block { padding: 12px 16px; border-right: 1px solid #1A1929; }
        .price-block:last-child { border-right: none; }
        .price-label { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #3D3B52; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 4px; }
        .price-value { font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; font-weight: 600; color: #E2DDD6; display: block; }
        .price-pips { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; display: block; margin-top: 2px; }
        .price-sl .price-value { color: #FF5252; }
        .price-sl .price-pips { color: #FF525288; }
        .price-tp .price-value { color: #22C55E; }
        .price-tp .price-pips { color: #22C55E88; }
        .price-rr { color: #7C6AFF !important; }
        .signal-reasoning { margin: 12px 20px; padding: 10px 14px; background: #0A0A0F; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #6A6480; line-height: 1.6; }
        .signal-footer { display: flex; align-items: center; gap: 10px; padding: 10px 20px 14px; border-top: 1px solid #1A1929; }
        .signal-source { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; padding: 3px 8px; border-radius: 4px; border: 1px solid; font-weight: 500; }
        .signal-author { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: #4A4862; }
        .signal-link { margin-left: auto; color: #3D3B52; transition: color 0.15s; }
        .signal-link:hover { color: #7C6AFF; }

        .news-card { background: #0F0E18; border: 1px solid #1A1929; border-radius: 12px; overflow: hidden; }
        .news-card[data-impact="high"] { border-left: 3px solid #FF5252; }
        .news-card[data-impact="medium"] { border-left: 3px solid #FF9500; }
        .news-card[data-impact="low"] { border-left: 3px solid #3D3B52; }
        .news-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px 10px; }
        .news-pair-section { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .news-pair { font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 700; }
        .news-impact-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; font-weight: 600; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; }
        .impact-high { background: #FF525218; color: #FF5252; }
        .impact-medium { background: #FF950018; color: #FF9500; }
        .impact-bullish { background: #22C55E18; color: #22C55E; }
        .impact-bearish { background: #FF525218; color: #FF5252; }
        .impact-neutral { background: #3D3B5218; color: #3D3B52; }
        .news-time { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #3D3B52; }
        .news-impact-label { margin: 0 18px 10px; padding: 8px 12px; background: #0A0A0F; border-radius: 6px; }
        .impact-text { font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 500; }
        .impact-text.bullish { color: #22C55E; }
        .impact-text.bearish { color: #FF5252; }
        .impact-text.neutral { color: #3D3B52; }
        .news-setup-row { display: flex; gap: 16px; padding: 0 18px 10px; flex-wrap: wrap; }
        .news-setup-item { display: flex; flex-direction: column; gap: 2px; }
        .news-setup-item span { font-family: 'JetBrains Mono', monospace; font-size: 0.5rem; color: #3D3B52; text-transform: uppercase; }
        .news-setup-item b { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; }
        .news-reasoning { margin: 0 18px 10px; padding: 10px 14px; background: #0A0A0F; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #6A6480; line-height: 1.6; }
        .news-footer { padding: 8px 18px 12px; border-top: 1px solid #1A1929; font-family: 'JetBrains Mono', monospace; font-size: 0.52rem; color: #3D3B52; }

        .setup-card { background: #0F0E18; border: 1px solid #1A1929; border-radius: 10px; overflow: hidden; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .setup-card[data-outcome="won"] { border-left: 3px solid #22C55E; }
        .setup-card[data-outcome="lost"] { border-left: 3px solid #FF5252; }
        .setup-card[data-outcome="running"] { border-left: 3px solid #7C6AFF; }
        .setup-card[data-outcome="expired"] { border-left: 3px solid #3D3B52; }
        .setup-pair-section { display: flex; align-items: center; gap: 8px; }
        .setup-pair { font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; }
        .outcome-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 4px; }
        .outcome-badge.won { background: #22C55E18; color: #22C55E; }
        .outcome-badge.lost { background: #FF525218; color: #FF5252; }
        .outcome-badge.running { background: #7C6AFF18; color: #7C6AFF; }
        .outcome-badge.expired { background: #3D3B5218; color: #3D3B52; }
        .setup-prices { display: flex; align-items: center; gap: 16px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #5A5470; }
        .setup-result { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700; }
        .setup-footer { display: flex; align-items: center; gap: 12px; }
        .setup-source { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; font-weight: 500; }
        .setup-time { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #3D3B52; }

        .stat-card { background: #0F0E18; border: 1px solid #1A1929; border-radius: 12px; padding: 16px 20px; }
        .stat-label { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #3D3B52; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .stat-value { font-family: 'Inter', sans-serif; font-size: 1.5rem; font-weight: 700; }
      `}</style>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:sticky top-0 left-0 h-screen z-50 md:z-auto w-60 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`} style={{ background: "#0F0E18", borderRight: "1px solid #1A1929" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1A1929" }}>
          <div className="f-sans" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#E2DDD6" }}>H<span style={{ color: "#7C6AFF" }}>TRADES</span></div>
          <button className="md:hidden" style={{ color: "#5A5470", background: "none", border: "none", cursor: "pointer" }} onClick={() => setSidebarOpen(false)}><CloseIcon /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <div key={item.id} className={`nav-item f-sans ${activePage === item.id ? "active" : ""}`} style={{ color: activePage === item.id ? "#7C6AFF" : "#5A5470", fontSize: "0.82rem", fontWeight: 500 }} onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}>
              {item.icon}{item.label}
            </div>
          ))}
        </nav>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #1A1929" }}>
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="pulse" style={{ width: 6, height: 6, background: "#22C55E", borderRadius: "50%" }} />
              <span className="f-mono" style={{ fontSize: "0.55rem", color: "#22C55E", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
            <div className="f-mono" style={{ fontSize: "0.55rem", color: "#3D3B52" }}>
              {lastUpdate ? `Updated ${formatTime(lastUpdate.toISOString())}` : "Waiting..."}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="f-sans flex items-center gap-4 px-4 md:px-6 py-3" style={{ borderBottom: "1px solid #13121C", position: "sticky", top: 0, zIndex: 30, background: "rgba(10,10,15,0.92)", backdropFilter: "blur(14px)" }}>
          <button className="md:hidden" style={{ color: "#5A5470", background: "none", border: "none", cursor: "pointer" }} onClick={() => setSidebarOpen(true)}><MenuIcon /></button>
          <div className="f-sans" style={{ fontSize: "0.95rem", fontWeight: 600, color: "#E2DDD6" }}>
            {activePage === "signals" ? "Trending Signals" : activePage === "setups" ? "Setups" : activePage === "ended" ? "Ended Setups" : activePage === "news" ? "News Impact" : "Market Analysis"}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="pulse" style={{ width: 6, height: 6, background: "#22C55E", borderRadius: "50%" }} />
              <span className="f-mono" style={{ fontSize: "0.55rem", color: "#3D3B52", letterSpacing: "0.05em" }}>REAL-TIME</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin">

          {activePage === "signals" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="stat-card"><div className="stat-label">Active Buy</div><div className="stat-value" style={{ color: "#22C55E" }}>{buyCount}</div></div>
                <div className="stat-card"><div className="stat-label">Active Sell</div><div className="stat-value" style={{ color: "#FF5252" }}>{sellCount}</div></div>
                <div className="stat-card"><div className="stat-label">Avg Trust</div><div className="stat-value" style={{ color: "#7C6AFF" }}>{avgTrust}%</div></div>
                <div className="stat-card"><div className="stat-label">High Trust</div><div className="stat-value" style={{ color: "#22C55E" }}>{highTrust}</div></div>
              </div>
              {signals.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="pulse mx-auto mb-4" style={{ width: 24, height: 24, border: "2px solid #7C6AFF", borderRadius: "50%", borderTopColor: "transparent" }} />
                  <div className="f-mono" style={{ color: "#3D3B52", fontSize: "0.8rem", marginBottom: 6 }}>Scanning for sniper entries...</div>
                  <div className="f-mono" style={{ color: "#2D2B3C", fontSize: "0.65rem" }}>Auto-scrapes every 2 minutes</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {signals.map(sig => (
                    <SignalCard key={sig._id} sig={sig} />
                  ))}
                </div>
              )}
            </>
          )}

          {activePage === "setups" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <div className="stat-card"><div className="stat-label">Running</div><div className="stat-value" style={{ color: "#7C6AFF" }}>{runningCount}</div></div>
                <div className="stat-card"><div className="stat-label">Won</div><div className="stat-value" style={{ color: "#22C55E" }}>{succeededCount}</div></div>
                <div className="stat-card"><div className="stat-label">Lost</div><div className="stat-value" style={{ color: "#FF5252" }}>{failedCount}</div></div>
              </div>
              {runningSetups.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="f-mono" style={{ color: "#3D3B52", fontSize: "0.82rem" }}>No running setups</div>
                  <div className="f-mono" style={{ color: "#2D2B3C", fontSize: "0.65rem", marginTop: 4 }}>New setups appear here when signals are active</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {runningSetups.map(setup => (
                    <SetupCard key={setup._id} setup={setup} />
                  ))}
                </div>
              )}
            </>
          )}

          {activePage === "ended" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <div className="stat-card"><div className="stat-label">Total Ended</div><div className="stat-value" style={{ color: "#E2DDD6" }}>{endedSetups.length}</div></div>
                <div className="stat-card"><div className="stat-label">Won</div><div className="stat-value" style={{ color: "#22C55E" }}>{succeededCount}</div></div>
                <div className="stat-card"><div className="stat-label">Win Rate</div><div className="stat-value" style={{ color: "#7C6AFF" }}>{winRate}%</div></div>
              </div>
              {endedSetups.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="f-mono" style={{ color: "#3D3B52", fontSize: "0.82rem" }}>No ended setups yet</div>
                  <div className="f-mono" style={{ color: "#2D2B3C", fontSize: "0.65rem", marginTop: 4 }}>Completed trades will appear here</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {endedSetups.map(setup => (
                    <SetupCard key={setup._id} setup={setup} />
                  ))}
                </div>
              )}
            </>
          )}

          {activePage === "news" && (
            <>
              {newsLoading && news.length === 0 ? (
                <div className="card p-16 text-center"><div className="pulse mx-auto mb-4" style={{ width: 24, height: 24, border: "2px solid #7C6AFF", borderRadius: "50%", borderTopColor: "transparent" }} /><div className="f-mono" style={{ color: "#3D3B52", fontSize: "0.8rem", marginTop: 8 }}>Loading economic calendar...</div></div>
              ) : news.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="pulse mx-auto mb-4" style={{ width: 24, height: 24, border: "2px solid #7C6AFF", borderRadius: "50%", borderTopColor: "transparent" }} />
                  <div className="f-mono" style={{ color: "#3D3B52", fontSize: "0.82rem", marginBottom: 4 }}>No events found</div>
                  <div className="f-mono" style={{ color: "#2D2B3C", fontSize: "0.65rem" }}>Check back soon for new economic events</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {news.map((n, i) => (
                    <div key={n._id || i} className="news-card fade-in" data-impact={n.impact}>
                      <div className="news-header">
                        <div className="news-pair-section">
                          <span className="news-pair">{n.pair}</span>
                          <span className={`news-impact-badge impact-${n.impact}`}>{n.impact === "high" ? "HIGH" : n.impact === "medium" ? "MEDIUM" : "LOW"}</span>
                          {n.direction === "BUY" && <span className="news-impact-badge impact-bullish"><ArrowUp /> Bullish Impact</span>}
                          {n.direction === "SELL" && <span className="news-impact-badge impact-bearish"><ArrowDown /> Bearish Impact</span>}
                          {n.direction === "WAIT" && <span className="news-impact-badge impact-neutral">No Clear Impact</span>}
                        </div>
                        <span className="news-time">{formatTime(n.timestamp)}</span>
                      </div>

                      <div className="news-impact-label">
                        {n.direction === "BUY" && <span className="impact-text bullish">May push price higher — watch for BUY entries if news beats expectations</span>}
                        {n.direction === "SELL" && <span className="impact-text bearish">May push price lower — watch for SELL entries if news misses expectations</span>}
                        {n.direction === "WAIT" && <span className="impact-text neutral">Low impact — unlikely to move the market significantly, no actionable trade</span>}
                      </div>

                      {n.direction !== "WAIT" && n.entry > 0 && (
                        <div className="news-setup-row">
                          <div className="news-setup-item"><span>Entry</span><b>{n.entry}</b></div>
                          <div className="news-setup-item"><span>SL</span><b style={{ color: "#FF5252" }}>{n.stopLoss}</b></div>
                          <div className="news-setup-item"><span>TP</span><b style={{ color: "#22C55E" }}>{n.takeProfit}</b></div>
                          <div className="news-setup-item"><span>R:R</span><b style={{ color: "#7C6AFF" }}>1:{n.riskReward}</b></div>
                          <div className="news-setup-item"><span>Confidence</span><b style={{ color: n.confidence >= 70 ? "#22C55E" : "#FF9500" }}>{n.confidence}%</b></div>
                        </div>
                      )}

                      <div className="news-reasoning">
                        {n.reasoning}
                      </div>

                      <div className="news-footer">
                        <span>Forex Factory Calendar</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activePage === "markets" && (
            <>
              <div className="flex flex-wrap gap-2 mb-5">
                {MONITORED_PAIRS.map(pair => (
                  <button key={pair} className="f-mono" style={{ fontSize: "0.72rem", fontWeight: 600, padding: "7px 14px", borderRadius: 6, border: `1px solid ${selectedMarket === pair ? "#7C6AFF55" : "#1A1929"}`, color: selectedMarket === pair ? "#7C6AFF" : "#5A5470", background: selectedMarket === pair ? "#7C6AFF12" : "transparent", cursor: "pointer", transition: "all 0.15s" }} onClick={() => setSelectedMarket(pair)}>{pair}</button>
                ))}
              </div>

              <div className="card mb-6" style={{ height: 500, position: "relative", overflow: "hidden" }}>
                <div id="tv-chart-container" style={{ height: "100%", width: "100%" }} />
                {chartLoading && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0F", zIndex: 10 }}>
                    <div style={{ textAlign: "center" }}>
                      <div className="pulse" style={{ width: 32, height: 32, border: "3px solid #7C6AFF", borderRadius: "50%", borderTopColor: "transparent", margin: "0 auto 10px" }} />
                      <div className="f-mono" style={{ fontSize: "0.7rem", color: "#3D3B52" }}>Loading chart...</div>
                    </div>
                  </div>
                )}
              </div>

              {analysisLoading ? (
                <div className="card p-6 mb-6 text-center">
                  <div className="pulse mx-auto mb-3" style={{ width: 24, height: 24, border: "2px solid #7C6AFF", borderRadius: "50%", borderTopColor: "transparent" }} />
                  <div className="f-mono" style={{ color: "#3D3B52", fontSize: "0.78rem" }}>Analyzing {selectedMarket}...</div>
                </div>
              ) : marketAnalysis && (
                <div className="fade-in">
                  <div className="card p-5 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <TargetIcon />
                      <span className="f-sans" style={{ fontSize: "0.95rem", fontWeight: 600, color: "#E2DDD6" }}>Analysis — {selectedMarket}</span>
                      <span className={`f-mono px-2.5 py-0.5 rounded text-xs font-semibold ${marketAnalysis.bias === "BULLISH" ? "dir-buy" : marketAnalysis.bias === "BEARISH" ? "dir-sell" : "badge-neutral"}`}>{marketAnalysis.bias}</span>
                      {marketAnalysis.setup?.direction && (
                        <span className={`f-mono px-2.5 py-0.5 rounded text-xs font-bold ${marketAnalysis.setup.direction === "BUY" ? "dir-buy" : "dir-sell"}`}>{marketAnalysis.setup.direction} 1:{marketAnalysis.setup.rr}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {marketAnalysis.keyLevels.map((lvl, i) => (
                        <div key={i} className="card p-3" style={{ background: "#0A0A0F" }}>
                          <div className="f-mono" style={{ fontSize: "0.5rem", color: "#3D3B52", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{lvl.label}</div>
                          <div className="f-mono" style={{ fontSize: "0.85rem", fontWeight: 600, color: lvl.type === "fvg" || lvl.type === "ob" ? "#A855F7" : lvl.type === "support" || lvl.type === "demand" ? "#22C55E" : lvl.type === "resistance" || lvl.type === "supply" ? "#FF5252" : "#E2DDD6" }}>{lvl.price}</div>
                        </div>
                      ))}
                    </div>

                    {marketAnalysis.setup && (
                      <div className="card p-4 mb-4" style={{ background: "#0A0A0F", borderLeft: `3px solid ${marketAnalysis.setup.direction === "BUY" ? "#22C55E" : "#FF5252"}` }}>
                        <div className="f-mono" style={{ fontSize: "0.5rem", color: "#3D3B52", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Suggested Setup</div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div><div className="f-mono" style={{ fontSize: "0.5rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 2 }}>Entry</div><div className="f-mono" style={{ fontSize: "0.9rem", color: "#E2DDD6", fontWeight: 600 }}>{marketAnalysis.setup.entry}</div></div>
                          <div><div className="f-mono" style={{ fontSize: "0.5rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 2 }}>Stop Loss</div><div className="f-mono" style={{ fontSize: "0.9rem", color: "#FF5252", fontWeight: 600 }}>{marketAnalysis.setup.sl}</div></div>
                          <div><div className="f-mono" style={{ fontSize: "0.5rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 2 }}>Take Profit</div><div className="f-mono" style={{ fontSize: "0.9rem", color: "#22C55E", fontWeight: 600 }}>{marketAnalysis.setup.tp}</div></div>
                          <div><div className="f-mono" style={{ fontSize: "0.5rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 2 }}>R:R</div><div className="f-mono" style={{ fontSize: "0.9rem", color: "#7C6AFF", fontWeight: 600 }}>1:{marketAnalysis.setup.rr}</div></div>
                          <div><div className="f-mono" style={{ fontSize: "0.5rem", color: "#3D3B52", textTransform: "uppercase", marginBottom: 2 }}>Direction</div><div className={`f-mono px-2 py-0.5 rounded text-xs font-bold ${marketAnalysis.setup.direction === "BUY" ? "dir-buy" : "dir-sell"}`} style={{ display: "inline-block", marginTop: 4 }}>{marketAnalysis.setup.direction}</div></div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 rounded-lg" style={{ background: "#0A0A0F", borderLeft: "2px solid #7C6AFF33" }}>
                      <p className="f-mono" style={{ fontSize: "0.68rem", color: "#6A6480", lineHeight: 1.6 }}>{marketAnalysis.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const pairSignals = signals.filter(s => s.pair === selectedMarket);
                  return (
                    <>
                      <div className="card p-5">
                        <div className="f-sans" style={{ fontSize: "0.9rem", fontWeight: 600, color: "#E2DDD6", marginBottom: 12 }}>{selectedMarket} — Active Signals</div>
                        {pairSignals.length === 0 ? (
                          <div className="f-mono" style={{ fontSize: "0.72rem", color: "#3D3B52" }}>No active signals</div>
                        ) : (
                          <div className="space-y-2">
                            {pairSignals.slice(0, 5).map(s => (
                              <div key={s._id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #1A1929" }}>
                                <span className={`signal-direction ${s.direction === "BUY" ? "dir-buy" : "dir-sell"}`} style={{ fontSize: "0.65rem", padding: "2px 8px" }}>{s.direction}</span>
                                <span className="f-mono" style={{ fontSize: "0.68rem", color: "#E2DDD6" }}>{s.entry}</span>
                                <span className="f-mono" style={{ fontSize: "0.62rem", color: "#FF5252" }}>SL: {s.stopLoss}</span>
                                <span className="f-mono" style={{ fontSize: "0.62rem", color: "#22C55E" }}>TP: {s.takeProfit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="card p-5">
                        <div className="f-sans" style={{ fontSize: "0.9rem", fontWeight: 600, color: "#E2DDD6", marginBottom: 12 }}>Consensus</div>
                        {(() => {
                          const buys = pairSignals.filter(s => s.direction === "BUY");
                          const sells = pairSignals.filter(s => s.direction === "SELL");
                          if (pairSignals.length === 0) return <div className="f-mono" style={{ fontSize: "0.72rem", color: "#3D3B52" }}>No data yet</div>;
                          return (
                            <div className="space-y-3">
                              {buys.length > 0 && (
                                <div className="p-3 rounded" style={{ background: "#22C55E0D", border: "1px solid #22C55E22" }}>
                                  <div className="f-mono" style={{ fontSize: "0.5rem", color: "#22C55E", textTransform: "uppercase", marginBottom: 3 }}>Buy Interest</div>
                                  <div className="f-mono" style={{ fontSize: "0.9rem", color: "#22C55E", fontWeight: 700 }}>{buys.length} signal{buys.length > 1 ? "s" : ""}</div>
                                </div>
                              )}
                              {sells.length > 0 && (
                                <div className="p-3 rounded" style={{ background: "#FF52520D", border: "1px solid #FF525222" }}>
                                  <div className="f-mono" style={{ fontSize: "0.5rem", color: "#FF5252", textTransform: "uppercase", marginBottom: 3 }}>Sell Interest</div>
                                  <div className="f-mono" style={{ fontSize: "0.9rem", color: "#FF5252", fontWeight: 700 }}>{sells.length} signal{sells.length > 1 ? "s" : ""}</div>
                                </div>
                              )}
                              <div className="p-3 rounded" style={{ background: "#7C6AFF0D", border: "1px solid #7C6AFF22" }}>
                                <div className="f-mono" style={{ fontSize: "0.5rem", color: "#7C6AFF", textTransform: "uppercase", marginBottom: 3 }}>Bias</div>
                                <div className="f-mono" style={{ fontSize: "0.85rem", color: "#E2DDD6", fontWeight: 600 }}>
                                  {buys.length > sells.length ? "Bullish" : buys.length < sells.length ? "Bearish" : "Neutral"}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
