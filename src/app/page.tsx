"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";

const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3.5 9H14.5M14.5 9L10 4.5M14.5 9L10 13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ZapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 2L4 9H8L6.5 14L13 7H9L9.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L4 5.5V10C4 13.5 6.8 16.8 10 17.5C13.2 16.8 16 13.5 16 10V5.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.2 7.6H18L13.4 11.1L15.2 17L10 13.5L4.8 17L6.6 11.1L2 7.6H7.8L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="14.5" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 17C2 14.2 4.7 12 8 12C11.3 12 14 14.2 14 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 13C15.5 13.5 17 14.8 17 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
);
const CreditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6V10.5L13 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
);
const FeedbackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 18L6.5 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 8H13M7 10.5H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
);
const DiscoverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M7 9H11M9 7V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6H19M3 11H19M3 16H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 5L17 17M17 5L5 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
);
const TargetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4"/><path d="M9 1V3M9 15V17M1 9H3M15 9H17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
);

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1600;
        const step = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          const e = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(e * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function ChartMock() {
  const w = 520;
  const h = 300;
  const padL = 12;
  const padR = 60;
  const padT = 20;
  const padB = 30;

  const data = [
    { o: 2340, c: 2330, h: 2345, l: 2325 },
    { o: 2330, c: 2338, h: 2342, l: 2328 },
    { o: 2338, c: 2325, h: 2340, l: 2320 },
    { o: 2325, c: 2335, h: 2338, l: 2322 },
    { o: 2335, c: 2328, h: 2340, l: 2324 },
    { o: 2328, c: 2340, h: 2344, l: 2326 },
    { o: 2340, c: 2332, h: 2345, l: 2330 },
    { o: 2332, c: 2345, h: 2348, l: 2330 },
    { o: 2345, c: 2338, h: 2350, l: 2335 },
    { o: 2338, c: 2348, h: 2352, l: 2336 },
    { o: 2348, c: 2340, h: 2352, l: 2338 },
    { o: 2340, c: 2350, h: 2354, l: 2338 },
    { o: 2350, c: 2342, h: 2355, l: 2340 },
    { o: 2342, c: 2352, h: 2356, l: 2340 },
    { o: 2352, c: 2345, h: 2358, l: 2342 },
    { o: 2345, c: 2355, h: 2360, l: 2344 },
    { o: 2355, c: 2348, h: 2360, l: 2346 },
    { o: 2348, c: 2360, h: 2364, l: 2346 },
    { o: 2360, c: 2352, h: 2364, l: 2350 },
    { o: 2352, c: 2365, h: 2368, l: 2350 },
  ];

  const allPrices = data.flatMap(d => [d.h, d.l]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const toY = (v: number) => padT + ((maxP - v) / range) * (h - padT - padB);
  const candleW = (w - padL - padR) / data.length;

  const entryLevel = 2342.5;
  const slLevel = 2338.0;
  const tpLevel = 2368.0;

  const line = (level: number, color: string, label: string, left = false) => {
    const y = toY(level);
    return (
      <g key={label}>
        <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={color} strokeWidth="1.4" strokeDasharray="5,4" opacity="0.85" />
        <rect x={left ? padL : w - padR - 2} y={y - 10} width={left ? label.length * 5.6 + 16 : 60} height="20" rx="4" fill={color} />
        <text x={left ? padL + 8 : w - padR + 28} y={y + 3} fill="#fff" fontSize="10" fontFamily="'JetBrains Mono', monospace" fontWeight="600" textAnchor={left ? "start" : "middle"}>{label}</text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="mock-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C6AFF" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#7C6AFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = padT + pct * (h - padT - padB);
        const val = maxP - pct * range;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#1A1929" strokeWidth="0.6" strokeDasharray={i === 0 || i === 4 ? "0" : "4,4"} />
            <text x={w - padR + 6} y={y + 3} fill="#3D3B52" fontSize="9" fontFamily="'JetBrains Mono', monospace">{val.toFixed(1)}</text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const cx = padL + candleW * i + candleW / 2;
        const bodyW = candleW * 0.55;
        const green = d.c >= d.o;
        const top = toY(Math.max(d.o, d.c));
        const bot = toY(Math.min(d.o, d.c));
        return (
          <g key={i}>
            <line x1={cx} y1={toY(d.h)} x2={cx} y2={toY(d.l)} stroke={green ? "#7C6AFF" : "#FF5252"} strokeWidth="1" opacity="0.5" />
            <rect x={cx - bodyW / 2} y={top} width={bodyW} height={Math.max(bot - top, 1.5)} rx="0.5" fill={green ? "#7C6AFF" : "#FF5252"} />
          </g>
        );
      })}

      <polygon points={`${padL},${h - padB} ${data.map((d, i) => `${padL + candleW * i + candleW / 2},${toY((d.o + d.c) / 2)}`).join(" ")} ${w - padR},${h - padB}`} fill="url(#mock-glow)" />

      {line(tpLevel, "#22C55E", "TP 2368")}
      {line(entryLevel, "#E2DDD6", "ENTRY 2342.5")}
      {line(slLevel, "#FF5252", "SL 2338")}
    </svg>
  );
}

export default function HTradesLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { icon: <DiscoverIcon />, title: "Vision-Powered Chart Analysis", desc: "Upload any TradingView screenshot. The AI reads the price axis, candles and structure directly from your image — no manual entry, no guessing." },
    { icon: <TargetIcon />, title: "SMC or ICT — Your Choice", desc: "Pick Smart Money Concepts or Inner Circle Trader. Every level is framed in your methodology: order blocks, FVGs, liquidity pools, PD arrays, OTE." },
    { icon: <StarIcon />, title: "Sniper Entry, SL & TP", desc: "Get an ultra-precise sniper entry, a clean activation entry, and exactly where to put your stop loss and take profit. No vague zones." },
    { icon: <ShieldIcon />, title: "20% Loss Cap Built In", desc: "The risk guard sizes your position so a stop-out can never cost you more than 20% of your account — with a safe 2% default." },
    { icon: <ZapIcon />, title: "Levels in Seconds", desc: "No more staring at charts for hours. Screenshot it, drop it, and get a structured trade plan with reasoning you can trust." },
    { icon: <CreditIcon />, title: "Any Instrument, Any Timeframe", desc: "Forex, gold, indices, crypto — if you can screenshot it, we can analyze it. Works on any timeframe your chart is set to." },
  ];

  const steps = [
    { num: "01", label: "Screenshot", desc: "Grab a screenshot of your TradingView chart with price levels visible." },
    { num: "02", label: "Choose SMC / ICT", desc: "Select the institutional methodology you trade with. We adapt to it." },
    { num: "03", label: "Analyze", desc: "The AI reads the structure and maps your exact entry, stop loss and take profit." },
    { num: "04", label: "Execute", desc: "Size your position with the built-in risk guard so you never lose more than 20%." },
  ];

  const heroReveal = useReveal();
  const featuresReveal = useReveal();
  const stepsReveal = useReveal();
  const ctaReveal = useReveal();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#E2DDD6] overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; }

        .f-display { font-family: 'Playfair Display', Georgia, serif; }
        .f-sans    { font-family: 'Syne', sans-serif; }
        .f-mono    { font-family: 'JetBrains Mono', monospace; }

        .hero-badge  { opacity:0; transform:translateY(16px) scale(0.96); animation: rise 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) forwards; }
        .hero-h1     { opacity:0; transform:translateY(24px);              animation: rise 0.75s 0.22s cubic-bezier(0.22,1,0.36,1) forwards; }
        .hero-sub    { opacity:0; transform:translateY(20px);              animation: rise 0.7s 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
        .hero-ctas   { opacity:0; transform:translateY(16px);              animation: rise 0.65s 0.52s cubic-bezier(0.22,1,0.36,1) forwards; }
        .hero-visual { opacity:0; transform:translateY(32px);              animation: rise 0.9s 0.62s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes rise { to { opacity:1; transform:none; } }

        .reveal-wrap { overflow: hidden; }
        .reveal      { opacity:0; transform:translateY(28px); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .reveal.in   { opacity:1; transform:none; }
        .rev-d1 { transition-delay: 0.05s; }
        .rev-d2 { transition-delay: 0.12s; }
        .rev-d3 { transition-delay: 0.19s; }
        .rev-d4 { transition-delay: 0.26s; }
        .rev-d5 { transition-delay: 0.33s; }
        .rev-d6 { transition-delay: 0.40s; }

        .c-hover { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.25s, box-shadow 0.3s; }
        .c-hover:hover { transform: translateY(-5px); border-color: #7C6AFF44; box-shadow: 0 12px 40px rgba(100,80,255,0.12); }

        .btn-primary {
          background: #7C6AFF;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 14px 28px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          letter-spacing: 0.01em;
          text-decoration: none;
        }
        .btn-primary:hover { background:#6A58EE; transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,106,255,0.35); }
        .btn-primary:active { transform:translateY(0); }

        .btn-ghost {
          background: transparent;
          color: #7A746C;
          font-family: 'Syne', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          padding: 14px 28px;
          border-radius: 50px;
          border: 1px solid #1F1E2A;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s, border-color 0.2s, transform 0.2s;
          text-decoration: none;
        }
        .btn-ghost:hover { color:#E2DDD6; border-color:#3A3850; transform:translateY(-1px); }

        .accent-line { width: 32px; height: 2px; background: #7C6AFF; border-radius: 2px; margin-bottom: 1.2rem; }

        .tag-pill { font-family:'JetBrains Mono',monospace; font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; padding:6px 14px; border-radius:50px; border:1px solid #1F1E2A; color:#5A5470; transition:color 0.2s, border-color 0.2s; cursor:pointer; }
        .tag-pill:hover { color:#7C6AFF; border-color:#7C6AFF55; }

        .sep { border:none; border-top:1px solid #13121C; }

        .card {
          background: #0F0E18;
          border: 1px solid #1A1929;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content:'';
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:1px;
          background: linear-gradient(90deg, transparent, #7C6AFF22, transparent);
          z-index:1;
        }
        .card > * { position: relative; z-index: 1; }

        .dot-bg {
          background-image: radial-gradient(circle, #2A2940 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }

        .step-connector { display:none; }
        @media(min-width:768px) { .step-connector { display:block; } }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .live-dot { width:7px; height:7px; background:#22C55E; border-radius:50%; animation:pulse 2s ease-in-out infinite; }

        .icon-ring {
          width: 44px; height: 44px; border-radius: 14px;
          background: #13121E;
          border: 1px solid #252336;
          display: flex; align-items: center; justify-content: center;
          color: #7C6AFF;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(124,106,255,0.08);
        }

        .pricing-featured { border-color: #7C6AFF44; box-shadow: 0 0 40px rgba(124,106,255,0.06); }

        .nav-scrolled { background: rgba(10,10,15,0.92); backdrop-filter: blur(14px); border-bottom: 1px solid #141320; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }

        .chart-glow { filter: drop-shadow(0 0 20px rgba(124,106,255,0.15)); }
      `}</style>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 f-sans ${scrolled ? "nav-scrolled" : ""}`}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="f-sans" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#E2DDD6", letterSpacing: "-0.01em" }}>
            H<span style={{ color: "#7C6AFF" }}>TRADES</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden md:flex">
            {["Features", "Methodologies", "How It Works", "Pricing"].map(item => (
              <a key={item} href="#" className="f-mono" style={{ fontSize: "0.75rem", color: "#A09A92", letterSpacing: "0.08em", textDecoration: "none", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E2DDD6")}
                onMouseLeave={e => (e.currentTarget.style.color = "#A09A92")}
              >{item}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="hidden md:flex">
            <AuthButton />
            <Link href="/dashboard" className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.82rem" }}>Analyze a Chart</Link>
          </div>

          <button className="md:hidden" style={{ color: "#A09A92", background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden" style={{ background: "#0A0A0F", borderBottom: "1px solid #141320", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
            {["Features", "Methodologies", "How It Works", "Pricing"].map(item => (
              <a key={item} href="#" className="f-mono" style={{ fontSize: "0.75rem", color: "#A09A92", letterSpacing: "0.08em", textDecoration: "none", textTransform: "uppercase" }}>{item}</a>
            ))}
            <AuthButton />
            <Link href="/dashboard" className="btn-primary" style={{ width: "fit-content", marginTop: 4, textDecoration: "none" }}>Analyze a Chart</Link>
          </div>
        )}
      </nav>

      <section className="dot-bg" style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 28, paddingRight: 28, position: "relative" }}>
        <div style={{ position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)", width: 700, height: 350, background: "rgba(100,80,255,0.09)", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 160, left: "35%", transform: "translateX(-50%)", width: 350, height: 200, background: "rgba(60,120,255,0.05)", borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #1F1E2A", borderRadius: 50, padding: "7px 16px", marginBottom: 32 }}>
            <div className="live-dot" />
            <span className="f-mono" style={{ fontSize: "0.7rem", color: "#5A5470", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Chart Analysis · SMC & ICT</span>
          </div>

          <h1 className="f-display hero-h1" style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", lineHeight: 1.06, letterSpacing: "-0.02em", color: "#E2DDD6", margin: "0 auto 16px" }}>
            Screenshot a chart.<br />
            <em style={{ color: "#7C6AFF", fontStyle: "italic", fontSize: "clamp(1.6rem, 3.5vw, 3rem)" }}>Get your sniper entry in seconds.</em>
          </h1>

          <p className="f-sans hero-sub" style={{ fontSize: "1.1rem", color: "#6A6480", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px" }}>
            Upload a TradingView screenshot, pick <b style={{ color: "#E2DDD6" }}>SMC</b> or <b style={{ color: "#E2DDD6" }}>ICT</b>, and HTRADES reads the structure to hand you the exact entry, stop loss and take profit — with a hard cap so you never risk more than 20% of your account.
          </p>

          <div className="hero-ctas" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn-primary">Analyze a Chart Free <ArrowRight /></Link>
            <a className="btn-ghost" href="#how">See How It Works</a>
          </div>

          <div ref={heroReveal.ref} className="hero-visual" style={{ marginTop: 72, textAlign: "left" }}>
            <div className="card chart-glow" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="icon-ring"><TargetIcon /></div>
                  <div>
                    <div className="f-display" style={{ fontSize: "1.2rem", color: "#E2DDD6", letterSpacing: "-0.02em" }}>XAU/USD — H1</div>
                    <div className="f-mono" style={{ fontSize: "0.65rem", color: "#3D3B52", letterSpacing: "0.08em" }}>SMART MONEY CONCEPTS</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div className="f-mono" style={{ fontSize: "0.6rem", color: "#4A4862", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Signal</div>
                    <div className="f-display" style={{ fontSize: "1.2rem", color: "#22C55E" }}>LONG</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="f-mono" style={{ fontSize: "0.6rem", color: "#4A4862", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Confidence</div>
                    <div className="f-display" style={{ fontSize: "1.2rem", color: "#22C55E" }}>94%</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="f-mono" style={{ fontSize: "0.6rem", color: "#4A4862", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Risk Cap</div>
                    <div className="f-display" style={{ fontSize: "1.2rem", color: "#7C6AFF" }}>≤ 20%</div>
                  </div>
                </div>
              </div>
              <ChartMock />
              <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Sniper Entry", value: "2,342.50", color: "#E2DDD6" },
                  { label: "Stop Loss", value: "2,338.00", color: "#FF5252" },
                  { label: "Take Profit", value: "2,368.00", color: "#22C55E" },
                  { label: "Risk/Reward", value: "1:4.0", color: "#7C6AFF" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
                    <span className="f-mono" style={{ fontSize: "0.7rem", color: "#4A4862" }}>{item.label}:</span>
                    <span className="f-mono" style={{ fontSize: "0.75rem", color: item.color, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="sep" />

      <section style={{ padding: "100px 28px", position: "relative" }}>
        <div style={{ position: "absolute", top: "20%", right: "-10%", width: 400, height: 300, background: "rgba(100,80,255,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div ref={featuresReveal.ref} style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-end", marginBottom: 56, justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div className={`reveal rev-d1 ${featuresReveal.visible ? "in" : ""}`}>
                <div className="accent-line" style={{ margin: "0 auto 12px" }} />
                <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Platform Features</p>
              </div>
              <h2 className={`f-display reveal rev-d2 ${featuresReveal.visible ? "in" : ""}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#E2DDD6", lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 auto" }}>
                The unfair advantage<br />every trader deserves.
              </h2>
            </div>
            <p className={`f-sans reveal rev-d3 ${featuresReveal.visible ? "in" : ""}`} style={{ fontSize: "1rem", color: "#5A5470", lineHeight: 1.7, maxWidth: 340 }}>
              While others stare at charts for hours, HTRADES reads them for you — then hands you a disciplined plan with risk already managed.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className={`card c-hover reveal rev-d${Math.min(i + 1, 6)} ${featuresReveal.visible ? "in" : ""}`} style={{ padding: 32 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
                  <div className="icon-ring">{f.icon}</div>
                  <h3 className="f-sans" style={{ fontSize: "1rem", fontWeight: 600, color: "#D4CFc8", lineHeight: 1.3, paddingTop: 4 }}>{f.title}</h3>
                </div>
                <p className="f-sans" style={{ fontSize: "0.875rem", color: "#4A4862", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="sep" />

      <section style={{ padding: "100px 28px", position: "relative" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 300, background: "rgba(100,80,255,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="accent-line" style={{ margin: "0 auto 12px" }} />
            <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Two Methodologies</p>
            <h2 className="f-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#E2DDD6", lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 auto 16px" }}>
              Pick your school.<br /><em style={{ color: "#7C6AFF", fontStyle: "italic" }}>We speak both.</em>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, maxWidth: 860, margin: "0 auto" }}>
            <div className="card c-hover" style={{ padding: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="icon-ring"><TargetIcon /></div>
                <h3 className="f-display" style={{ fontSize: "1.4rem", color: "#E2DDD6", letterSpacing: "-0.01em" }}>SMC</h3>
              </div>
              <p className="f-sans" style={{ fontSize: "0.875rem", color: "#4A4862", lineHeight: 1.7, marginBottom: 20 }}>
                Smart Money Concepts reads institutional footprints: order blocks, fair value gaps, liquidity sweeps, displacement and market structure.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Order Blocks", "FVG", "Liquidity Sweeps", "BOS / CHoCH", "Supply & Demand"].map(t => (
                  <span key={t} className="tag-pill" style={{ fontSize: "0.62rem" }}>{t}</span>
                ))}
              </div>
            </div>

            <div className="card c-hover pricing-featured" style={{ padding: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="icon-ring" style={{ color: "#A855F7" }}><StarIcon /></div>
                <h3 className="f-display" style={{ fontSize: "1.4rem", color: "#E2DDD6", letterSpacing: "-0.01em" }}>ICT</h3>
              </div>
              <p className="f-sans" style={{ fontSize: "0.875rem", color: "#4A4862", lineHeight: 1.7, marginBottom: 20 }}>
                Inner Circle Trader builds the full narrative: liquidity pools, PD arrays, kill zones, OTE and premium/discount pricing.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Liquidity Pools", "PD Arrays", "OTE", "Kill Zones", "Power of Three"].map(t => (
                  <span key={t} className="tag-pill" style={{ fontSize: "0.62rem" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="sep" />

      <section id="how" style={{ padding: "100px 28px", background: "#080810", position: "relative" }}>
        <div style={{ position: "absolute", bottom: "10%", left: "15%", width: 400, height: 200, background: "rgba(100,80,255,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div ref={stepsReveal.ref} style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className={`reveal ${stepsReveal.visible ? "in" : ""}`} style={{ marginBottom: 16, textAlign: "center" }}>
            <div className="accent-line" style={{ margin: "0 auto 12px" }} />
            <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase" }}>How It Works</p>
          </div>
          <h2 className={`f-display reveal rev-d1 ${stepsReveal.visible ? "in" : ""}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#E2DDD6", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 60, maxWidth: 440, textAlign: "center", margin: "0 auto 60px" }}>
            From screenshot to setup<br />in seconds.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, position: "relative" }}>
            {steps.map((s, i) => (
              <div key={i} className={`card reveal rev-d${i + 1} ${stepsReveal.visible ? "in" : ""}`} style={{ padding: "36px 28px" }}>
                <div className="f-mono" style={{ fontSize: "0.65rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>Step {s.num}</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#13121E", border: "1px solid #1F1E2E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <span className="f-display" style={{ fontSize: "0.85rem", color: "#7C6AFF", fontStyle: "italic" }}>{i + 1}</span>
                </div>
                <h3 className="f-display" style={{ fontSize: "1.5rem", color: "#D4CFC8", marginBottom: 10, letterSpacing: "-0.01em" }}>{s.label}</h3>
                <p className="f-sans" style={{ fontSize: "0.875rem", color: "#4A4862", lineHeight: 1.65 }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", color: "#1F1E2A", fontSize: "1.2rem", zIndex: 2 }} className="step-connector">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="sep" />

      <section style={{ padding: "100px 28px", position: "relative" }}>
        <div style={{ position: "absolute", top: "10%", right: "15%", width: 300, height: 200, background: "rgba(100,80,255,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="accent-line" style={{ margin: "0 auto 14px" }} />
            <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Pricing</p>
            <h2 className="f-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#E2DDD6", letterSpacing: "-0.02em" }}>Start free. Upgrade when ready.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, maxWidth: 760, margin: "0 auto" }}>
            <div className="card" style={{ padding: 36 }}>
              <div className="f-mono" style={{ fontSize: "0.7rem", color: "#5A5470", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Free</div>
              <div className="f-display" style={{ fontSize: "3rem", color: "#E2DDD6", letterSpacing: "-0.02em", marginBottom: 4 }}>$0</div>
              <p className="f-mono" style={{ fontSize: "0.75rem", color: "#3A3852", marginBottom: 32 }}>Forever free.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {["5 chart analyses per day", "SMC & ICT analysis", "Entry, SL, TP & key levels", "20% risk guard & position size"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: "#3A3852", flexShrink: 0 }}><CheckIcon /></div>
                    <span className="f-sans" style={{ fontSize: "0.875rem", color: "#4A4862" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" className="btn-primary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>Analyze Free</Link>
            </div>

            <div className="card pricing-featured" style={{ padding: 36, position: "relative" }}>
              <div style={{ position: "absolute", top: 16, right: 16, background: "#7C6AFF", color: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", padding: "4px 12px", borderRadius: 50, letterSpacing: "0.06em" }}>Coming Soon</div>
              <div className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Pro</div>
              <div className="f-display" style={{ fontSize: "3rem", color: "#E2DDD6", letterSpacing: "-0.02em", marginBottom: 4 }}>$19</div>
              <p className="f-mono" style={{ fontSize: "0.75rem", color: "#3A3852", marginBottom: 32 }}>per month.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {["Unlimited chart analyses", "All instruments & timeframes", "Faster analysis queue", "Analysis history", "Priority support"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: "#7C6AFF", flexShrink: 0 }}><CheckIcon /></div>
                    <span className="f-sans" style={{ fontSize: "0.875rem", color: "#7A748C" }}>{item}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>Join Waitlist</button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 28px", position: "relative" }}>
        <div style={{ position: "absolute", top: "30%", left: "-5%", width: 350, height: 250, background: "rgba(60,120,255,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div ref={ctaReveal.ref} style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className={`card dot-bg reveal ${ctaReveal.visible ? "in" : ""}`} style={{ padding: "80px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 250, background: "rgba(100,80,255,0.08)", borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="accent-line" style={{ margin: "0 auto 18px" }} />
              <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>Stop Guessing Entries</p>
              <h2 className="f-display" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", color: "#E2DDD6", lineHeight: 1.1, letterSpacing: "-0.025em", maxWidth: 640, margin: "0 auto 20px" }}>
                Your chart already has the setup.<br /><em style={{ color: "#7C6AFF", fontStyle: "italic" }}>Let the AI find it.</em>
              </h2>
              <p className="f-sans" style={{ fontSize: "1rem", color: "#5A5470", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 40px" }}>
                Screenshot, upload, and trade with a plan — entry, stop loss, take profit, and a risk guard that caps your downside at 20%.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/dashboard" className="btn-primary">Analyze Your First Chart <ArrowRight /></Link>
                <a className="btn-ghost" href="#how">How It Works</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #13121C", padding: "40px 28px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div className="f-sans" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#E2DDD6" }}>HT<span style={{ color: "#7C6AFF" }}>RADES</span></div>
          <div style={{ display: "flex", gap: 28 }}>
            {["Privacy", "Terms", "Contact", "Blog"].map(item => (
              <a key={item} href="#" className="f-mono" style={{ fontSize: "0.68rem", color: "#2D2B3C", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#7C6AFF")}
                onMouseLeave={e => (e.currentTarget.style.color = "#2D2B3C")}
              >{item}</a>
            ))}
          </div>
          <div className="f-mono" style={{ fontSize: "0.68rem", color: "#1F1E2A", letterSpacing: "0.06em" }}>© 2026 HTRADES. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
