"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Wand2, FlaskConical, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    label: "Playground",
    href: "/dashboard",
    icon: Wand2,
    description: "Self-healing generation",
  },
  {
    label: "CI Suite",
    href: "/dashboard/suite",
    icon: FlaskConical,
    description: "Prompt regression tests",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-white/8 bg-sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Zap className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-foreground">SeedTrace</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">AI Video DevTools</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
          Tools
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                active
                  ? "bg-primary/12 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  active ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/8"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold leading-none", active ? "text-foreground" : "")}>{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-none truncate">
                  {item.description}
                </p>
              </div>
              {active && (
                <div className="ml-auto h-5 w-1 rounded-full bg-primary shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/8 space-y-1">
        <div className="px-3 py-3 rounded-xl bg-primary/8 border border-primary/15">
          <p className="text-xs font-semibold text-primary mb-1">Powered by BytePlus</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seedance 2.0 · Seed 2.0 Vision
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    </aside>
  );
}
