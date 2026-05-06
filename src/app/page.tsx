"use client";
import { useState, useEffect, useRef } from "react";

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

function CandlestickViz({ color, data }: { color: string; data: { open: number; close: number; high: number; low: number; green: boolean }[] }) {
  const w = 800;
  const h = 260;
  const padL = 8;
  const padR = 24;
  const padT = 16;
  const padB = 32;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const candleW = chartW / data.length;

  const allPrices = data.flatMap(d => [d.high, d.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const toY = (v: number) => padT + ((maxP - v) / range) * chartH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const val = maxP - pct * range;
    const y = padT + pct * chartH;
    return { val, y, label: val.toFixed(val > 100 ? 1 : 3) };
  });

  const linePoints = data.map((d, i) => `${padL + candleW * i + candleW / 2},${toY((d.open + d.close) / 2)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id={`cg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`candle-green-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={w - padR} y2={g.y} stroke="#1A1929" strokeWidth="0.5" strokeDasharray={i === 0 || i === 4 ? "0" : "4,4"} />
          <text x={w - padR + 6} y={g.y + 3} fill="#3D3B52" fontSize="9" fontFamily="'JetBrains Mono', monospace">{g.label}</text>
        </g>
      ))}

      {data.map((d, i) => {
        const cx = padL + candleW * i + candleW / 2;
        const bodyW = candleW * 0.55;
        const isGreen = d.green;
        const bodyTop = toY(Math.max(d.open, d.close));
        const bodyBot = toY(Math.min(d.open, d.close));
        const bodyH = Math.max(bodyBot - bodyTop, 1.5);
        const fillColor = isGreen ? `url(#candle-green-${color.replace("#", "")})` : "#FF5252";

        return (
          <g key={i}>
            <line x1={cx} y1={toY(d.high)} x2={cx} y2={toY(d.low)} stroke={isGreen ? color : "#FF5252"} strokeWidth="1.2" opacity="0.5" />
            <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={fillColor} rx="0.5" />
          </g>
        );
      })}

      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1" opacity="0.25" strokeDasharray="3,3" />
      <polygon points={`0,${h} ${data.map((d, i) => `${padL + candleW * i + candleW / 2},${toY((d.open + d.close) / 2)}`).join(" ")} ${w},${h}`} fill={`url(#cg-${color.replace("#", "")})`} opacity="0.6" />

      {data.length > 1 && (() => {
        const last = data[data.length - 1];
        const lastCx = padL + candleW * (data.length - 1) + candleW / 2;
        const lastY = toY(last.close);
        return (
          <g>
            <line x1={padL} y1={lastY} x2={w - padR} y2={lastY} stroke={last.green ? color : "#FF5252"} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
            <rect x={w - padR - 4} y={lastY - 9} width="48" height="18" fill={last.green ? color : "#FF5252"} rx="2" />
            <text x={w - padR + 20} y={lastY + 3} fill="#fff" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">{last.close.toFixed(last.close > 100 ? 1 : 3)}</text>
          </g>
        );
      })()}
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
    { icon: <CreditIcon />, title: "Real-Time Signal Scanner", desc: "HTRADES scans TradingView, YouTube, Forex Factory, Twitter, and 20+ platforms 24/7 — catching setups the second they appear." },
    { icon: <UsersIcon />, title: "8 Major Markets", desc: "EUR/USD, GBP/USD, USD/JPY, XAU/USD, AUD/USD, USD/CAD, USD/CHF, NZD/USD. Full coverage of the pairs that move money." },
    { icon: <StarIcon />, title: "Trust-Verified Sources", desc: "AI ranks every source by historical accuracy. You only see signals from traders who actually know what they're doing." },
    { icon: <FeedbackIcon />, title: "Exact Entry, SL, TP", desc: "Every signal comes with precise levels. No vague suggestions. No guessing. Just actionable setups delivered instantly." },
    { icon: <DiscoverIcon />, title: "Smart Validation", desc: "Signals checked against live prices the moment they arrive. Expired setups are discarded. You only see what's still tradeable." },
    { icon: <ShieldIcon />, title: "Anti-Noise Engine", desc: "Low-quality sources, fake gurus, and spam signals are automatically filtered. You get only what's worth your attention." },
  ];

  const steps = [
    { num: "01", label: "Connect", desc: "Pick your markets. Set your risk preferences. Done in 30 seconds." },
    { num: "02", label: "Scan", desc: "HTRADES starts scanning 20+ platforms in real-time for your pairs." },
    { num: "03", label: "Alert", desc: "High-confidence setups hit your dashboard instantly. No lag." },
    { num: "04", label: "Execute", desc: "See the setup. Check the levels. Take the trade. It's that simple." },
  ];

  const markets = ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"];

  const statsReveal = useReveal();
  const marketsReveal = useReveal();
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
        }
        .btn-ghost:hover { color:#E2DDD6; border-color:#3A3850; transform:translateY(-1px); }

        .btn-outline-accent {
          background: transparent;
          color: #7C6AFF;
          border: 1px solid #7C6AFF44;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 11px 22px;
          border-radius: 50px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-outline-accent:hover { background:#7C6AFF11; border-color:#7C6AFF88; }

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
        .card::after {
          content:'';
          position:absolute;
          inset:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.028;
          pointer-events: none;
          z-index: 0;
        }
        .card > * { position: relative; z-index: 1; }

        .dot-bg {
          background-image: radial-gradient(circle, #2A2940 1.2px, transparent 1.2px);
          background-size: 28px 28px;
        }

        .step-connector { display:none; }
        @media(min-width:768px) { .step-connector { display:block; } }

        .comm-bar { width:3px; border-radius:2px; flex-shrink:0; }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
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

        .hero-grid-line {
          position: absolute;
          background: #1A1929;
        }

        .chart-glow {
          filter: drop-shadow(0 0 20px rgba(124,106,255,0.15));
        }
      `}</style>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 f-sans ${scrolled ? "nav-scrolled" : ""}`}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="f-sans" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#E2DDD6", letterSpacing: "-0.01em" }}>
            H<span style={{ color: "#7C6AFF" }}>TRADES</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden md:flex">
            {["Features", "Markets", "How It Works", "Pricing"].map(item => (
              <a key={item} href="#" className="f-mono" style={{ fontSize: "0.75rem", color: "#A09A92", letterSpacing: "0.08em", textDecoration: "none", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E2DDD6")}
                onMouseLeave={e => (e.currentTarget.style.color = "#A09A92")}
              >{item}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="hidden md:flex">
            <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: "0.82rem", color: "#E2DDD6" }}>Sign In</button>
            <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.82rem" }}>Get Early Access</button>
          </div>

          <button className="md:hidden" style={{ color: "#A09A92", background: "none", border: "none", cursor: "pointer" }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden" style={{ background: "#0A0A0F", borderBottom: "1px solid #141320", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
            {["Features", "Markets", "How It Works", "Pricing"].map(item => (
              <a key={item} href="#" className="f-mono" style={{ fontSize: "0.75rem", color: "#A09A92", letterSpacing: "0.08em", textDecoration: "none", textTransform: "uppercase" }}>{item}</a>
            ))}
            <button className="btn-primary" style={{ width: "fit-content", marginTop: 4 }}>Get Early Access</button>
          </div>
        )}
      </nav>

      <section className="dot-bg" style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 28, paddingRight: 28, position: "relative" }}>
        <div style={{ position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)", width: 700, height: 350, background: "rgba(100,80,255,0.09)", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 160, left: "35%", transform: "translateX(-50%)", width: 350, height: 200, background: "rgba(60,120,255,0.05)", borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none" }} />
        <div className="hero-grid-line" style={{ left: "35%", top: 0, bottom: 0, width: 1, opacity: 0.3 }} />
        <div className="hero-grid-line" style={{ right: "35%", top: 0, bottom: 0, width: 1, opacity: 0.3 }} />

        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #1F1E2A", borderRadius: 50, padding: "7px 16px", marginBottom: 32 }}>
            <div className="live-dot" />
            <span className="f-mono" style={{ fontSize: "0.7rem", color: "#5A5470", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scanning 20+ Platforms in Real Time</span>
          </div>

          <h1 className="f-display hero-h1" style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", lineHeight: 1.06, letterSpacing: "-0.02em", color: "#E2DDD6", margin: "0 auto 16px" }}>
            Never miss a trade again.<br />
            <em style={{ color: "#7C6AFF", fontStyle: "italic", fontSize: "clamp(1.6rem, 3.5vw, 3rem)" }}>Setups delivered before they move.</em>
          </h1>

          <p className="f-sans hero-sub" style={{ fontSize: "1.1rem", color: "#6A6480", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
            HTRADES scans TradingView, YouTube, Forex Factory, Twitter and 20+ platforms 24/7 — and delivers validated setups with exact Entry, SL & TP straight to you before the market moves.
          </p>

          <div className="hero-ctas" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary">Start for Free <ArrowRight /></button>
            <button className="btn-ghost">See How It Works</button>
          </div>

          <div ref={statsReveal.ref} className="hero-visual" style={{ marginTop: 72, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1, background: "#13121C", borderRadius: 20, overflow: "hidden" }}>
            {[
              { val: 20, suffix: "+", label: "Platforms Scanned" },
              { val: 8,  suffix: "", label: "Major Markets" },
              { val: 3,   suffix: "s", label: "Avg Alert Speed" },
              { val: 94,  suffix: "%", label: "Signal Accuracy" },
            ].map(({ val, suffix, label }, i) => (
              <div key={label} style={{ background: "#0A0A0F", padding: "28px 28px 24px", borderRight: i < 3 ? "1px solid #13121C" : "none" }}>
                <div className="f-display" style={{ fontSize: "2.4rem", color: "#E2DDD6", lineHeight: 1, marginBottom: 6 }}>
                  <Counter target={val} suffix={suffix} />
                </div>
                <div className="f-mono" style={{ fontSize: "0.68rem", color: "#3D3B52", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="sep" />

      <section style={{ padding: "100px 28px", position: "relative" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 300, background: "rgba(100,80,255,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div ref={marketsReveal.ref} style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className={`reveal ${marketsReveal.visible ? "in" : ""}`} style={{ textAlign: "center", marginBottom: 16 }}>
            <div className="accent-line" style={{ margin: "0 auto 12px" }} />
            <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Markets Covered</p>
          </div>
          <h2 className={`f-display reveal rev-d1 ${marketsReveal.visible ? "in" : ""}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#E2DDD6", lineHeight: 1.15, letterSpacing: "-0.02em", textAlign: "center", margin: "0 auto 16px", maxWidth: 500 }}>
            Real charts. Real setups.<br /><em style={{ color: "#7C6AFF", fontStyle: "italic" }}>Real time.</em>
          </h2>
          <p className={`f-sans reveal rev-d2 ${marketsReveal.visible ? "in" : ""}`} style={{ fontSize: "0.95rem", color: "#5A5470", lineHeight: 1.7, textAlign: "center", margin: "0 auto 56px", maxWidth: 500 }}>
            HTRADES monitors the 8 most traded markets on the planet. Every signal comes from real price action, real charts, real opportunities.
          </p>

          {/* Featured chart */}
          <div className={`card reveal rev-d3 ${marketsReveal.visible ? "in" : ""}`} style={{ padding: 32, marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div className="f-display" style={{ fontSize: "1.8rem", color: "#E2DDD6", letterSpacing: "-0.02em" }}>XAU/USD</div>
                  <div className="f-mono" style={{ fontSize: "0.7rem", color: "#3D3B52", letterSpacing: "0.08em" }}>Gold — 4H Timeframe</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="f-mono" style={{ fontSize: "0.6rem", color: "#4A4862", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Current</div>
                  <div className="f-display" style={{ fontSize: "1.2rem", color: "#E2DDD6" }}>2,342.50</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="f-mono" style={{ fontSize: "0.6rem", color: "#4A4862", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Signal</div>
                  <div className="f-display" style={{ fontSize: "1.2rem", color: "#7C6AFF" }}>LONG</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="f-mono" style={{ fontSize: "0.6rem", color: "#4A4862", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Confidence</div>
                  <div className="f-display" style={{ fontSize: "1.2rem", color: "#22C55E" }}>94%</div>
                </div>
              </div>
            </div>
            <CandlestickViz
              color="#7C6AFF"
              data={[
                { open: 2340, close: 2330, high: 2345, low: 2325, green: false },
                { open: 2330, close: 2338, high: 2342, low: 2328, green: true },
                { open: 2338, close: 2325, high: 2340, low: 2320, green: false },
                { open: 2325, close: 2335, high: 2338, low: 2322, green: true },
                { open: 2335, close: 2328, high: 2340, low: 2324, green: false },
                { open: 2328, close: 2340, high: 2344, low: 2326, green: true },
                { open: 2340, close: 2332, high: 2345, low: 2330, green: false },
                { open: 2332, close: 2345, high: 2348, low: 2330, green: true },
                { open: 2345, close: 2338, high: 2350, low: 2335, green: false },
                { open: 2338, close: 2348, high: 2352, low: 2336, green: true },
                { open: 2348, close: 2340, high: 2352, low: 2338, green: false },
                { open: 2340, close: 2350, high: 2354, low: 2338, green: true },
                { open: 2350, close: 2342, high: 2355, low: 2340, green: false },
                { open: 2342, close: 2352, high: 2356, low: 2340, green: true },
                { open: 2352, close: 2345, high: 2358, low: 2342, green: false },
                { open: 2345, close: 2355, high: 2360, low: 2344, green: true },
                { open: 2355, close: 2348, high: 2360, low: 2346, green: false },
                { open: 2348, close: 2360, high: 2364, low: 2346, green: true },
                { open: 2360, close: 2352, high: 2364, low: 2350, green: false },
                { open: 2352, close: 2365, high: 2368, low: 2350, green: true },
              ]}
            />
            <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
              {[
                { label: "Entry", value: "2,342.50", color: "#E2DDD6" },
                { label: "Stop Loss", value: "2,330.00", color: "#FF5252" },
                { label: "Take Profit", value: "2,368.00", color: "#22C55E" },
                { label: "Risk/Reward", value: "1:2.1", color: "#7C6AFF" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
                  <span className="f-mono" style={{ fontSize: "0.7rem", color: "#4A4862" }}>{item.label}:</span>
                  <span className="f-mono" style={{ fontSize: "0.75rem", color: item.color, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`reveal rev-d4 ${marketsReveal.visible ? "in" : ""}`} style={{ textAlign: "center", marginBottom: 40 }}>
            <p className="f-mono" style={{ fontSize: "0.65rem", color: "#3D3B52", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>ALL MARKETS MONITORED</p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              {markets.map(c => (
                <span key={c} className="tag-pill">{c}</span>
              ))}
            </div>
          </div>

          <div className={`reveal rev-d5 ${marketsReveal.visible ? "in" : ""}`} style={{ textAlign: "center" }}>
            <button className="btn-outline-accent">See All Markets <ArrowRight /></button>
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
              While you're scrolling forums and watching videos, HTRADES is already extracting the best setups and delivering them to you.
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

      <section style={{ padding: "100px 28px", background: "#080810", position: "relative" }}>
        <div style={{ position: "absolute", bottom: "10%", left: "15%", width: 400, height: 200, background: "rgba(100,80,255,0.04)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div ref={stepsReveal.ref} style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className={`reveal ${stepsReveal.visible ? "in" : ""}`} style={{ marginBottom: 16, textAlign: "center" }}>
            <div className="accent-line" style={{ margin: "0 auto 12px" }} />
            <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase" }}>How It Works</p>
          </div>
          <h2 className={`f-display reveal rev-d1 ${stepsReveal.visible ? "in" : ""}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#E2DDD6", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 60, maxWidth: 440, textAlign: "center", margin: "0 auto 60px" }}>
            From scan to trade<br />in seconds.
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
                {["3 markets monitored", "5 signals per day", "Basic alerts", "Standard delay (30s)"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: "#3A3852", flexShrink: 0 }}><CheckIcon /></div>
                    <span className="f-sans" style={{ fontSize: "0.875rem", color: "#4A4862" }}>{item}</span>
                  </div>
                ))}
              </div>
              <button className="btn-ghost" style={{ width: "100%", justifyContent: "center" }}>Get Started Free</button>
            </div>

            <div className="card pricing-featured" style={{ padding: 36, position: "relative" }}>
              <div style={{ position: "absolute", top: 16, right: 16, background: "#7C6AFF", color: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", padding: "4px 12px", borderRadius: 50, letterSpacing: "0.06em" }}>Coming Soon</div>
              <div className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Pro</div>
              <div className="f-display" style={{ fontSize: "3rem", color: "#E2DDD6", letterSpacing: "-0.02em", marginBottom: 4 }}>$19</div>
              <p className="f-mono" style={{ fontSize: "0.75rem", color: "#3A3852", marginBottom: 32 }}>per month.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {["All 8 markets monitored", "Unlimited signals", "Instant alerts (<3s)", "Push notifications", "Source accuracy tracking"].map(item => (
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
              <p className="f-mono" style={{ fontSize: "0.7rem", color: "#7C6AFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>Stop Missing Trades</p>
              <h2 className="f-display" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", color: "#E2DDD6", lineHeight: 1.1, letterSpacing: "-0.025em", maxWidth: 640, margin: "0 auto 20px" }}>
                The market doesn't wait.<br /><em style={{ color: "#7C6AFF", fontStyle: "italic" }}>Neither should you.</em>
              </h2>
              <p className="f-sans" style={{ fontSize: "1rem", color: "#5A5470", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 40px" }}>
                Join traders who let HTRADES do the scanning while they focus on executing. Real signals. Real time. Real results.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-primary">Get Early Access <ArrowRight /></button>
                <button className="btn-ghost">Learn More</button>
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
          <div className="f-mono" style={{ fontSize: "0.68rem", color: "#1F1E2A", letterSpacing: "0.06em" }}>© 2025 HTRADES. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
