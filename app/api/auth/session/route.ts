import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db";

/**
 * État de la session courante, appelé au montage par AuthProvider.
 * `configured: false` = pas de DATABASE_URL : l'app tourne alors
 * 100 % hors ligne et masque les contrôles de sauvegarde.
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false, pseudo: null });
  }
  try {
    const user = await getSessionUser();
    return NextResponse.json({
      configured: true,
      pseudo: user?.pseudo ?? null,
    });
  } catch (err) {
    console.error("[api] session", err);
    return NextResponse.json({ configured: false, pseudo: null });
  }
}
