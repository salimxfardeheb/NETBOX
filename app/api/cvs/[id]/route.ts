import { NextResponse, type NextRequest } from "next/server";
import { isUuid, jsonError, requireUser, serverError } from "@/lib/api";
import { getPrisma } from "@/lib/db";

/** Lecture et suppression d'un CV de la base partagée. */

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!isUuid(id)) return jsonError("Identifiant invalide.", 400);

  try {
    const row = await getPrisma().cv.findUnique({
      where: { id },
      select: { title: true, data: true },
    });
    if (!row) return jsonError("CV introuvable (supprimé ?)", 404);
    return NextResponse.json(row);
  } catch (err) {
    return serverError("Ouverture impossible", err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!isUuid(id)) return jsonError("Identifiant invalide.", 400);

  try {
    // deleteMany : pas d'erreur si la ligne a déjà disparu.
    await getPrisma().cv.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("Suppression impossible", err);
  }
}
