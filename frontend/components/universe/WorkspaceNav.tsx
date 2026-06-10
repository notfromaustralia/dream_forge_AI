"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Swords,
  Clock,
  Network,
  BookOpen,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "overview", label: "Overview", icon: LayoutDashboard },
  { href: "characters", label: "Characters", icon: Users },
  { href: "factions", label: "Factions", icon: Swords },
  { href: "timeline", label: "Time Machine", icon: Clock },
  { href: "graph", label: "Graph", icon: Network },
  { href: "stories", label: "Stories", icon: BookOpen },
  { href: "council", label: "Council", icon: Brain },
];

export function WorkspaceNav({ universeId }: { universeId: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-white/10 bg-slate-950/50 p-4">
      <nav className="space-y-1">
        {NAV.map((item) => {
          const href = `/universe/${universeId}/${item.href}`;
          const active = pathname.includes(item.href);
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
