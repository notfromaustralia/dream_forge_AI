import { NextRequest, NextResponse } from "next/server";

const TENANT_ID = process.env.AZURE_TENANT_ID ?? "";
const CLIENT_ID = process.env.AZURE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET ?? "";

export async function POST(request: NextRequest) {
  try {
    const { assertion } = await request.json();
    if (!assertion || !TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 400 });
    }

    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      assertion,
      scope: "https://graph.microsoft.com/.default",
      requested_token_use: "on_behalf_of",
    });

    const res = await fetch(tokenUrl, { method: "POST", body });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }
}
