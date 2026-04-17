"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Wand2, FlaskConical, ArrowLeft, BarChart3 } from "lucide-react";
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
    <aside className="w-56 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d0d]">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
            <Zap className="h-3.5 w-3.5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">SeedTrace</p>
            <p className="text-[10px] text-white/30 leading-none mt-0.5">AI DevTools</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        <p className="px-2 py-2 text-[10px] font-medium text-white/25 uppercase tracking-widest">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                active
                  ? "bg-green-500/10 text-white"
                  : "text-white/40 hover:text-white/80 hover:bg-white/4"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-green-400" : "text-white/30 group-hover:text-white/60"
                )}
              />
              <div>
                <p className="text-xs font-medium leading-none">{item.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5 leading-none">
                  {item.description}
                </p>
              </div>
              {active && (
                <div className="ml-auto h-4 w-0.5 rounded-full bg-green-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/5 space-y-0.5">
        <div className="px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-3 w-3 text-green-400" />
            <p className="text-[10px] font-medium text-green-400">Powered by</p>
          </div>
          <p className="text-[10px] text-white/30 leading-relaxed">
            Seedance 2.0 · Seed 2.0 Vision
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/25 hover:text-white/50 transition-colors text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to home
        </Link>
      </div>
    </aside>
  );
}
