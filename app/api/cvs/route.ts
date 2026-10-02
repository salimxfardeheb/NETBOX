import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { jsonError, parseSavePayload, requireUser, serverError } from "@/lib/api";
import { getPrisma } from "@/lib/db";

/**
 * Base partagée des CVs (table `cvs`) : tout compte connecté voit et
 * modifie l'ensemble des CVs — le partage était assuré par les policies
 * RLS, il l'est maintenant par ces routes (aucun filtre sur user_id en
 * lecture ; `user_id` ne sert qu'à tracer l'auteur).
 */

/** Liste des CVs, du plus récent au plus ancien. */
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const rows = await getPrisma().cv.findMany({
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ rows });
  } catch (err) {
    return serverError("Chargement de la liste", err);
  }
}

/**
 * Enregistre un CV : met à jour la ligne `id` si elle existe encore,
 * sinon en crée une. Retourne l'id de la ligne écrite.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const payload = parseSavePayload(await request.json().catch(() => null));
  if (!payload) return jsonError("Requête invalide.", 400);

  try {
    const prisma = getPrisma();
    const data = payload.data as Prisma.InputJsonValue;

    if (payload.id) {
      const updated = await prisma.cv.updateMany({
        where: { id: payload.id },
        data: { title: payload.title, data },
      });
      // Ligne encore présente : mise à jour faite. Sinon (CV supprimé
      // entre-temps), on retombe sur une création ci-dessous.
      if (updated.count > 0) return NextResponse.json({ id: payload.id });
    }

    const created = await prisma.cv.create({
      data: { userId: auth.user.id, title: payload.title, data },
      select: { id: true },
    });
    return NextResponse.json({ id: created.id });
  } catch (err) {
    return serverError("Enregistrement impossible", err);
  }
}
