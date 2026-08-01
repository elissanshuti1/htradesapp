import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GoogleSignIn from "@/components/GoogleSignIn";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl || "/dashboard");
  }

  const safeCallback = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden" }}>
      <style>{`
        .f-display { font-family: 'Playfair Display', Georgia, serif; }
        .f-sans { font-family: 'Syne', sans-serif; }
        .f-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 500, height: 400, background: "rgba(100,80,255,0.12)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" }} />

      <div className="card" style={{ width: "100%", maxWidth: 420, background: "#0F0E18", border: "1px solid #1A1929", borderRadius: 20, padding: "44px 36px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#7C6AFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.4rem", margin: "0 auto 22px" }}>
          H
        </div>
        <h1 className="f-display" style={{ fontSize: "1.7rem", color: "#E2DDD6", fontWeight: 600, marginBottom: 8, letterSpacing: "-0.01em" }}>
          Welcome to H<span style={{ color: "#7C6AFF" }}>TRADES</span>
        </h1>
        <p className="f-sans" style={{ fontSize: "0.9rem", color: "#6A6480", lineHeight: 1.6, marginBottom: 30 }}>
          Sign in to analyze charts and get your sniper entry — SMC or ICT, with the 20% risk guard built in.
        </p>

        <GoogleSignIn callbackUrl={safeCallback} />

        <div className="f-sans" style={{ marginTop: 24, fontSize: "0.72rem", color: "#3D3B52", lineHeight: 1.6 }}>
          Only Google sign-in is supported.
        </div>
      </div>
    </div>
  );
}
