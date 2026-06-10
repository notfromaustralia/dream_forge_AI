"use client";

import { useState } from "react";
import { LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoAuth } from "@/lib/auth/msal-config";

export function AuthButton() {
  const [user, setUser] = useState<string | null>(isDemoAuth() ? "Demo Dreamer" : null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (isDemoAuth()) {
      setUser("Demo Dreamer");
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

  if (user) {
    return (
      <Button variant="outline" size="sm" className="gap-2">
        <User className="h-4 w-4" />
        {user}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogin} disabled={loading} className="gap-2">
      <LogIn className="h-4 w-4" />
      {loading ? "Signing in..." : "Sign In"}
    </Button>
  );
}
