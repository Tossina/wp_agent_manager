import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testWPConnection } from "@/lib/wordpress";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { url, apiKey } = await req.json();
  if (!url || !apiKey) {
    return NextResponse.json({ error: "URL et clé API requis" }, { status: 400 });
  }

  const result = await testWPConnection(url.replace(/\/$/, ""), apiKey);

  if (!result.connected) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ connected: true, version: result.version });
}
