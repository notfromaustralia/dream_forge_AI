"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Plus, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isDemoAuth } from "@/lib/auth/msal-config";

const DEMO_SESSION_KEY = "dreamforge_demo_session";

function readDemoSession(): string | null {
  if (typeof window === "undefined" || !isDemoAuth()) return null;
  return sessionStorage.getItem(DEMO_SESSION_KEY);
}

function writeDemoSession(name: string | null) {
  if (typeof window === "undefined" || !isDemoAuth()) return;
  if (name) sessionStorage.setItem(DEMO_SESSION_KEY, name);
  else sessionStorage.removeItem(DEMO_SESSION_KEY);
}

export function AuthButton() {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoAuth();

  useEffect(() => {
    if (!demoMode) return;
    const stored = readDemoSession();
    if (stored) {
      setUser(stored);
    } else {
      setUser("Demo Dreamer");
      writeDemoSession("Demo Dreamer");
    }
  }, [demoMode]);

  const handleLogin = async () => {
    if (demoMode) {
      setUser("Demo Dreamer");
      writeDemoSession("Demo Dreamer");
      return;
    }
    setLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
      const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? "common";
      if (!clientId) return;
      const { PublicClientApplication } = await import("@azure/msal-browser");
      const msal = new PublicClientApplication({
        auth: {
          clientId,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          redirectUri: window.location.origin,
        },
        cache: { cacheLocation: "sessionStorage" },
      });
      await msal.initialize();
      const result = await msal.loginPopup({ scopes: ["openid", "profile", "email"] });
      setUser(result.account?.name ?? "User");
    } catch {
      // silent fail in demo
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (demoMode) {
      setUser(null);
      writeDemoSession(null);
      return;
    }
    setUser(null);
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="max-w-[8rem] truncate">{user}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-white">{user}</p>
            <p className="text-xs text-white/50">
              {demoMode ? "Demo mode — no account required" : "Signed in"}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Your universes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/universe/new">
              <Plus className="h-4 w-4" />
              Create universe
            </Link>
          </DropdownMenuItem>
          {demoMode && (
            <DropdownMenuItem asChild>
              <Link href="/">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Explore features
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogin} disabled={loading} className="gap-2">
      <LogIn className="h-4 w-4" />
      {loading ? "Signing in..." : demoMode ? "Enter as Demo Dreamer" : "Sign In"}
    </Button>
  );
}
