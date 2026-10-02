import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

/** Déconnexion : suppression du cookie de session. */
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ pseudo: null });
}
