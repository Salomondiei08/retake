"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wand2, FlaskConical, ArrowLeft, History, LogOut, Layers } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NAV = [
  {
    label: "Playground",
    href: "/dashboard",
    icon: Wand2,
    description: "Self-healing generation",
  },
  {
    label: "Batch",
    href: "/dashboard/batch",
    icon: Layers,
    description: "Run many prompts at once",
  },
  {
    label: "CI Suite",
    href: "/dashboard/suite",
    icon: FlaskConical,
    description: "Prompt regression tests",
  },
  {
    label: "History",
    href: "/dashboard/history",
    icon: History,
    description: "Past generation runs",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      style={{
        width: 224,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--line)",
        background: "var(--bg-1)",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div className="logo-mark" style={{ width: 32, height: 32, fontSize: 14 }}>
          R
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--fg)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            Retake
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--fg-3)",
              marginTop: 3,
              lineHeight: 1,
            }}
          >
            AI Video DevTools
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "4px 12px 8px",
          }}
        >
          Tools
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-item${active ? " active" : ""}`}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: active
                    ? "color-mix(in oklch, var(--rt-accent) 14%, transparent)"
                    : "var(--bg-2)",
                  transition: "background 200ms",
                }}
              >
                <Icon
                  size={14}
                  style={{
                    color: active ? "var(--rt-accent)" : "var(--fg-2)",
                    transition: "color 200ms",
                  }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--fg)" : "var(--fg-2)",
                    lineHeight: 1,
                    transition: "color 200ms",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--fg-3)",
                    marginTop: 3,
                    lineHeight: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        style={{
          padding: "8px 8px 12px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* User info */}
        {session?.user && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              marginBottom: 4,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--fg)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.user.name ?? session.user.email}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--fg-3)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.user.email}
            </p>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--fg-3)",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-2)";
            e.currentTarget.style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--fg-3)";
          }}
        >
          <LogOut size={12} />
          Sign out
        </button>

        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 8,
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--fg-3)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-2)";
            (e.currentTarget as HTMLElement).style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--fg-3)";
          }}
        >
          <ArrowLeft size={12} />
          Back to home
        </Link>
      </div>
    </aside>
  );
}
