"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #2A2838", borderTopColor: "#7C6AFF", animation: "spin 0.8s linear infinite" }} />;
  }

  if (status === "authenticated" && session?.user) {
    const name = session.user.name || "Trader";
    const email = session.user.email || "";
    const initial = (email.charAt(0) || name.charAt(0)).toUpperCase();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#7C6AFF",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <span className="f-mono" style={{ fontSize: "0.72rem", color: "#E2DDD6", whiteSpace: "nowrap" }}>{name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            background: "none",
            border: "1px solid #2A2838",
            color: "#A09A92",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E2DDD6")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#A09A92")}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="f-mono"
      style={{ fontSize: "0.75rem", color: "#A09A92", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#E2DDD6")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#A09A92")}
    >
      Sign in
    </Link>
  );
}
